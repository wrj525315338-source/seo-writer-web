import { notFound } from "next/navigation";
import fs from "node:fs";
import path from "node:path";
import { getCluster, listClusterArticles } from "@/lib/db";
import { readClusterState } from "@/lib/clusterState";
import { getClusterProgress } from "@/lib/clusterRunner";
import { readOutputForPhase, getClusterDir } from "@/lib/fileStorage";
import PageShell from "@/components/ui/PageShell";
import PageTitle from "@/components/ui/PageTitle";
import Tabs from "@/components/ui/Tabs";
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

  const isOutlineReview = currentPhase === "cluster_phase1" && currentPhaseState?.status === "waiting_review";
  const isCrossLinkReview = currentPhase === "cluster_phase1b" && currentPhaseState?.status === "waiting_review";
  const isChecklistReview = currentPhase === "cluster_phase4" && currentPhaseState?.status === "waiting_review";
  const isArticleReview = currentPhase === "cluster_phase5" && currentPhaseState?.status === "waiting_review";
  const isBatchReview = currentPhase === "cluster_batch_confirm" && currentPhaseState?.status === "waiting_review";

  const defaultView = isOutlineReview ? "outlines"
    : isCrossLinkReview ? "crosslink"
    : isChecklistReview ? "checklist"
    : isArticleReview ? "articles"
    : isBatchReview ? "batch"
    : "dashboard";

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

  const hasOutlines = outlines.some(o => o.content.trim().length > 0);
  const hasCrossLink = crossLinkPlan.trim().length > 0;
  const hasChecklist = checklistReports.some(c => c.content.trim().length > 0);
  const hasArticles = fullArticles.some(a => a.content.trim().length > 0);
  const hasBatchReview = batchReview.trim().length > 0;

  const validViews = ["dashboard", "outlines", "crosslink", "checklist", "articles", "batch"];
  const viewMode = view && validViews.includes(view) ? view : defaultView;

  const tabs = [
    { key: "dashboard", label: "Dashboard" },
    (isOutlineReview || hasOutlines) ? { key: "outlines", label: isOutlineReview ? "大纲审阅" : "大纲查看" } : null,
    (isCrossLinkReview || hasCrossLink) ? { key: "crosslink", label: isCrossLinkReview ? "互链审阅" : "互链查看" } : null,
    (isChecklistReview || hasChecklist) ? { key: "checklist", label: isChecklistReview ? "Checklist 审阅" : "Checklist 查看" } : null,
    (isArticleReview || hasArticles) ? { key: "articles", label: isArticleReview ? "文章审阅" : "文章查看" } : null,
    (isBatchReview || hasBatchReview) ? { key: "batch", label: isBatchReview ? "批量确认" : "批量查看" } : null,
  ].filter((tab): tab is { key: string; label: string } => tab !== null);

  return (
    <PageShell>
      <PageTitle
        title={`集群项目：${state.clusterName}`}
        subtitle={`${articles.length} 篇文章 · ${state.crossLinkRules.length} 条互链规则`}
      />

      <nav style={{ marginBottom: "1.5rem" }}>
        <div className="tabs">
          {tabs.map((tab) => (
            <a
              key={tab.key}
              href={`/clusters/${clusterId}?view=${tab.key}`}
              className={`tab${viewMode === tab.key ? " active" : ""}`}
            >
              {tab.label}
            </a>
          ))}
        </div>
      </nav>

      {viewMode === "dashboard" && (
        <ClusterDashboard
          clusterId={clusterId}
          clusterState={state}
          articleProgress={progress}
          articleContents={outlines.map((o, i) => ({
            slug: o.slug,
            role: o.role,
            outline: o.content,
            fullArticle: fullArticles[i]?.content || "",
          }))}
        />
      )}

      {viewMode === "outlines" && (isOutlineReview || hasOutlines) && (
        <OutlineReviewPanel
          clusterId={clusterId}
          clusterState={state}
          outlines={outlines}
          crossLinkPlan={crossLinkPlan}
          readOnly={!isOutlineReview}
        />
      )}

      {viewMode === "crosslink" && (isCrossLinkReview || hasCrossLink) && (
        <CrossLinkApprovalView clusterId={clusterId} crossLinkPlan={crossLinkPlan} readOnly={!isCrossLinkReview} />
      )}

      {viewMode === "checklist" && (isChecklistReview || hasChecklist) && (
        <ClusterArticleReview
          clusterId={clusterId}
          articles={checklistReports}
          approvePhase="cluster_phase4"
          readOnly={!isChecklistReview}
        />
      )}

      {viewMode === "articles" && (isArticleReview || hasArticles) && (
        <ClusterArticleReview
          clusterId={clusterId}
          articles={fullArticles}
          readOnly={!isArticleReview}
        />
      )}

      {viewMode === "batch" && (isBatchReview || hasBatchReview) && (
        <BatchReviewView
          clusterId={clusterId}
          batchReview={batchReview}
          readOnly={!isBatchReview}
        />
      )}
    </PageShell>
  );
}
