"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { imageModelCatalog } from "@/lib/imageModelCatalog";
import { isTextProvider, providerLabels, resolveTextModel, textModelOptions } from "@/lib/modelCatalog";
import type { ImageProvider, Provider } from "@/lib/types";

const imageModelOptions = imageModelCatalog;

function storedValue(key: string): string {
  if (typeof window === "undefined") {
    return "";
  }
  return window.localStorage.getItem(key) || "";
}

function storeValue(key: string, value: string): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(key, value);
}

function validProvider(value: string, fallback: Provider): Provider {
  return isTextProvider(value) ? value : fallback;
}

function validModel(provider: Provider, value: string): string {
  return resolveTextModel(provider, value);
}

function validImageProvider(value: string, fallback: ImageProvider): ImageProvider {
  return Object.keys(imageModelOptions).includes(value) ? (value as ImageProvider) : fallback;
}

function validImageModel(provider: ImageProvider, value: string): string {
  return imageModelOptions[provider].some((model) => model.value === value)
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
  const [provider, setProvider] = useState<Provider>(defaultProvider);
  const [modelName, setModelName] = useState(textModelOptions[defaultProvider][0].value);

  useEffect(() => {
    const savedProvider = validProvider(storedValue(providerStorageKey), defaultProvider);
    const savedModel = validModel(savedProvider, storedValue(modelStorageKey));
    setProvider(savedProvider);
    setModelName(savedModel);
  }, [defaultProvider, modelStorageKey, providerStorageKey]);

  function handleProviderChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextProvider = event.target.value as Provider;
    const nextModelName = textModelOptions[nextProvider][0].value;
    setProvider(nextProvider);
    setModelName(nextModelName);
    storeValue(providerStorageKey, nextProvider);
    storeValue(modelStorageKey, nextModelName);
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
          <input id={`${prefix}BaseUrl`} name={`${prefix}BaseUrl`} placeholder="custom 或 OpenAI-compatible endpoint，可选" />
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
          用于 Phase 5 确认后的自动生图和 Word 插图。API Key 只从后端 .env 读取，不会提交到浏览器表单。
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
