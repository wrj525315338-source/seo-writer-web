"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { imageModelCatalog } from "@/lib/imageModelCatalog";
import { isTextProvider, providerLabels, resolveTextModel, textModelOptions, getDefaultBaseUrl } from "@/lib/modelCatalog";
import type { ImageProvider, Provider } from "@/lib/types";

const imageModelOptions = imageModelCatalog;

function storedValue(key: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(key);
}

function storeValue(key: string, value: string): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(key, value);
  } catch (e) {
    // localStorage may be disabled or full, silently ignore
    console.warn("Failed to save to localStorage:", e);
  }
}

function validProvider(value: string | null, fallback: Provider): Provider {
  return value && isTextProvider(value) ? value : fallback;
}

function validModel(provider: Provider, value: string | null): string {
  return value ? resolveTextModel(provider, value) : textModelOptions[provider][0].value;
}

function validImageProvider(value: string | null, fallback: ImageProvider): ImageProvider {
  return value && Object.keys(imageModelOptions).includes(value) ? (value as ImageProvider) : fallback;
}

function validImageModel(provider: ImageProvider, value: string | null): string {
  return value && imageModelOptions[provider].some((model) => model.value === value)
    ? value
    : imageModelOptions[provider][0].value;
}

interface ModelSelectorProps {
  title: string;
  description: string;
  prefix: "writing" | "auditor";
  defaultProvider?: Provider;
  defaultTemperature: number;
}

