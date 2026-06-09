from __future__ import annotations

from .base import ImageGenerationError, ImageProvider
from .custom import CustomImageProvider
from .doubao import DoubaoImageProvider
from .openai_image import OpenAIImageProvider
from .qwen import QwenImageProvider


def get_provider(provider: str, base_url: str = "") -> ImageProvider:
    normalized = provider.strip().lower()
    if normalized in {"doubao", "volcengine_ark"}:
        return DoubaoImageProvider(base_url)
    if normalized == "qwen":
        return QwenImageProvider(base_url)
    if normalized == "openai_image":
        return OpenAIImageProvider(base_url)
    if normalized == "custom":
        return CustomImageProvider(base_url)
    raise ImageGenerationError(f"Unsupported image provider: {provider}")
