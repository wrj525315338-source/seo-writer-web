"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Power } from "lucide-react";
import { encodeProjectId } from "@/lib/routeParams";
import type { Phase6StatusSummary } from "@/lib/phase6Status";

interface Phase6StatusPanelProps {
  projectId: string;
  status: Phase6StatusSummary;
}

export default function Phase6StatusPanel({ projectId, status }: Phase6StatusPanelProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function enableImageGeneration() {
    setError("");
    setBusy(true);
    try {
      const response = await fetch(`/api/projects/${encodeProjectId(projectId)}/phase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase: "phase5", action: "setImageGenerationEnabled", enabled: true })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "启用生图失败");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel">
      <div className="phase-row">
        <div>
          <h2>PHASE 6 图片生成</h2>
          <p className="page-subtitle">{status.description}</p>
        </div>
        <span className={`status ${status.statusClass}`}>{status.label}</span>
      </div>
      {error ? <div className="error">{error}</div> : null}

      <div className="grid">
        <div className="meta-row">
          <span>生图模型</span>
          <span>{status.provider} / {status.modelDisplayName}</span>
        </div>
        <div className="meta-row">
          <span>Model ID</span>
          <span>{status.modelId || "未设置"}</span>
        </div>
        <div className="meta-row">
          <span>Endpoint ID</span>
          <span>{status.useEndpointId ? status.endpointId || "未设置" : "未使用"}</span>
        </div>
        <div className="meta-row">
          <span>图片计划</span>
          <span>{status.imagePlanExists ? `${status.plannedCount} 张` : "未生成"}</span>
        </div>
        <div className="meta-row">
          <span>生成结果</span>
          <span>{status.metadataExists ? `成功 ${status.successCount} / 失败 ${status.failedCount}` : "暂无记录"}</span>
        </div>
        <div className="meta-row">
          <span>带图 Word</span>
          {status.outputDocxExists ? (
            <a className="button ghost" href={`/api/files/${encodeProjectId(projectId)}/outputs/final_article_with_images.docx`}>
              <FileText size={15} />
              下载
            </a>
          ) : (
            <span>未生成</span>
          )}
        </div>
      </div>

      {status.details.length > 0 ? (
        <div className="error">
          {status.details.map((detail) => (
            <p key={detail}>{detail}</p>
          ))}
        </div>
      ) : null}
      {status.label === "disabled" ? (
        <div className="phase-actions">
          <button type="button" className="primary" onClick={enableImageGeneration} disabled={busy}>
            <Power size={15} />
            {busy ? "启用中..." : "启用生图"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
