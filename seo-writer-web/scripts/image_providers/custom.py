from __future__ import annotations

import os
import shutil
import subprocess
from pathlib import Path

from .base import (
    ImageGenerationError,
    ImageProvider,
    endpoint_from_config,
    post_image_json,
    require_api_key,
    size_from_aspect_ratio,
    write_placeholder_png,
)


class CustomImageProvider(ImageProvider):
    def generate_image(
        self,
        prompt: str,
        model: str,
        output_path: Path,
        aspect_ratio: str,
        output_format: str,
    ) -> Path:
        fixture = os.environ.get("CUSTOM_IMAGE_FILE", "").strip()
        if fixture:
            source = Path(fixture)
            if not source.exists():
                raise ImageGenerationError(f"CUSTOM_IMAGE_FILE does not exist: {source}")
            output_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source, output_path)
            return output_path

        command = os.environ.get("CUSTOM_IMAGE_COMMAND", "").strip()
        if command:
            env = {
                **os.environ,
                "IMAGE_PROMPT": prompt,
                "IMAGE_MODEL": model,
                "IMAGE_OUTPUT_PATH": str(output_path),
                "IMAGE_ASPECT_RATIO": aspect_ratio,
                "IMAGE_OUTPUT_FORMAT": output_format,
            }
            output_path.parent.mkdir(parents=True, exist_ok=True)
            result = subprocess.run(command, shell=True, env=env, capture_output=True, text=True, timeout=600)
            if result.returncode != 0:
                raise ImageGenerationError((result.stderr or result.stdout or "CUSTOM_IMAGE_COMMAND failed").strip())
            if not output_path.exists():
                raise ImageGenerationError("CUSTOM_IMAGE_COMMAND completed but did not create IMAGE_OUTPUT_PATH.")
            return output_path

        if os.environ.get("CUSTOM_IMAGE_MOCK", "").strip() == "1":
            return write_placeholder_png(output_path, aspect_ratio)

        api_key = require_api_key("custom", ["CUSTOM_IMAGE_API_KEY", "CUSTOM_API_KEY"])
        endpoint = endpoint_from_config("custom", self.base_url, ["CUSTOM_IMAGE_BASE_URL", "CUSTOM_BASE_URL"])
        payload = {
            "model": model,
            "prompt": prompt,
            "size": size_from_aspect_ratio(aspect_ratio),
            "aspect_ratio": aspect_ratio,
            "response_format": "b64_json",
            "output_format": output_format,
        }
        return post_image_json(endpoint, api_key, payload, output_path)
