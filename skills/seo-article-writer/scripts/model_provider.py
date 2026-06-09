#!/usr/bin/env python3
"""Minimal environment-based chat provider for optional automated phase runs."""

from __future__ import annotations

import json
import http.client
import os
import socket
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class ModelConfig:
    provider: str
    model: str
    base_url: str | None
    api_key: str


API_KEY_ENV_BY_PROVIDER = {
    "openai": "OPENAI_API_KEY",
    "anthropic": "ANTHROPIC_API_KEY",
    "deepseek": "DEEPSEEK_API_KEY",
    "qwen": "QWEN_API_KEY",
    "doubao": "DOUBAO_API_KEY",
    "xiaomi": "XIAOMI_API_KEY",
    "custom": "CUSTOM_API_KEY",
}


def normalize_model_name(provider: str, model: str) -> str:
    if provider == "deepseek":
        if model == "deepseek-v4-Pro":
            return "deepseek-v4-pro"
        if model == "deepseek-v4-Flash":
            return "deepseek-v4-flash"
    return model


def load_config() -> ModelConfig:
    provider = os.environ.get("MODEL_PROVIDER", "openai").strip().lower()
    model = normalize_model_name(provider, os.environ.get("MODEL_NAME", "").strip())
    base_url = os.environ.get("BASE_URL", "").strip() or None

    api_key_env = API_KEY_ENV_BY_PROVIDER.get(provider, "OPENAI_API_KEY")
    api_key = os.environ.get(api_key_env, "").strip()

    if not api_key:
        raise RuntimeError(f"当前选择的是 {provider}，但 {api_key_env} 未配置。")
    if not model:
        raise RuntimeError("Missing MODEL_NAME. Set it in the environment or local run config.")

    return ModelConfig(provider=provider, model=model, base_url=base_url, api_key=api_key)


def post_json(url: str, headers: dict[str, str], payload: dict[str, Any]) -> dict[str, Any]:
    timeout = int(os.environ.get("MODEL_API_TIMEOUT", "300"))
    attempts = max(1, int(os.environ.get("MODEL_API_RETRIES", "3")))
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", **headers},
        method="POST",
    )
    for attempt in range(1, attempts + 1):
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                return json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            body = exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"Model API error {exc.code}: {body}") from exc
        except (TimeoutError, socket.timeout) as exc:
            if attempt < attempts:
                time.sleep(min(attempt * 2, 8))
                continue
            raise RuntimeError(
                f"模型接口读取超时（超过 {timeout} 秒，已重试 {attempts} 次）。Phase 4 checklist 输入较长时可能需要更久；"
                "请重试，或在 .env 中调大 MODEL_API_TIMEOUT，或为审查模型选择响应更快的 provider/model。"
            ) from exc
        except http.client.RemoteDisconnected as exc:
            if attempt < attempts:
                time.sleep(min(attempt * 2, 8))
                continue
            raise RuntimeError(
                f"模型接口断开连接且没有返回响应（已重试 {attempts} 次）。"
                "这通常是 provider 服务端关闭了长请求；请重试，或更换审查模型/provider。"
            ) from exc
        except (ConnectionError, urllib.error.URLError) as exc:
            reason = exc.reason if isinstance(exc, urllib.error.URLError) else exc
            if attempt < attempts:
                time.sleep(min(attempt * 2, 8))
                continue
            if isinstance(reason, (TimeoutError, socket.timeout)):
                raise RuntimeError(
                    f"模型接口连接超时（超过 {timeout} 秒，已重试 {attempts} 次）。请检查网络、Base URL 或调大 MODEL_API_TIMEOUT。"
                ) from exc
            raise RuntimeError(f"模型接口连接失败（已重试 {attempts} 次）：{reason}") from exc
    raise RuntimeError("模型接口调用失败。")


def chat(messages: list[dict[str, str]], temperature: float = 0.2) -> str:
    config = load_config()

    if config.provider == "anthropic":
        system_parts = [m["content"] for m in messages if m.get("role") == "system"]
        user_messages = [m for m in messages if m.get("role") != "system"]
        max_tokens = int(os.environ.get("ANTHROPIC_MAX_TOKENS") or "4096")
        payload: dict[str, Any] = {
            "model": config.model,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": user_messages,
        }
        if system_parts:
            payload["system"] = "\n\n".join(system_parts)
        data = post_json(
            config.base_url or "https://api.anthropic.com/v1/messages",
            {
                "x-api-key": config.api_key,
                "anthropic-version": "2023-06-01",
            },
            payload,
        )
        return "".join(part.get("text", "") for part in data.get("content", []))

    if config.provider == "deepseek":
        base = config.base_url or os.environ.get("DEEPSEEK_BASE_URL") or "https://api.deepseek.com/v1"
        url = base.rstrip("/") + "/chat/completions"
    elif config.provider == "qwen":
        base = (
            config.base_url
            or os.environ.get("QWEN_BASE_URL")
            or "https://dashscope.aliyuncs.com/compatible-mode/v1"
        )
        url = base.rstrip("/") + "/chat/completions"
    elif config.provider == "doubao":
        base = (
            config.base_url
            or os.environ.get("DOUBAO_BASE_URL")
            or "https://ark.cn-beijing.volces.com/api/v3"
        )
        url = base.rstrip("/") + "/chat/completions"
    elif config.provider == "xiaomi":
        base = config.base_url or os.environ.get("XIAOMI_BASE_URL") or "https://api.xiaomimimo.com/v1"
        url = base.rstrip("/") + "/chat/completions"
    elif config.provider == "custom":
        base = config.base_url or os.environ.get("CUSTOM_BASE_URL") or "https://api.openai.com/v1"
        url = base.rstrip("/") + "/chat/completions"
    else:
        base = config.base_url or "https://api.openai.com/v1"
        url = base.rstrip("/") + "/chat/completions"

    payload: dict[str, Any] = {
        "model": config.model,
        "temperature": temperature,
        "messages": messages,
    }

    data = post_json(url, {"Authorization": f"Bearer {config.api_key}"}, payload)
    return data["choices"][0]["message"]["content"]
