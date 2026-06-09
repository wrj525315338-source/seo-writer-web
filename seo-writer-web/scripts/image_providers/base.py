from __future__ import annotations

import base64
import http.client
import json
import os
import shutil
import socket
import struct
import time
import urllib.error
import urllib.request
import zlib
from pathlib import Path
from typing import Any


class ImageGenerationError(RuntimeError):
    pass


class ImageResponseReadError(ImageGenerationError):
    pass


class ImageProvider:
    def __init__(self, base_url: str = "") -> None:
        self.base_url = base_url.strip()

    def generate_image(
        self,
        prompt: str,
        model: str,
        output_path: Path,
        aspect_ratio: str,
        output_format: str,
    ) -> Path:
        raise NotImplementedError


def first_env(names: list[str]) -> str:
    for name in names:
        value = os.environ.get(name, "").strip()
        if value:
            return value
    return ""


def require_api_key(provider: str, names: list[str]) -> str:
    api_key = first_env(names)
    if not api_key:
        readable = " or ".join(names)
        raise ImageGenerationError(f"Missing API key for {provider}. Set {readable} in .env.")
    return api_key


def endpoint_from_config(provider: str, configured: str, env_names: list[str]) -> str:
    endpoint = configured.strip() or first_env(env_names)
    if not endpoint:
        readable = " or ".join(env_names)
        raise ImageGenerationError(f"Missing image endpoint for {provider}. Set Base URL in the project or {readable} in .env.")
    return endpoint


def openai_compatible_image_endpoint(provider: str, configured: str, env_names: list[str]) -> str:
    endpoint = endpoint_from_config(provider, configured, env_names).rstrip("/")
    if endpoint.endswith("/images/generations"):
        return endpoint
    return f"{endpoint}/images/generations"


def size_from_aspect_ratio(aspect_ratio: str) -> str:
    mapping = {
        "16:9": "1600x900",
        "4:3": "1600x1200",
        "1:1": "1024x1024",
        "9:16": "900x1600",
    }
    return mapping.get(aspect_ratio, "1600x900")


def image_api_timeout() -> int:
    return int(os.environ.get("IMAGE_API_TIMEOUT", "300"))


def image_api_retries() -> int:
    try:
        return max(0, int(os.environ.get("IMAGE_API_RETRIES", "3")))
    except ValueError:
        return 3


def retry_delay_seconds(attempt: int) -> float:
    return min(8.0, 1.5 * (attempt + 1))


def read_response_body(response: Any) -> bytes:
    data = bytearray()
    while True:
        try:
            chunk = response.read(64 * 1024)
        except http.client.IncompleteRead as exc:
            data.extend(exc.partial or b"")
            raise ImageResponseReadError(
                f"IncompleteRead while reading image API response: {len(data)} bytes read, "
                f"{exc.expected} more expected."
            ) from exc
        if not chunk:
            break
        data.extend(chunk)

    expected_header = response.headers.get("Content-Length")
    if expected_header:
        try:
            expected = int(expected_header)
        except ValueError:
            expected = 0
        if expected > 0 and len(data) < expected:
            raise ImageResponseReadError(
                f"Incomplete image API response: {len(data)} bytes read, {expected - len(data)} more expected."
            )
    return bytes(data)


def is_retryable_network_error(error: BaseException) -> bool:
    return isinstance(
        error,
        (
            ImageResponseReadError,
            http.client.IncompleteRead,
            http.client.RemoteDisconnected,
            ConnectionResetError,
            TimeoutError,
            socket.timeout,
            urllib.error.URLError,
        ),
    )


