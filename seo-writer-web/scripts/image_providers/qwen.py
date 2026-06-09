from __future__ import annotations

from pathlib import Path

from .base import ImageProvider, first_env, post_image_json, require_api_key


def qwen_image_size(aspect_ratio: str) -> str:
    return {
        "16:9": "1664*928",
        "4:3": "1472*1104",
        "1:1": "1328*1328",
        "9:16": "928*1664",
    }.get(aspect_ratio, "1664*928")


class QwenImageProvider(ImageProvider):
    def generate_image(
        self,
        prompt: str,
        model: str,
        output_path: Path,
        aspect_ratio: str,
        output_format: str,
    ) -> Path:
        api_key = require_api_key("qwen", ["QWEN_IMAGE_API_KEY", "DASHSCOPE_API_KEY", "QWEN_API_KEY"])
        endpoint = (
            self.base_url.strip()
            or first_env(["QWEN_IMAGE_BASE_URL", "DASHSCOPE_IMAGE_BASE_URL"])
            or "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation"
        )
        payload = {
            "model": model,
            "input": {
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"text": prompt}
                        ],
                    }
                ]
            },
            "parameters": {
                "size": qwen_image_size(aspect_ratio),
                "watermark": False,
            },
        }
        return post_image_json(endpoint, api_key, payload, output_path)
