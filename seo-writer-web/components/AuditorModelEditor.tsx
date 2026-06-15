"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { encodeProjectId } from "@/lib/routeParams";
import { isTextProvider, providerLabels, textModelOptions } from "@/lib/modelCatalog";
import type { Provider } from "@/lib/types";

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
    // Reset model to first option for new provider
    const models = textModelOptions[newProvider];
    if (models && models.length > 0) {
      setModelName(models[0].value);
    }
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

  if (!editing) {
    return (
      <button type="button" className="btn-sm" onClick={() => setEditing(true)}>
        更换审查模型
      </button>
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
      {error && <p className="error" style={{ marginTop: "0.5rem" }}>{error}</p>}
      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
        <button type="button" className="btn-sm primary" onClick={handleSave} disabled={saving}>
          {saving ? "保存中..." : "保存"}
        </button>
        <button type="button" className="btn-sm ghost" onClick={() => { setEditing(false); setError(""); }}>
          取消
        </button>
      </div>

      <style jsx>{`
        .auditor-editor {
          margin-top: 0.5rem;
          padding: 0.75rem;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
        }
        .form-grid.compact {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
        }
        .field label {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          margin-bottom: 0.2rem;
          color: #6b7280;
        }
        .field select, .field input {
          width: 100%;
          padding: 0.3rem 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 0.85rem;
        }
        .btn-sm {
          padding: 0.25rem 0.6rem;
          font-size: 0.8rem;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          background: white;
          cursor: pointer;
          color: #374151;
        }
        .btn-sm:hover { background: #f9fafb; }
        .btn-sm.primary { background: #2563eb; color: white; border-color: #2563eb; }
        .btn-sm.primary:hover { background: #1d4ed8; }
        .btn-sm.primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-sm.ghost { border: none; color: #6b7280; }
        .btn-sm.ghost:hover { color: #1f2937; }
        .error { color: #ef4444; font-size: 0.8rem; }
      `}</style>
    </div>
  );
}
