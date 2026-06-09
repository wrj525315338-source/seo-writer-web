import type { Provider } from "@/lib/types";

export type TextModelOption = {
  label: string;
  value: string;
};

export const textModelOptions: Record<Provider, TextModelOption[]> = {
  openai: [
    { label: "gpt-5", value: "gpt-5" },
    { label: "gpt-5-mini", value: "gpt-5-mini" },
    { label: "gpt-5-nano", value: "gpt-5-nano" },
    { label: "gpt-4.1", value: "gpt-4.1" },
    { label: "gpt-4.1-mini", value: "gpt-4.1-mini" }
  ],
  anthropic: [
    { label: "claude-sonnet-4-5", value: "claude-sonnet-4-5" },
    { label: "claude-opus-4-1", value: "claude-opus-4-1" },
    { label: "claude-haiku-3-5", value: "claude-haiku-3-5" }
  ],
  deepseek: [
    { label: "deepseek-v4-pro", value: "deepseek-v4-pro" },
    { label: "deepseek-v4-flash", value: "deepseek-v4-flash" },
    { label: "deepseek-chat", value: "deepseek-chat" },
    { label: "deepseek-reasoner", value: "deepseek-reasoner" }
  ],
  qwen: [
    { label: "qwen-max", value: "qwen-max" },
    { label: "qwen-plus", value: "qwen-plus" },
    { label: "qwen-flash", value: "qwen-flash" },
    { label: "qwen-turbo", value: "qwen-turbo" },
    { label: "qwen-long", value: "qwen-long" }
  ],
  doubao: [
    { label: "doubao-seed-1-6", value: "doubao-seed-1-6" },
    { label: "doubao-seed-1-6-thinking", value: "doubao-seed-1-6-thinking" },
    { label: "doubao-seed-2-0-lite-260215", value: "doubao-seed-2-0-lite-260215" },
    { label: "doubao-1.5-pro-32k", value: "doubao-1.5-pro-32k" },
    { label: "doubao-1.5-lite-32k", value: "doubao-1.5-lite-32k" }
  ],
  xiaomi: [
    { label: "mimo-v2.5-pro", value: "mimo-v2.5-pro" },
    { label: "mimo-v2.5-flash", value: "mimo-v2.5-flash" },
    { label: "mimo-v2.5", value: "mimo-v2.5" }
  ],
  custom: [
    { label: "custom-pro", value: "custom-pro" },
    { label: "custom-flash", value: "custom-flash" },
    { label: "custom-default", value: "custom-default" }
  ]
};

export const providerLabels: Record<Provider, string> = {
  openai: "openai",
  anthropic: "anthropic",
  deepseek: "deepseek",
  qwen: "qwen / 千问",
  doubao: "doubao / 豆包",
  xiaomi: "xiaomi / 小米",
  custom: "custom"
};

export function isTextProvider(value: string): value is Provider {
  return Object.prototype.hasOwnProperty.call(textModelOptions, value);
}

export function resolveTextModel(provider: Provider, modelName: string): string {
  return textModelOptions[provider].some((model) => model.value === modelName)
    ? modelName
    : textModelOptions[provider][0].value;
}
