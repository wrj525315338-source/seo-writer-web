import type { ImageProvider } from "@/lib/types";

export interface ImageModelCatalogItem {
  label: string;
  value: string;
  modelId: string;
}

export const volcengineArkImageModels: ImageModelCatalogItem[] = [
  {
    label: "Doubao-Seedream-5.0-lite",
    value: "Doubao-Seedream-5.0-lite",
    modelId: "doubao-seedream-5-0-lite-260128"
  },
  {
    label: "Doubao-Seedream-5.0",
    value: "Doubao-Seedream-5.0",
    modelId: "doubao-seedream-5-0-260128"
  },
  {
    label: "Doubao-Seedream-4.5",
    value: "Doubao-Seedream-4.5",
    modelId: "doubao-seedream-4-5-251128"
  },
  {
    label: "Doubao-Seedream-4.0",
    value: "Doubao-Seedream-4.0",
    modelId: "doubao-seedream-4-0-250828"
  }
];

export const imageModelCatalog: Record<ImageProvider, ImageModelCatalogItem[]> = {
  doubao: volcengineArkImageModels,
  volcengine_ark: volcengineArkImageModels,
  qwen: [
    { label: "wan2.7-image-pro", value: "wan2.7-image-pro", modelId: "wan2.7-image-pro" },
    { label: "qwen-image-2.0", value: "qwen-image-2.0", modelId: "qwen-image-2.0" },
    { label: "z-image-turbo", value: "z-image-turbo", modelId: "z-image-turbo" }
  ],
  openai_image: [
    { label: "gpt-image-1", value: "gpt-image-1", modelId: "gpt-image-1" },
    { label: "dall-e-3", value: "dall-e-3", modelId: "dall-e-3" }
  ],
  custom: [
    { label: "custom-image", value: "custom-image", modelId: "custom-image" },
    { label: "custom-image-pro", value: "custom-image-pro", modelId: "custom-image-pro" }
  ]
};

export const volcengineArkImageModelIds = Object.fromEntries(
  volcengineArkImageModels.map((model) => [model.value, model.modelId])
) as Record<string, string>;
