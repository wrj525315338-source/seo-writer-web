"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { encodeProjectId } from "@/lib/routeParams";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

interface ArticleData {
  slug: string;
  role: string;
  projectId: string;
  content: string;
}

interface ClusterArticleReviewProps {
  clusterId: string;
  articles: ArticleData[];
  onApprove?: () => void;
  approvePhase?: "cluster_phase4" | "cluster_phase5";
  readOnly?: boolean;
}

export default function ClusterArticleReview({ clusterId, articles, onApprove, approvePhase = "cluster_phase5", readOnly = false }: ClusterArticleReviewProps) {
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
        body: JSON.stringify({ action: "approve", phase: approvePhase }),
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
      setApproving(false);
    }
  }

  return (
    <Card title={readOnly ? "文章查看（逐篇）" : "文章审阅（逐篇）"}>
      <p className="page-subtitle">
        {readOnly ? "逐篇查看每篇文章内容。" : "逐篇审阅每篇文章，确认后统一批准。"}
      </p>

      <div className="article-review-tabs">
        {articles.map((article, i) => (
          <button
            key={article.slug}
            type="button"
            className={`article-review-tab${i === activeIndex ? " active" : ""}`}
            onClick={() => setActiveIndex(i)}
          >
            {article.role}: {article.slug}
          </button>
        ))}
      </div>

      {activeArticle && (
        <div>
          <h4 style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 8px" }}>
            <Badge variant="info">{activeArticle.role}</Badge>
            {activeArticle.slug}
          </h4>
          <div className="outline-content" style={{ maxHeight: 600, marginBottom: 16 }}>
            {activeArticle.content || "文章尚未生成"}
          </div>
          <p className="help">
            <a href={`/projects/${encodeProjectId(activeArticle.projectId)}`} target="_blank" rel="noopener noreferrer">
              在单独项目页面中查看完整详情 →
            </a>
          </p>
        </div>
      )}

      {!readOnly && (
        <>
          {error && <p className="error">{error}</p>}

          <div className="review-actions" style={{ borderTop: "1px solid var(--color-border-soft)", paddingTop: 16, marginTop: 16 }}>
            <Button variant="primary" onClick={handleApproveAll} disabled={approving || articles.some((a) => !a.content)}>
              {approving ? "审批中..." : "批准全部文章 →"}
            </Button>
            {articles.some((a) => !a.content) && (
              <p className="help">所有文章生成完毕后才能批准。</p>
            )}
          </div>
        </>
      )}
    </Card>
  );
}