function ModelSelector({
  title,
  description,
  prefix,
  defaultProvider = "openai",
  defaultTemperature
}: ModelSelectorProps) {
  const providerStorageKey = `seo-writer:model:${prefix}:provider`;
  const modelStorageKey = `seo-writer:model:${prefix}:model`;
  const baseUrlStorageKey = `seo-writer:model:${prefix}:baseUrl`;
  const [provider, setProvider] = useState<Provider>(defaultProvider);
  const [modelName, setModelName] = useState(textModelOptions[defaultProvider][0].value);
  const [baseUrl, setBaseUrl] = useState(getDefaultBaseUrl(defaultProvider));

  useEffect(() => {
    const savedProvider = validProvider(storedValue(providerStorageKey), defaultProvider);
    const savedModel = validModel(savedProvider, storedValue(modelStorageKey));
    const savedBaseUrl = storedValue(baseUrlStorageKey);
    setProvider(savedProvider);
    setModelName(savedModel);
    // Use saved value if exists, otherwise use default for provider
    setBaseUrl(savedBaseUrl !== null ? savedBaseUrl : getDefaultBaseUrl(savedProvider));
  }, [defaultProvider, modelStorageKey, providerStorageKey, baseUrlStorageKey]);

  function handleProviderChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextProvider = event.target.value as Provider;
    const nextModelName = textModelOptions[nextProvider][0].value;
    const nextBaseUrl = getDefaultBaseUrl(nextProvider);
    setProvider(nextProvider);
    setModelName(nextModelName);
    setBaseUrl(nextBaseUrl);
    storeValue(providerStorageKey, nextProvider);
    storeValue(modelStorageKey, nextModelName);
    storeValue(baseUrlStorageKey, nextBaseUrl);
  }

  function handleModelChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextModelName = event.target.value;
    setModelName(nextModelName);
    storeValue(modelStorageKey, nextModelName);
  }

  return (
    <div className="model-box">
      <div>
        <h3>{title}</h3>
        <p className="help">{description}</p>
      </div>
      <div className="form-grid">
        <div className="field">
          <label htmlFor={`${prefix}Provider`}>Provider</label>
          <select id={`${prefix}Provider`} name={`${prefix}Provider`} value={provider} onChange={handleProviderChange}>
            {Object.entries(providerLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor={`${prefix}ModelName`}>Model name</label>
          <select
            id={`${prefix}ModelName`}
            name={`${prefix}ModelName`}
            value={modelName}
            onChange={handleModelChange}
            required
          >
            {textModelOptions[provider].map((model) => (
              <option key={model.value} value={model.value}>
                {model.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor={`${prefix}BaseUrl`}>Base URL</label>
          <input
            id={`${prefix}BaseUrl`}
            name={`${prefix}BaseUrl`}
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            onBlur={() => storeValue(baseUrlStorageKey, baseUrl)}
            placeholder="custom 或 OpenAI-compatible endpoint，可选"
          />
        </div>
        <div className="field">
          <label htmlFor={`${prefix}Temperature`}>Temperature</label>
          <input
            id={`${prefix}Temperature`}
            name={`${prefix}Temperature`}
            type="number"
            step="0.1"
            min="0"
            max="2"
            defaultValue={String(defaultTemperature)}
          />
        </div>
      </div>
    </div>
  );
}

function ImageGenerationModelConfig() {
  const defaultProvider: ImageProvider = "volcengine_ark";
  const providerStorageKey = "seo-writer:model:image:provider";
  const modelStorageKey = "seo-writer:model:image:model";
  const [provider, setProvider] = useState<ImageProvider>(defaultProvider);
  const [modelDisplayName, setModelDisplayName] = useState(imageModelOptions[defaultProvider][0].value);

  useEffect(() => {
    const savedProvider = validImageProvider(storedValue(providerStorageKey), defaultProvider);
    const savedModel = validImageModel(savedProvider, storedValue(modelStorageKey));
    setProvider(savedProvider);
    setModelDisplayName(savedModel);
  }, [modelStorageKey, providerStorageKey]);

  function handleProviderChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextProvider = event.target.value as ImageProvider;
    const nextModelDisplayName = imageModelOptions[nextProvider][0].value;
    setProvider(nextProvider);
    setModelDisplayName(nextModelDisplayName);
    storeValue(providerStorageKey, nextProvider);
    storeValue(modelStorageKey, nextModelDisplayName);
  }

  function handleModelChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextModelDisplayName = event.target.value;
    setModelDisplayName(nextModelDisplayName);
    storeValue(modelStorageKey, nextModelDisplayName);
  }

  const selectedModel =
    imageModelOptions[provider].find((model) => model.value === modelDisplayName) || imageModelOptions[provider][0];

  return (
    <div className="model-box">
      <div>
        <h3>Image Generation Model（生图模型）</h3>
        <p className="help">
          用于 Phase 6 图片生成。Phase 5 确认后会生成图片计划，之后可随时点击「开始生图」生成图片并插入 Word。API Key 只从后端 .env 读取，不会提交到浏览器表单。
        </p>
      </div>
      <input type="hidden" name="enableImageGeneration" value="false" />
      <label className="field full">
        <span>Enable image generation</span>
        <input type="checkbox" name="enableImageGeneration" value="true" defaultChecked />
      </label>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="imageProvider">Provider</label>
          <select id="imageProvider" name="imageProvider" value={provider} onChange={handleProviderChange}>
            <option value="volcengine_ark">volcengine_ark / 火山方舟</option>
            <option value="doubao">doubao / 豆包</option>
            <option value="qwen">qwen / 千问</option>
            <option value="openai_image">openai_image</option>
            <option value="custom">custom</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="imageModelDisplayName">Model name</label>
          <select
            id="imageModelDisplayName"
            name="imageModelDisplayName"
            value={modelDisplayName}
            onChange={handleModelChange}
            required
          >
            {imageModelOptions[provider].map((model) => (
              <option key={model.value} value={model.value}>
                {model.label}
              </option>
            ))}
          </select>
          <input type="hidden" name="imageModelName" value={modelDisplayName} />
        </div>
        <div className="field">
          <label htmlFor="imageModelId">Model ID</label>
          <input id="imageModelId" name="imageModelId" value={selectedModel.modelId} readOnly />
        </div>
        <div className="field">
          <label htmlFor="imageEndpointId">Endpoint ID</label>
          <input id="imageEndpointId" name="imageEndpointId" placeholder="optional provider endpoint_id" />
        </div>
        <label className="field">
          <span>Use endpoint ID</span>
          <input type="checkbox" name="imageUseEndpointId" value="true" />
        </label>
        <label className="field">
          <span>Allow non-compliant images</span>
          <input type="checkbox" name="imageAllowNonCompliantImages" value="true" />
        </label>
        <div className="field">
          <label htmlFor="imageBaseUrl">Base URL</label>
          <input id="imageBaseUrl" name="imageBaseUrl" placeholder="custom 或 provider image endpoint，可选" />
        </div>
        <div className="field">
          <label htmlFor="imageTemperature">Temperature</label>
          <input id="imageTemperature" name="imageTemperature" type="number" step="0.1" min="0" max="2" defaultValue="0.2" />
        </div>
        <div className="field full">
          <label htmlFor="imageSkillPath">Image skill path</label>
          <input id="imageSkillPath" name="imageSkillPath" defaultValue="../skills/hellotalk-blog-image-planner-v2.skill" />
        </div>
        <div className="field">
          <label htmlFor="imageOutputFormat">Output format</label>
          <select id="imageOutputFormat" name="imageOutputFormat" defaultValue="png">
            <option value="png">png</option>
            <option value="jpg">jpg</option>
            <option value="jpeg">jpeg</option>
            <option value="webp">webp</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="imageAspectRatioDefault">Aspect ratio</label>
          <select id="imageAspectRatioDefault" name="imageAspectRatioDefault" defaultValue="16:9">
            <option value="16:9">16:9</option>
            <option value="4:3">4:3</option>
            <option value="1:1">1:1</option>
            <option value="9:16">9:16</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="imageRetryCount">Retry count</label>
          <input id="imageRetryCount" name="imageRetryCount" type="number" min="0" max="5" defaultValue="2" />
        </div>
        <div className="field">
          <label htmlFor="imageCountDefault">Default image count</label>
          <input id="imageCountDefault" name="imageCountDefault" type="number" min="1" max="6" defaultValue="3" />
        </div>
        <input type="hidden" name="imageInsertMode" value="placeholder" />
      </div>
    </div>
  );
}

export default function ModelConfigForm() {
  return (
    <div className="form-section">
      <h2>模型配置</h2>
      <ModelSelector
        title="Writing Model（写作/批改模型）"
        description="用于 Phase 0 材料阅读、Phase 1 大纲、正文写作、用户修改意见处理和最终文件生成。"
        prefix="writing"
        defaultTemperature={0.7}
      />
      <ModelSelector
        title="Auditor Model（审查模型）"
        description="用于规范审查、语言风格审核和 checklist 复审。建议使用低 temperature，并可选择与写作模型不同的 provider。"
        prefix="auditor"
        defaultProvider="openai"
        defaultTemperature={0.2}
      />
      <ImageGenerationModelConfig />
      <p className="help">
        API Key 只从后端 .env 读取，不会提交到浏览器表单。系统不在前端设置最大 tokens；如 provider 接口要求该参数，后端会自动使用内部默认值。
      </p>
    </div>
  );
}
