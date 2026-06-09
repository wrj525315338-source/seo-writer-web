"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCcw, Settings2 } from "lucide-react";
import { imageModelCatalog } from "@/lib/imageModelCatalog";
import { encodeProjectId } from "@/lib/routeParams";
import type { ImageGenerationRecoveryStatus } from "@/lib/imageGenerationStatus";
import type { ImageProvider, Project } from "@/lib/types";

interface ImageGenerationRecoveryPanelProps {
  projectId: string;
  project: Pick<
    Project,
    | "image_provider"
    | "image_model_display_name"
    | "image_model_name"
    | "image_model_id"
    | "image_endpoint_id"
    | "image_use_endpoint_id"
  >;
  status: ImageGenerationRecoveryStatus;
}

function validProvider(value: string): ImageProvider {
  return Object.keys(imageModelCatalog).includes(value) ? (value as ImageProvider) : "volcengine_ark";
}

function validModel(provider: ImageProvider, value: string): string {
  return imageModelCatalog[provider].some((model) => model.value === value)
    ? value
    : imageModelCatalog[provider][0].value;
}

export default function ImageGenerationRecoveryPanel({
  projectId,
  project,
  status
}: ImageGenerationRecoveryPanelProps) {
  const router = useRouter();
  const initialProvider = validProvider(project.image_provider || "volcengine_ark");
  const initialModel = validModel(
    initialProvider,
    project.image_model_display_name || project.image_model_name || imageModelCatalog[initialProvider][0].value
  );
  const [provider, setProvider] = useState<ImageProvider>(initialProvider);
  const [modelDisplayName, setModelDisplayName] = useState(initialModel);
  const [endpointId, setEndpointId] = useState(project.image_endpoint_id || "");
  const [useEndpointId, setUseEndpointId] = useState(Boolean(Number(project.image_use_endpoint_id)));
  const [showModelForm, setShowModelForm] = useState(false);
  const [busyAction, setBusyAction] = useState<"retry" | "change" | null>(null);
  const [error, setError] = useState("");

  if (!status.shouldShow) {
    return null;
  }

  const selectedModel =
    imageModelCatalog[provider].find((model) => model.value === modelDisplayName) || imageModelCatalog[provider][0];

  function handleProviderChange(nextProvider: ImageProvider) {
    setProvider(nextProvider);
    setModelDisplayName(imageModelCatalog[nextProvider][0].value);
  }

  async function postAction(body: Record<string, unknown>) {
    const response = await fetch(`/api/projects/${encodeProjectId(projectId)}/phase`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phase: "phase5", ...body })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "图片生成操作失败");
    }
  }

  async function retry() {
    setError("");
    setBusyAction("retry");
    try {
      await postAction({ action: "retryImageGeneration" });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyAction(null);
    }
  }

  async function changeModelAndRetry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusyAction("change");
    try {
      await postAction({
        action: "changeImageModelAndRetry",
        imageProvider: provider,
        imageModelDisplayName: modelDisplayName,
        imageModelId: selectedModel.modelId,
        imageEndpointId: endpointId,
        imageUseEndpointId: useEndpointId
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div className="panel">
      <div className="phase-row">
        <div>
          <h2>{status.title}</h2>
          <p className="page-subtitle">{status.message}</p>
        </div>
        <span className="status failed">{status.status || "failed"}</span>
      </div>
      {error ? <div className="error">{error}</div> : null}
      {status.details.length > 0 ? (
        <div className="error">
          {status.details.map((detail) => (
            <p key={detail}>{detail}</p>
          ))}
        </div>
      ) : null}
      <div className="phase-actions">
        <button type="button" onClick={retry} disabled={busyAction !== null}>
          <RefreshCcw size={15} />
          {busyAction === "retry" ? "重试中..." : "重试"}
        </button>
        <button type="button" className="primary" onClick={() => setShowModelForm((value) => !value)} disabled={busyAction !== null}>
          <Settings2 size={15} />
          更换模型
        </button>
      </div>
      {showModelForm ? (
        <form className="model-box" onSubmit={changeModelAndRetry}>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="retryImageProvider">Provider</label>
              <select
                id="retryImageProvider"
                value={provider}
                onChange={(event) => handleProviderChange(event.target.value as ImageProvider)}
              >
                <option value="volcengine_ark">volcengine_ark / 火山方舟</option>
                <option value="doubao">doubao / 豆包</option>
                <option value="qwen">qwen / 千问</option>
                <option value="openai_image">openai_image</option>
                <option value="custom">custom</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="retryImageModelDisplayName">Model name</label>
              <select
                id="retryImageModelDisplayName"
                value={modelDisplayName}
                onChange={(event) => setModelDisplayName(event.target.value)}
              >
                {imageModelCatalog[provider].map((model) => (
                  <option key={model.value} value={model.value}>
                    {model.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="retryImageModelId">Model ID</label>
              <input id="retryImageModelId" value={selectedModel.modelId} readOnly />
            </div>
            <div className="field">
              <label htmlFor="retryImageEndpointId">Endpoint ID</label>
              <input
                id="retryImageEndpointId"
                value={endpointId}
                onChange={(event) => setEndpointId(event.target.value)}
                placeholder="optional provider endpoint_id"
              />
            </div>
            <label className="field">
              <span>Use endpoint ID</span>
              <input
                type="checkbox"
                checked={useEndpointId}
                onChange={(event) => setUseEndpointId(event.target.checked)}
              />
            </label>
          </div>
          <div className="phase-actions">
            <button type="submit" className="primary" disabled={busyAction !== null}>
              <RefreshCcw size={15} />
              {busyAction === "change" ? "保存并重试中..." : "保存并重试"}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
