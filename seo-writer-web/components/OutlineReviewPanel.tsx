"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { encodeProjectId } from "@/lib/routeParams";
import type { ClusterState } from "@/lib/types";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

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
            type="button"
            className={`tab ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === "all" && (
          <div>
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
                    <p style={{ color: "var(--color-text-muted)", fontStyle: "italic" }}>大纲尚未生成</p>
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
                  <p style={{ color: "var(--color-text-muted)", fontStyle: "italic" }}>大纲尚未生成</p>
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
            <Button
              onClick={handleRevise}
              disabled={submitting || !comment.trim() || (commentScope === "article" && !commentArticle)}
            >
              {submitting ? "提交中..." : "提交修改意见"}
            </Button>
          </div>

          {error && <p className="error">{error}</p>}

          <div className="approve-section">
            <Button
              variant="primary"
              onClick={handleApprove}
              disabled={submitting || outlines.some((o) => !o.content)}
            >
              {submitting ? "审批中..." : "批准全部大纲 →"}
            </Button>
            {outlines.some((o) => !o.content) && (
              <p className="help">所有文章大纲生成完毕后才能批准。</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
