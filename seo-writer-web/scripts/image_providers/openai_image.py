from __future__ import annotations

from pathlib import Path

from .base import ImageProvider, endpoint_from_config, post_image_json, require_api_key, size_from_aspect_ratio


class OpenAIImageProvider(ImageProvider):
    def generate_image(
        self,
        prompt: str,
        model: str,
        output_path: Path,
        aspect_ratio: str,
        output_format: str,
    ) -> Path:
        api_key = require_api_key("openai_image", ["OPENAI_IMAGE_API_KEY", "OPENAI_API_KEY"])
        endpoint = endpoint_from_config("openai_image", self.base_url, ["OPENAI_IMAGE_BASE_URL"])
        payload = {
            "model": model,
            "prompt": prompt,
            "size": size_from_aspect_ratio(aspect_ratio),
            "response_format": "b64_json",
            "output_format": output_format,
        }
        return post_image_json(endpoint, api_key, payload, output_path)
