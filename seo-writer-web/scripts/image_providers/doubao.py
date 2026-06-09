from __future__ import annotations

from pathlib import Path

from .base import ImageProvider, first_env, openai_compatible_image_endpoint, post_image_json, require_api_key


def volcengine_ark_size_from_aspect_ratio(aspect_ratio: str) -> str:
    mapping = {
        "16:9": "2560x1440",
        "4:3": "2304x1728",
        "1:1": "2048x2048",
        "9:16": "1440x2560",
    }
    return mapping.get(aspect_ratio, "2560x1440")


class DoubaoImageProvider(ImageProvider):
    def generate_image(
        self,
        prompt: str,
        model: str,
        output_path: Path,
        aspect_ratio: str,
        output_format: str,
    ) -> Path:
        api_key = require_api_key("volcengine_ark", ["DOUBAO_IMAGE_API_KEY", "DOUBAO_API_KEY", "ARK_API_KEY"])
        base_url = self.base_url or first_env(["DOUBAO_IMAGE_BASE_URL", "DOUBAO_BASE_URL"]) or "https://ark.cn-beijing.volces.com/api/v3"
        endpoint = openai_compatible_image_endpoint("volcengine_ark", base_url, [])
        payload = {
            "model": model,
            "prompt": prompt,
            "size": volcengine_ark_size_from_aspect_ratio(aspect_ratio),
            "aspect_ratio": aspect_ratio,
            "response_format": "b64_json",
            "output_format": output_format,
        }
        return post_image_json(endpoint, api_key, payload, output_path)
