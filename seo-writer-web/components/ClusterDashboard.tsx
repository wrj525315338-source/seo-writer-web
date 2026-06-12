"use client";

import Link from "next/link";
import { encodeProjectId } from "@/lib/routeParams";
import type { ClusterPhaseId, ClusterState } from "@/lib/types";

interface ArticleProgress {
  slug: string;
  role: string;
  projectId: string;
  currentPhase: string;
  phaseStatus: string;
}

interface ClusterDashboardProps {
  clusterId: string;
  clusterState: ClusterState;
  articleProgress: ArticleProgress[];
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

const statusColors: Record<string, string> = {
  not_started: "#9ca3af",
  running: "#3b82f6",
  waiting_review: "#f59e0b",
  approved: "#10b981",
  failed: "#ef4444",
};

export default function ClusterDashboard({ clusterId, clusterState, articleProgress }: ClusterDashboardProps) {
  const currentPhase = clusterState.currentPhase;

  return (
    <div className="cluster-dashboard">
      <div className="cluster-meta">
        <div className="meta-row">
          <span className="meta-label">集群 ID</span>
          <span className="meta-value">{clusterId}</span>
        </div>
        <div className="meta-row">
          <span className="meta-label">当前阶段</span>
          <span className="meta-value" style={{ color: statusColors[clusterState.phases[currentPhase]?.status || "not_started"] }}>
            {clusterPhaseLabels[currentPhase]} — {statusLabels[clusterState.phases[currentPhase]?.status || "not_started"]}
          </span>
        </div>
        <div className="meta-row">
          <span className="meta-label">文章数</span>
          <span className="meta-value">{clusterState.articles.length} 篇</span>
        </div>
        <div className="meta-row">
          <span className="meta-label">互链规则</span>
          <span className="meta-value">{clusterState.crossLinkRules.length} 条</span>
        </div>
      </div>

      <h3>集群阶段进度</h3>
      <div className="cluster-phases">
        {(Object.keys(clusterPhaseLabels) as ClusterPhaseId[]).map((phase) => {
          const phaseState = clusterState.phases[phase];
          const isActive = phase === currentPhase;
          return (
            <div
              key={phase}
              className={`cluster-phase-card ${isActive ? "active" : ""}`}
              style={{ borderLeftColor: statusColors[phaseState?.status || "not_started"] }}
            >
              <div className="phase-header">
                <span className="phase-name">{clusterPhaseLabels[phase]}</span>
                <span
                  className="phase-status"
                  style={{ color: statusColors[phaseState?.status || "not_started"] }}
                >
                  {statusLabels[phaseState?.status || "not_started"]}
                </span>
              </div>
              {phaseState?.errorMessage && (
                <p className="phase-error">{phaseState.errorMessage}</p>
              )}
            </div>
          );
        })}
      </div>

      <h3>文章进度</h3>
      <div className="article-grid">
        {articleProgress.map((article) => (
          <div key={article.projectId} className="article-card">
            <div className="article-header">
              <span className="article-role">{article.role}</span>
              <Link
                href={`/projects/${encodeProjectId(article.projectId)}`}
                className="article-link"
              >
                {article.slug}
              </Link>
            </div>
            <div className="article-status">
              <span>Phase: {article.currentPhase}</span>
              <span
                style={{ color: statusColors[article.phaseStatus] }}
              >
                {statusLabels[article.phaseStatus] || article.phaseStatus}
              </span>
            </div>
          </div>
        ))}
      </div>

      {clusterState.specialRequirements.bannedCompetitors.length > 0 && (
        <div className="cluster-requirements">
          <h4>竞品禁令</h4>
          <ul>
            {clusterState.specialRequirements.bannedCompetitors.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      {clusterState.specialRequirements.collisionWarnings.length > 0 && (
        <div className="cluster-requirements">
          <h4>冲突警告</h4>
          <ul>
            {clusterState.specialRequirements.collisionWarnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <style jsx>{`
        .cluster-dashboard { padding: 1rem 0; }
        .cluster-meta { margin-bottom: 1.5rem; }
        .meta-row { display: flex; gap: 0.5rem; margin-bottom: 0.25rem; }
        .meta-label { font-weight: 600; min-width: 100px; color: #6b7280; }
        .cluster-phases { display: grid; gap: 0.5rem; margin-bottom: 1.5rem; }
        .cluster-phase-card {
          padding: 0.5rem 0.75rem;
          border-left: 3px solid #d1d5db;
          background: #f9fafb;
          border-radius: 0 4px 4px 0;
        }
        .cluster-phase-card.active { background: #eff6ff; }
        .phase-header { display: flex; justify-content: space-between; align-items: center; }
        .phase-name { font-weight: 500; }
        .phase-status { font-size: 0.85rem; }
        .phase-error { color: #ef4444; font-size: 0.8rem; margin: 0.25rem 0 0; }
        .article-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 0.75rem; margin-bottom: 1.5rem; }
        .article-card { padding: 0.75rem; border: 1px solid #e5e7eb; border-radius: 6px; }
        .article-header { display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem; }
        .article-role { font-size: 0.75rem; padding: 0.1rem 0.4rem; background: #dbeafe; border-radius: 3px; font-weight: 600; }
        .article-link { font-weight: 500; color: #2563eb; text-decoration: none; }
        .article-link:hover { text-decoration: underline; }
        .article-status { display: flex; justify-content: space-between; font-size: 0.85rem; color: #6b7280; }
        .cluster-requirements { margin-bottom: 1rem; }
        .cluster-requirements h4 { margin: 0 0 0.25rem; font-size: 0.9rem; }
        .cluster-requirements ul { margin: 0; padding-left: 1.25rem; font-size: 0.85rem; }
      `}</style>
    </div>
  );
}
