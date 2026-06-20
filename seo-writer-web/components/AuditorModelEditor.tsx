"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { encodeProjectId } from "@/lib/routeParams";
import { isTextProvider, providerLabels, textModelOptions, getDefaultBaseUrl } from "@/lib/modelCatalog";
import type { Provider } from "@/lib/types";
import Button from "@/components/ui/Button";

interface AuditorModelEditorProps {
  projectId: string;
  currentProvider: Provider;
  currentModelName: string;
  currentBaseUrl: string;
  currentTemperature: number;
}

export default function AuditorModelEditor({
  projectId,
  currentProvider,
  currentModelName,
  currentBaseUrl,
  currentTemperature,
}: AuditorModelEditorProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [provider, setProvider] = useState<Provider>(currentProvider);
  const [modelName, setModelName] = useState(currentModelName);
  const [baseUrl, setBaseUrl] = useState(currentBaseUrl);
  const [temperature, setTemperature] = useState(String(currentTemperature));

  function handleProviderChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newProvider = e.target.value as Provider;
    setProvider(newProvider);
    const models = textModelOptions[newProvider];
    if (models && models.length > 0) {
      setModelName(models[0].value);
    }
    setBaseUrl(getDefaultBaseUrl(newProvider));
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/projects/${encodeProjectId(projectId)}/auditor-model`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          modelName,
          baseUrl,
          temperature: Number(temperature) || 0.2,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "保存失败");
        return;
      }
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "网络错误");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setProvider(currentProvider);
    setModelName(currentModelName);
    setBaseUrl(currentBaseUrl);
    setTemperature(String(currentTemperature));
    setEditing(false);
    setError("");
  }

  if (!editing) {
    return (
      <Button size="sm" type="button" onClick={() => setEditing(true)}>
        更换审查模型
      </Button>
    );
  }

  return (
    <div className="auditor-editor">
      <div className="form-grid compact">
        <div className="field">
          <label>Provider</label>
          <select value={provider} onChange={handleProviderChange}>
            {Object.entries(providerLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Model</label>
          <select value={modelName} onChange={(e) => setModelName(e.target.value)}>
            {textModelOptions[provider].map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Base URL</label>
          <input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="可选" />
        </div>
        <div className="field">
          <label>Temperature</label>
          <input type="number" step="0.1" min="0" max="2" value={temperature} onChange={(e) => setTemperature(e.target.value)} />
        </div>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="editor-actions">
        <Button size="sm" variant="primary" type="button" onClick={handleSave} disabled={saving}>
          {saving ? "保存中..." : "保存"}
        </Button>
        <Button size="sm" variant="ghost" type="button" onClick={handleCancel}>
          取消
        </Button>
      </div>
    </div>
  );
}
