#!/usr/bin/env python3
"""Minimal Volcengine Ark image generation smoke test."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

from image_providers import get_provider


INVALID_ENDPOINT_OR_MODEL_MESSAGE = (
    "当前传入的 image_model_id 或 image_endpoint_id 不存在，或账号没有权限。"
    "请确认模型服务已开通，并从火山方舟官方文档或控制台复制真实 Model ID / Endpoint ID，而不是 UI 展示名称。"
)


def validate_model_id(model: str) -> None:
    if not model.strip():
        raise ValueError("model cannot be empty.")
    if re.search(r"[A-Z.\s]", model):
        raise ValueError(
            "model must be an official Volcengine Ark Model ID, for example "
            "doubao-seedream-5-0-lite-260128, not a UI display name."
        )


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate one PNG through Volcengine Ark images/generations.")
    parser.add_argument("--provider", default="volcengine_ark")
    parser.add_argument("--model", default="doubao-seedream-5-0-lite-260128")
    parser.add_argument("--prompt", default="简单测试 prompt")
    parser.add_argument("--output", type=Path, default=Path(".tmp/volcengine-ark-test.png"))
    parser.add_argument("--base-url", default="")
    parser.add_argument("--aspect-ratio", default="16:9")
    args = parser.parse_args()

    try:
        validate_model_id(args.model)
        provider = get_provider(args.provider, args.base_url)
        output = provider.generate_image(
            prompt=args.prompt,
            model=args.model,
            output_path=args.output,
            aspect_ratio=args.aspect_ratio,
            output_format=args.output.suffix.lstrip(".") or "png",
        )
    except Exception as exc:
        message = str(exc)
        if "InvalidEndpointOrModel.NotFound" in message:
            message = INVALID_ENDPOINT_OR_MODEL_MESSAGE
        print(message, file=sys.stderr)
        return 1

    print(f"saved: {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
