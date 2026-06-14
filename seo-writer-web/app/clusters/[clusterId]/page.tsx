import { notFound } from "next/navigation";
import fs from "node:fs";
import path from "node:path";
import { getCluster, listClusterArticles } from "@/lib/db";
import { readClusterState } from "@/lib/clusterState";
import { getClusterProgress } from "@/lib/clusterRunner";
import { readOutputForPhase, getClusterDir } from "@/lib/fileStorage";
import ClusterDashboard from "@/components/ClusterDashboard";
import OutlineReviewPanel from "@/components/OutlineReviewPanel";
import CrossLinkApprovalView from "@/components/CrossLinkApprovalView";
import BatchReviewView from "@/components/BatchReviewView";
import ClusterArticleReview from "@/components/ClusterArticleReview";

export const dynamic = "force-dynamic";

export default async function ClusterDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ clusterId: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { clusterId } = await params;
  const { view } = await searchParams;

  const cluster = getCluster(clusterId);
  if (!cluster) notFound();

  const state = readClusterState(clusterId);
  const progress = getClusterProgress(clusterId);
  const articles = listClusterArticles(clusterId);

  const currentPhase = state.currentPhase;
  const currentPhaseState = state.phases[currentPhase];

  // Determine which views are available
  const isOutlineReview = currentPhase === "cluster_phase1" && currentPhaseState?.status === "waiting_review";
  const isCrossLinkReview = currentPhase === "cluster_phase1b" && currentPhaseState?.status === "waiting_review";
  const isChecklistReview = currentPhase === "cluster_phase4" && currentPhaseState?.status === "waiting_review";
  const isArticleReview = currentPhase === "cluster_phase5" && currentPhaseState?.status === "waiting_review";
  const isBatchReview = currentPhase === "cluster_batch_confirm" && currentPhaseState?.status === "waiting_review";

  // Default view based on current phase
  const defaultView = isOutlineReview ? "outlines"
    : isCrossLinkReview ? "crosslink"
    : isChecklistReview ? "checklist"
    : isArticleReview ? "articles"
    : isBatchReview ? "batch"
    : "dashboard";
  const viewMode = view || defaultView;

  // Read data for each view
  const outlines = articles.map((article) => {
    let content = "";
    try { content = readOutputForPhase(article.project_id, "phase1"); } catch { /* */ }
    return { slug: article.article_slug, role: article.article_role, projectId: article.project_id, content };
  });

  const fullArticles = articles.map((article) => {
    let content = "";
    try { content = readOutputForPhase(article.project_id, "phase3"); } catch { /* */ }
    return { slug: article.article_slug, role: article.article_role, projectId: article.project_id, content };
  });

  const checklistReports = articles.map((article) => {
    let content = "";
    try { content = readOutputForPhase(article.project_id, "phase4"); } catch { /* */ }
    return { slug: article.article_slug, role: article.article_role, projectId: article.project_id, content };
  });

  let crossLinkPlan = "";
  try {
    const planPath = path.join(getClusterDir(clusterId), "00_cross_link_plan.md");
    if (fs.existsSync(planPath)) crossLinkPlan = fs.readFileSync(planPath, "utf-8");
  } catch { /* */ }

  let batchReview = "";
  try {
    const reviewPath = path.join(getClusterDir(clusterId), "outputs", "cluster_batch_review.md");
    if (fs.existsSync(reviewPath)) batchReview = fs.readFileSync(reviewPath, "utf-8");
  } catch { /* */ }

  return (
    <main className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">集群项目：{state.clusterName}</h1>
          <p className="page-subtitle">
            {articles.length} 篇文章 · {state.crossLinkRules.length} 条互链规则
          </p>
        </div>
      </div>

      <nav style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "1px solid #e5e7eb", paddingBottom: "0.5rem", flexWrap: "wrap" }}>
        {([
          { key: "dashboard", label: "Dashboard" },
          isOutlineReview ? { key: "outlines", label: "大纲审阅" } : null,
          isCrossLinkReview ? { key: "crosslink", label: "互链审阅" } : null,
          isChecklistReview ? { key: "checklist", label: "Checklist 审阅" } : null,
          isArticleReview ? { key: "articles", label: "文章审阅" } : null,
          isBatchReview ? { key: "batch", label: "批量确认" } : null,
        ].filter((tab): tab is { key: string; label: string } => tab !== null).map((tab) => (
          <a
            key={tab.key}
            href={`/clusters/${clusterId}?view=${tab.key}`}
            style={{
              padding: "0.4rem 0.75rem",
              textDecoration: "none",
              color: viewMode === tab.key ? "#1e40af" : "#6b7280",
              borderBottom: viewMode === tab.key ? "2px solid #3b82f6" : "2px solid transparent",
              fontSize: "0.9rem",
              fontWeight: viewMode === tab.key ? 600 : 400,
            }}
          >
            {tab.label}
          </a>
        )))}
      </nav>

      {viewMode === "dashboard" && (
        <ClusterDashboard
          clusterId={clusterId}
          clusterState={state}
          articleProgress={progress}
        />
      )}

      {viewMode === "outlines" && isOutlineReview && (
        <OutlineReviewPanel
          clusterId={clusterId}
          clusterState={state}
          outlines={outlines}
          crossLinkPlan={crossLinkPlan}
          onApprove={() => {}}
        />
      )}

      {viewMode === "crosslink" && isCrossLinkReview && (
        <CrossLinkApprovalView clusterId={clusterId} crossLinkPlan={crossLinkPlan} />
      )}

      {viewMode === "checklist" && isChecklistReview && (
        <ClusterArticleReview
          clusterId={clusterId}
          articles={checklistReports}
          onApprove={() => {}}
          approvePhase="cluster_phase4"
        />
      )}

      {viewMode === "articles" && isArticleReview && (
        <ClusterArticleReview
          clusterId={clusterId}
          articles={fullArticles}
          onApprove={() => {}}
        />
      )}

      {viewMode === "batch" && isBatchReview && (
        <BatchReviewView
          clusterId={clusterId}
          batchReview={batchReview}
          onApprove={() => {}}
        />
      )}
    </main>
  );
}
