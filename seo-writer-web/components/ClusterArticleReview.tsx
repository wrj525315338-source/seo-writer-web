"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { encodeProjectId } from "@/lib/routeParams";

interface ArticleData {
  slug: string;
  role: string;
  projectId: string;
  content: string;
}

interface ClusterArticleReviewProps {
  clusterId: string;
  articles: ArticleData[];
  onApprove: () => void;
}

export default function ClusterArticleReview({ clusterId, articles, onApprove }: ClusterArticleReviewProps) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState("");

  const activeArticle = articles[activeIndex];

  async function handleApproveAll() {
    setApproving(true);
    setError("");
    try {
      const response = await fetch(`/api/clusters/${clusterId}/phase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", phase: "cluster_phase5" }),
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "审批失败");
        return;
      }
      onApprove();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "网络错误");
    } finally {
      setApproving(false);
    }
  }

  return (
    <div style={{ margin: "1rem 0" }}>
      <h3>文章审阅（逐篇）</h3>
      <p style={{ color: "#6b7280", fontSize: "0.85rem", marginBottom: "1rem" }}>
        逐篇审阅每篇文章，确认后统一批准。
      </p>

      <div style={{ display: "flex", gap: "0.25rem", marginBottom: "1rem", overflowX: "auto" }}>
        {articles.map((article, i) => (
          <button
            key={article.slug}
            onClick={() => setActiveIndex(i)}
            style={{
              padding: "0.4rem 0.75rem",
              background: i === activeIndex ? "#eff6ff" : "#f9fafb",
              border: i === activeIndex ? "1px solid #3b82f6" : "1px solid #e5e7eb",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.8rem",
              whiteSpace: "nowrap",
              fontWeight: i === activeIndex ? 600 : 400,
            }}
          >
            {article.role}: {article.slug}
          </button>
        ))}
      </div>

      {activeArticle && (
        <div>
          <h4>
            <span style={{ fontSize: "0.7rem", padding: "0.1rem 0.4rem", background: "#dbeafe", borderRadius: "3px", fontWeight: 600, marginRight: "0.5rem" }}>
              {activeArticle.role}
            </span>
            {activeArticle.slug}
          </h4>
          <div style={{
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
            padding: "1rem",
            maxHeight: "600px",
            overflowY: "auto",
            marginBottom: "1rem",
            whiteSpace: "pre-wrap",
            fontSize: "0.85rem",
            lineHeight: "1.6",
          }}>
            {activeArticle.content || "文章尚未生成"}
          </div>
          <p style={{ fontSize: "0.8rem", color: "#6b7280" }}>
            <a href={`/projects/${encodeProjectId(activeArticle.projectId)}`} target="_blank" rel="noopener noreferrer">
              在单独项目页面中查看完整详情 →
            </a>
          </p>
        </div>
      )}

      {error && <p style={{ color: "#ef4444", marginBottom: "0.5rem" }}>{error}</p>}

      <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem", borderTop: "1px solid #e5e7eb", paddingTop: "1rem" }}>
        <button className="btn primary" onClick={handleApproveAll} disabled={approving || articles.some((a) => !a.content)}>
          {approving ? "审批中..." : "批准全部文章 →"}
        </button>
        {articles.some((a) => !a.content) && (
          <p className="help" style={{ alignSelf: "center" }}>所有文章生成完毕后才能批准。</p>
        )}
      </div>
    </div>
  );
}
