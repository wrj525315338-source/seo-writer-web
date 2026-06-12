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

  // Get outlines for each article
  const outlines = articles.map((article) => {
    let content = "";
    try {
      content = readOutputForPhase(article.project_id, "phase1");
    } catch {
      // outline not yet generated
    }
    return {
      slug: article.article_slug,
      role: article.article_role,
      projectId: article.project_id,
      content,
    };
  });

  // Read cross-link plan
  let crossLinkPlan = "";
  try {
    const planPath = path.join(getClusterDir(clusterId), "00_cross_link_plan.md");
    if (fs.existsSync(planPath)) {
      crossLinkPlan = fs.readFileSync(planPath, "utf-8");
    }
  } catch {
    // ignore
  }

  const currentPhase = state.currentPhase;
  const currentPhaseState = state.phases[currentPhase];
  const isOutlineReview = currentPhase === "cluster_phase1" && currentPhaseState?.status === "waiting_review";
  const isCrossLinkReview = currentPhase === "cluster_phase1b" && currentPhaseState?.status === "waiting_review";

  const viewMode = view || (isOutlineReview ? "outlines" : "dashboard");

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

      <nav style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "1px solid #e5e7eb", paddingBottom: "0.5rem" }}>
        <a
          href={`/clusters/${clusterId}`}
          style={{
            padding: "0.4rem 0.75rem",
            textDecoration: "none",
            color: viewMode === "dashboard" ? "#1e40af" : "#6b7280",
            borderBottom: viewMode === "dashboard" ? "2px solid #3b82f6" : "2px solid transparent",
            fontSize: "0.9rem",
            fontWeight: viewMode === "dashboard" ? 600 : 400,
          }}
        >
          Dashboard
        </a>
        {isOutlineReview && (
          <a
            href={`/clusters/${clusterId}?view=outlines`}
            style={{
              padding: "0.4rem 0.75rem",
              textDecoration: "none",
              color: viewMode === "outlines" ? "#1e40af" : "#6b7280",
              borderBottom: viewMode === "outlines" ? "2px solid #3b82f6" : "2px solid transparent",
              fontSize: "0.9rem",
              fontWeight: viewMode === "outlines" ? 600 : 400,
            }}
          >
            大纲审阅
          </a>
        )}
        {isCrossLinkReview && (
          <a
            href={`/clusters/${clusterId}?view=crosslink`}
            style={{
              padding: "0.4rem 0.75rem",
              textDecoration: "none",
              color: viewMode === "crosslink" ? "#1e40af" : "#6b7280",
              borderBottom: viewMode === "crosslink" ? "2px solid #3b82f6" : "2px solid transparent",
              fontSize: "0.9rem",
              fontWeight: viewMode === "crosslink" ? 600 : 400,
            }}
          >
            互链审阅
          </a>
        )}
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
          onApprove={() => {
            // Server action will handle the redirect
          }}
        />
      )}

      {viewMode === "crosslink" && isCrossLinkReview && (
        <CrossLinkApprovalView clusterId={clusterId} crossLinkPlan={crossLinkPlan} />
      )}
    </main>
  );
}
