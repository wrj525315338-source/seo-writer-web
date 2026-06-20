"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { encodeProjectId } from "@/lib/routeParams";
import type { ClusterPhaseId, ClusterState } from "@/lib/types";
import Card from "@/components/ui/Card";
import Badge, { getStatusVariant } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ArticlePreviewModal from "./ArticlePreviewModal";

interface ArticleProgress {
  slug: string;
  role: string;
  projectId: string;
  currentPhase: string;
  phaseStatus: string;
}

interface ArticleContent {
  slug: string;
  role: string;
  outline: string;
  fullArticle: string;
}

interface ClusterDashboardProps {
  clusterId: string;
  clusterState: ClusterState;
  articleProgress: ArticleProgress[];
  articleContents?: ArticleContent[];
}

const clusterPhaseLabels: Record<ClusterPhaseId, string> = {
  cluster_phase0: "共享材料阅读",
  cluster_phase1: "文章大纲",
  cluster_phase1b: "互链规划",
  cluster_phase2: "前两节撰写",
  cluster_phase3: "全文写作",
  cluster_phase4: "Checklist 审计",
  cluster_phase5: "最终交付",
  cluster_batch_confirm: "批量确认",
};

const statusLabels: Record<string, string> = {
  not_started: "未开始",
  running: "运行中",
  waiting_review: "待审阅",
  approved: "已通过",
  failed: "失败",
};

export default function ClusterDashboard({
  clusterId,
  clusterState,
  articleProgress,
  articleContents = [],
}: ClusterDashboardProps) {
  const currentPhase = clusterState.currentPhase;
  const currentPhaseState = clusterState.phases[currentPhase];
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [previewArticle, setPreviewArticle] = useState<ArticleContent | null>(null);

  const isOutlineReview = currentPhase === "cluster_phase1" && currentPhaseState?.status === "waiting_review";
  const isArticleReview = currentPhase === "cluster_phase5" && currentPhaseState?.status === "waiting_review";

  async function handleRunPhase() {
    setRunning(true);
    setError("");
    try {
      const response = await fetch(`/api/clusters/${clusterId}/phase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "run", phase: currentPhase }),
      });
      const data = await response.json();
      if (!response.ok && response.status !== 202) {
        setError(data.error || "运行失败");
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "网络错误");
    } finally {
      setRunning(false);
    }
  }

  const canRun = currentPhaseState?.status === "not_started" || currentPhaseState?.status === "failed";
  const isRunning = currentPhaseState?.status === "running";
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRunning && !pollRef.current) {
      pollRef.current = setInterval(() => {
        router.refresh();
      }, 5000);
    }
    if (!isRunning && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [isRunning, router]);

  return (
    <div>
      <Card title="集群概览">
        <div className="meta-row">
          <span>集群 ID</span>
          <span>{clusterId}</span>
        </div>
        <div className="meta-row">
          <span>当前阶段</span>
          <span>
            <Badge variant={getStatusVariant(clusterState.phases[currentPhase]?.status || "not_started")}>
              {clusterPhaseLabels[currentPhase]} — {statusLabels[clusterState.phases[currentPhase]?.status || "not_started"]}
            </Badge>
          </span>
        </div>
        <div className="meta-row">
          <span>文章数</span>
          <span>{clusterState.articles.length} 篇</span>
        </div>
        <div className="meta-row">
          <span>互链规则</span>
          <span>{clusterState.crossLinkRules.length} 条</span>
        </div>
      </Card>

      <div style={{ marginBottom: "1rem" }}>
        {canRun && (
          <Button variant="primary" onClick={handleRunPhase} disabled={running}>
            {running ? "运行中..." : `运行 ${clusterPhaseLabels[currentPhase]}`}
          </Button>
        )}
        {isRunning && (
          <span className="help" style={{ marginLeft: "0.75rem" }}>⏳ 阶段运行中（自动刷新中）...</span>
        )}
        {error && <p className="error" style={{ marginTop: "0.5rem" }}>{error}</p>}
      </div>

      <Card title="集群阶段进度">
        <div className="step-timeline">
          {(Object.keys(clusterPhaseLabels) as ClusterPhaseId[]).map((phase, i) => {
            const phaseState = clusterState.phases[phase];
            const isActive = phase === currentPhase;
            const status = phaseState?.status || "not_started";
            const classes = [
              "step-item",
              isActive ? "active" : "",
              status === "approved" ? "completed" : "",
            ].filter(Boolean).join(" ");

            return (
              <div key={phase} className={classes}>
                <div className="step-number">{i + 1}</div>
                <div className="step-content">
                  <div className="step-title">{clusterPhaseLabels[phase]}</div>
                  {phaseState?.errorMessage && (
                    <div style={{ color: "var(--color-danger-text)", fontSize: 12 }}>{phaseState.errorMessage}</div>
                  )}
                </div>
                <Badge variant={getStatusVariant(status)}>
                  {statusLabels[status]}
                </Badge>
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="文章进度">
        <div className="article-progress-grid">
          {articleProgress.map((article) => {
            const content = articleContents.find((c) => c.slug === article.slug);
            const hasOutline = content && content.outline.trim().length > 0;
            const hasFullArticle = content && content.fullArticle.trim().length > 0;

            return (
              <div className="article-progress-card" key={article.projectId}>
                <div className="article-progress-header">
                  <Badge variant="info">{article.role}</Badge>
                  <Link
                    href={`/projects/${encodeProjectId(article.projectId)}`}
                    className="article-progress-link"
                  >
                    {article.slug}
                  </Link>
                </div>
                <div className="article-progress-meta">
                  <span>Phase: {article.currentPhase}</span>
                  <Badge variant={getStatusVariant(article.phaseStatus)}>
                    {statusLabels[article.phaseStatus] || article.phaseStatus}
                  </Badge>
                </div>
                {content && (
                  <div className="article-progress-actions">
                    <Button
                      size="sm"
                      disabled={!hasOutline}
                      onClick={() => setPreviewArticle(content)}
                      title={hasOutline ? "查看大纲" : "大纲尚未生成"}
                    >
                      查看大纲
                    </Button>
                    <Button
                      size="sm"
                      disabled={!hasFullArticle}
                      onClick={() => setPreviewArticle(content)}
                      title={hasFullArticle ? "查看全文" : "全文尚未生成"}
                    >
                      查看全文
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {previewArticle && (
        <ArticlePreviewModal
          open={!!previewArticle}
          onClose={() => setPreviewArticle(null)}
          slug={previewArticle.slug}
          role={previewArticle.role}
          outlineContent={previewArticle.outline}
          fullArticleContent={previewArticle.fullArticle}
          clusterId={clusterId}
          showOutlineReviewLink={isOutlineReview}
          showArticleReviewLink={isArticleReview}
        />
      )}

      {clusterState.specialRequirements.bannedCompetitors.length > 0 && (
        <Card title="竞品禁令">
          <ul>
            {clusterState.specialRequirements.bannedCompetitors.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </Card>
      )}

      {clusterState.specialRequirements.collisionWarnings.length > 0 && (
        <Card title="冲突警告">
          <ul>
            {clusterState.specialRequirements.collisionWarnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