def post_image_json(endpoint: str, api_key: str, payload: dict[str, Any], output_path: Path) -> Path:
    body = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        endpoint,
        data=body,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json, image/*",
        },
        method="POST",
    )
    retries = image_api_retries()
    last_error: BaseException | None = None
    for attempt in range(retries + 1):
        try:
            with urllib.request.urlopen(request, timeout=image_api_timeout()) as response:
                content_type = response.headers.get("Content-Type", "")
                data = read_response_body(response)
            break
        except urllib.error.HTTPError as exc:
            try:
                detail = read_response_body(exc).decode("utf-8", errors="replace")
            except Exception:
                detail = exc.read().decode("utf-8", errors="replace")
            raise ImageGenerationError(f"Image API HTTP {exc.code}: {detail[:1000]}") from exc
        except Exception as exc:
            last_error = exc
            if not is_retryable_network_error(exc) or attempt >= retries:
                raise ImageGenerationError(
                    f"Image API response was interrupted after {attempt + 1} attempt(s): {exc}"
                ) from exc
            time.sleep(retry_delay_seconds(attempt))
    else:
        raise ImageGenerationError(f"Image API response was interrupted: {last_error}")

    if content_type.startswith("image/"):
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_bytes(data)
        return output_path

    try:
        parsed = json.loads(data.decode("utf-8"))
    except json.JSONDecodeError as exc:
        raise ImageGenerationError("Image API returned neither image bytes nor JSON.") from exc

    return save_image_from_response(parsed, output_path)


def save_image_from_response(response: Any, output_path: Path) -> Path:
    candidate = find_image_candidate(response)
    if not candidate:
        raise ImageGenerationError("Image API response did not contain an image URL, base64 image, or local path.")

    kind, value = candidate
    output_path.parent.mkdir(parents=True, exist_ok=True)
    if kind == "base64":
        save_base64_image(value, output_path)
    elif kind == "url":
        download_image(value, output_path)
    elif kind == "path":
        source = Path(value)
        if not source.exists():
            raise ImageGenerationError(f"Provider returned a local image path that does not exist: {source}")
        shutil.copyfile(source, output_path)
    else:
        raise ImageGenerationError("Unsupported image response type.")

    if not output_path.exists() or output_path.stat().st_size == 0:
        raise ImageGenerationError(f"Image was not saved correctly: {output_path}")
    return output_path


def find_image_candidate(value: Any) -> tuple[str, str] | None:
    if isinstance(value, dict):
        for key in ("b64_json", "base64", "image_base64", "image"):
            item = value.get(key)
            if isinstance(item, str) and looks_like_base64_image(item):
                return ("base64", item)
        for key in ("url", "image_url", "image"):
            item = value.get(key)
            if isinstance(item, str) and item.startswith(("http://", "https://")):
                return ("url", item)
        for key in ("path", "file_path", "local_path"):
            item = value.get(key)
            if isinstance(item, str):
                return ("path", item)
        for item in value.values():
            found = find_image_candidate(item)
            if found:
                return found
    if isinstance(value, list):
        for item in value:
            found = find_image_candidate(item)
            if found:
                return found
    return None


def looks_like_base64_image(value: str) -> bool:
    text = value.strip()
    if text.startswith("data:image/"):
        return True
    if len(text) < 80:
        return False
    return all(char.isalnum() or char in "+/=\n\r" for char in text[:120])


def save_base64_image(value: str, output_path: Path) -> None:
    text = value.strip()
    if text.startswith("data:image/"):
        text = text.split(",", 1)[1]
    output_path.write_bytes(base64.b64decode(text))


def download_image(url: str, output_path: Path) -> None:
    retries = image_api_retries()
    last_error: BaseException | None = None
    for attempt in range(retries + 1):
        try:
            with urllib.request.urlopen(url, timeout=int(os.environ.get("IMAGE_DOWNLOAD_TIMEOUT", "180"))) as response:
                output_path.write_bytes(read_response_body(response))
            return
        except Exception as exc:
            last_error = exc
            if not is_retryable_network_error(exc) or attempt >= retries:
                raise ImageGenerationError(
                    f"Image download response was interrupted after {attempt + 1} attempt(s): {exc}"
                ) from exc
            time.sleep(retry_delay_seconds(attempt))
    raise ImageGenerationError(f"Image download response was interrupted: {last_error}")


def write_placeholder_png(output_path: Path, aspect_ratio: str) -> Path:
    width, height = {
        "16:9": (800, 450),
        "4:3": (800, 600),
        "1:1": (600, 600),
        "9:16": (450, 800),
    }.get(aspect_ratio, (800, 450))
    rgb = (88, 86, 214)
    raw = b"".join(b"\x00" + bytes(rgb) * width for _ in range(height))
    compressor = zlib.compressobj()
    data = compressor.compress(raw) + compressor.flush()

    def chunk(name: bytes, payload: bytes) -> bytes:
        return (
            struct.pack(">I", len(payload))
            + name
            + payload
            + struct.pack(">I", zlib.crc32(name + payload) & 0xFFFFFFFF)
        )

    png = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0))
        + chunk(b"IDAT", data)
        + chunk(b"IEND", b"")
    )
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_bytes(png)
    return output_path
