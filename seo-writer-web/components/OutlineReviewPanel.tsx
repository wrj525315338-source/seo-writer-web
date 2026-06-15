"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { encodeProjectId } from "@/lib/routeParams";
import type { ClusterState } from "@/lib/types";

interface OutlineReviewPanelProps {
  clusterId: string;
  clusterState: ClusterState;
  outlines: Array<{
    slug: string;
    role: string;
    projectId: string;
    content: string;
  }>;
  crossLinkPlan: string;
  onApprove?: () => void;
  readOnly?: boolean;
}

export default function OutlineReviewPanel({
  clusterId,
  clusterState,
  outlines,
  crossLinkPlan,
  onApprove,
  readOnly = false,
}: OutlineReviewPanelProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [comment, setComment] = useState("");
  const [commentScope, setCommentScope] = useState<"global" | "article">("global");
  const [commentArticle, setCommentArticle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleApprove() {
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch(`/api/clusters/${clusterId}/phase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", phase: "cluster_phase1" }),
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "审批失败");
        return;
      }
      onApprove?.();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "网络错误");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRevise() {
    if (!comment.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const targets = commentScope === "global"
        ? outlines.map((o) => o.projectId)
        : [commentArticle];

      for (const projectId of targets) {
        const response = await fetch(`/api/projects/${encodeProjectId(projectId)}/phase`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "revise",
            phase: "phase1",
            comment: comment.trim(),
          }),
        });
        if (!response.ok) {
          const data = await response.json();
          setError(`修改意见提交失败 (${projectId}): ${data.error || "未知错误"}`);
          return;
        }
      }
      setComment("");
      // Refresh to show updated outlines
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "网络错误");
    } finally {
      setSubmitting(false);
    }
  }

  const tabs = [
    { key: "all", label: "全部大纲" },
    ...outlines.map((o) => ({ key: o.slug, label: `${o.role}: ${o.slug}` })),
    { key: "crosslink", label: "互链规划" },
  ];

  return (
    <div className="outline-review">
      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`tab ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="content-area">
        {activeTab === "all" && (
          <div className="all-outlines">
            {outlines.map((outline) => (
              <div key={outline.slug} className="outline-section">
                <h3>
                  <span className="role-badge">{outline.role}</span>
                  {outline.slug}
                </h3>
                <div className="outline-content">
                  {outline.content ? (
                    <pre>{outline.content}</pre>
                  ) : (
                    <p className="empty">大纲尚未生成</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "crosslink" && (
          <div className="crosslink-plan">
            <pre>{crossLinkPlan || "互链规划尚未生成"}</pre>
          </div>
        )}

        {outlines.map((outline) =>
          activeTab === outline.slug ? (
            <div key={outline.slug} className="single-outline">
              <h3>
                <span className="role-badge">{outline.role}</span>
                {outline.slug}
              </h3>
              <div className="outline-content">
                {outline.content ? (
                  <pre>{outline.content}</pre>
                ) : (
                  <p className="empty">大纲尚未生成</p>
                )}
              </div>
            </div>
          ) : null
        )}
      </div>

      {!readOnly && (
        <div className="review-actions">
          <div className="comment-section">
            <div className="comment-scope">
              <label>
                <input
                  type="radio"
                  name="scope"
                  checked={commentScope === "global"}
                  onChange={() => setCommentScope("global")}
                />
                全局意见（影响所有文章）
              </label>
              <label>
                <input
                  type="radio"
                  name="scope"
                  checked={commentScope === "article"}
                  onChange={() => setCommentScope("article")}
                />
                单篇意见
              </label>
              {commentScope === "article" && (
                <select
                  value={commentArticle}
                  onChange={(e) => setCommentArticle(e.target.value)}
                >
                  <option value="">选择文章</option>
                  {outlines.map((o) => (
                    <option key={o.projectId} value={o.projectId}>
                      {o.role}: {o.slug}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="输入修改意见..."
              rows={3}
            />
            <button
              className="btn"
              onClick={handleRevise}
              disabled={submitting || !comment.trim() || (commentScope === "article" && !commentArticle)}
            >
              {submitting ? "提交中..." : "提交修改意见"}
            </button>
          </div>

          {error && <p className="error">{error}</p>}

          <div className="approve-section">
            <button
              className="btn primary"
              onClick={handleApprove}
              disabled={submitting || outlines.some((o) => !o.content)}
            >
              {submitting ? "审批中..." : "批准全部大纲 →"}
            </button>
            {outlines.some((o) => !o.content) && (
              <p className="help">所有文章大纲生成完毕后才能批准。</p>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .outline-review { margin: 1rem 0; }
        .tabs { display: flex; gap: 0.25rem; border-bottom: 1px solid #e5e7eb; margin-bottom: 1rem; overflow-x: auto; }
        .tab {
          padding: 0.5rem 0.75rem;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          font-size: 0.85rem;
          white-space: nowrap;
        }
        .tab.active { border-bottom-color: #3b82f6; font-weight: 600; color: #1e40af; }
        .content-area { margin-bottom: 1.5rem; }
        .outline-section, .single-outline { margin-bottom: 1.5rem; }
        .outline-section h3, .single-outline h3 { display: flex; align-items: center; gap: 0.5rem; margin: 0 0 0.5rem; }
        .role-badge {
          font-size: 0.7rem;
          padding: 0.1rem 0.4rem;
          background: #dbeafe;
          border-radius: 3px;
          font-weight: 600;
        }
        .outline-content {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 1rem;
          max-height: 500px;
          overflow-y: auto;
        }
        .outline-content pre {
          white-space: pre-wrap;
          word-wrap: break-word;
          font-size: 0.85rem;
          line-height: 1.5;
          margin: 0;
          font-family: inherit;
        }
        .crosslink-plan pre {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 1rem;
          white-space: pre-wrap;
          font-size: 0.85rem;
        }
        .empty { color: #9ca3af; font-style: italic; }
        .review-actions { border-top: 1px solid #e5e7eb; padding-top: 1rem; }
        .comment-section { margin-bottom: 1rem; }
        .comment-scope { display: flex; gap: 1rem; align-items: center; margin-bottom: 0.5rem; font-size: 0.85rem; }
        .comment-scope select { margin-left: 0.5rem; }
        .comment-section textarea { width: 100%; margin-bottom: 0.5rem; }
        .approve-section { display: flex; align-items: center; gap: 1rem; }
        .error { color: #ef4444; }
      `}</style>
    </div>
  );
}
