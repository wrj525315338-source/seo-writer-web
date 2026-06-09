"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, FileText, RefreshCcw } from "lucide-react";
import { encodeProjectId } from "@/lib/routeParams";
import type { ImageReviewStatus } from "@/lib/imageReview";

interface ImageReviewPanelProps {
  projectId: string;
  status: ImageReviewStatus;
}

function fileUrl(projectId: string, relativePath: string): string {
  return `/api/files/${encodeProjectId(projectId)}/${relativePath
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/")}`;
}

export default function ImageReviewPanel({ projectId, status }: ImageReviewPanelProps) {
  const router = useRouter();
  const initialComments = useMemo(
    () => Object.fromEntries(status.items.map((item) => [item.id, item.reviewComment || ""])),
    [status.items]
  );
  const [comments, setComments] = useState<Record<string, string>>(initialComments);
  const [busyAction, setBusyAction] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  if (!status.shouldShow) {
    return null;
  }

  const canApproveAll =
    !status.outputDocxExists
    && status.items.length > 0
    && status.items.every((item) => Boolean(item.relativePath) && item.status !== "failed");

  async function postAction(action: string, body: Record<string, unknown> = {}) {
    const response = await fetch(`/api/projects/${encodeProjectId(projectId)}/phase`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phase: "phase5", action, ...body })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "图片审核操作失败");
    }
  }

  async function runAction(actionKey: string, action: string, body: Record<string, unknown> = {}) {
    setError("");
    setBusyAction(actionKey);
    try {
      await postAction(action, body);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyAction("");
    }
  }

  function updateComment(imageId: string, value: string) {
    setComments((current) => ({ ...current, [imageId]: value }));
  }

  return (
    <div className="panel">
      <div className="phase-row">
        <div>
          <h2>图片审核</h2>
          <p className="page-subtitle">{status.description}</p>
        </div>
        <span className={`status ${status.statusClass}`}>{status.label}</span>
      </div>
      {error ? <div className="error">{error}</div> : null}
      {status.details.length > 0 ? (
        <div className="error">
          {status.details.map((detail) => (
            <p key={detail}>{detail}</p>
          ))}
        </div>
      ) : null}

      <div className="meta-row">
        <span>图片进度</span>
        <span>成功 {status.successCount} / 计划 {status.plannedCount}</span>
      </div>

      <div className="image-review-list">
        {status.items.map((item) => {
          const comment = comments[item.id] || "";
          const regenerateKey = `regenerate:${item.id}`;
          const approveKey = `approve:${item.id}`;
          return (
            <article className="image-review-card" key={item.id}>
              <div className="image-review-header">
                <div>
                  <h3>{item.id}</h3>
                  <p className="page-subtitle">{item.type || "planned image"}</p>
                </div>
                <span className={`status ${item.status === "approved" ? "approved" : item.status === "failed" ? "failed" : "waiting_review"}`}>
                  {item.status}
                </span>
              </div>

              {item.relativePath ? (
                <a className="image-preview" href={fileUrl(projectId, item.relativePath)} target="_blank" rel="noreferrer">
                  <img src={fileUrl(projectId, item.relativePath)} alt={item.altText || item.id} />
                </a>
              ) : (
                <div className="error">{item.error || "这张图片尚未生成成功。"}</div>
              )}

              <div className="image-review-meta">
                <div className="meta-row">
                  <span>Alt text</span>
                  <span>{item.altText || "未设置"}</span>
                </div>
                <div className="meta-row">
                  <span>插入位置</span>
                  <span>{item.insertBeforeHeading || item.insertAfterText || "按占位符插入"}</span>
                </div>
                {item.failedChecks.length > 0 ? (
                  <div className="meta-row">
                    <span>自动检查</span>
                    <span>{item.failedChecks.join(", ")}</span>
                  </div>
                ) : null}
              </div>

              <details>
                <summary>查看生成提示</summary>
                <p className="raw">{item.prompt}</p>
              </details>

              <div className="field">
                <label htmlFor={`image-review-${item.id}`}>审核意见</label>
                <textarea
                  id={`image-review-${item.id}`}
                  value={comment}
                  onChange={(event) => updateComment(item.id, event.target.value)}
                  placeholder="如果不通过，写清楚这张图需要怎样修改。"
                />
              </div>

              <div className="phase-actions">
                <button
                  type="button"
                  onClick={() => runAction(approveKey, "approveGeneratedImage", { imageId: item.id })}
                  disabled={Boolean(busyAction) || !item.relativePath}
                >
                  <Check size={15} />
                  {busyAction === approveKey ? "确认中..." : "这张通过"}
                </button>
                <button
                  type="button"
                  className="primary"
                  onClick={() => runAction(regenerateKey, "regenerateGeneratedImage", {
                    imageId: item.id,
                    reviewComment: comment
                  })}
                  disabled={Boolean(busyAction) || !comment.trim()}
                >
                  <RefreshCcw size={15} />
                  {busyAction === regenerateKey ? "重生成中..." : "按意见重生成这张"}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <div className="phase-actions">
        <button
          type="button"
          className="primary"
          onClick={() => runAction("final", "approveGeneratedImagesAndCreateFinal")}
          disabled={Boolean(busyAction) || !canApproveAll}
        >
          <Check size={15} />
          {busyAction === "final" ? "生成中..." : status.allApproved ? "生成带图最终文件" : "全部确认通过并生成最终文件"}
        </button>
        {status.outputDocxExists ? (
          <a className="button ghost" href={`/api/files/${encodeProjectId(projectId)}/outputs/final_article_with_images.docx`}>
            <FileText size={15} />
            下载带图 Word
          </a>
        ) : null}
      </div>
    </div>
  );
}
