import { NextRequest, NextResponse } from "next/server";
import { getCluster, listClusterArticles } from "@/lib/db";
import { readClusterState, approveClusterPhase, setClusterPhaseStatus } from "@/lib/clusterState";
import { runClusterPhase0, runPhase1b, checkClusterPhaseCompletion, generateBatchReview } from "@/lib/clusterRunner";
import { runPhase, runPhase4Chunked, approvePhase } from "@/lib/phaseRunner";
import { readOutputForPhase, getClusterDir } from "@/lib/fileStorage";
import { sanitizeError } from "@/lib/validators";
import type { ClusterPhaseId, PhaseId } from "@/lib/types";

export const runtime = "nodejs";

/** Mapping from cluster phase to the single-article phase it dispatches to */
const CLUSTER_TO_ARTICLE_PHASE: Partial<Record<ClusterPhaseId, PhaseId>> = {
  cluster_phase1: "phase1",
  cluster_phase2: "phase2",
  cluster_phase3: "phase3",
  cluster_phase4: "phase4",
  cluster_phase5: "phase5",
};

/** Cluster phases that require manual review (not auto-approved) */
const CLUSTER_MANUAL_REVIEW_PHASES: ClusterPhaseId[] = [
  "cluster_phase1",
  "cluster_phase1b",
  "cluster_phase5",
  "cluster_batch_confirm",
];

/**
 * Run an article-level phase for all articles in the cluster.
 * Returns the first error encountered, or null on success.
 */
async function runPhaseForAllArticles(
  clusterId: string,
  clusterPhase: ClusterPhaseId,
  articlePhase: PhaseId
): Promise<string | null> {
  const articles = listClusterArticles(clusterId);
  setClusterPhaseStatus(clusterId, clusterPhase, "running");

  for (const article of articles) {
    try {
      // Use chunked mode for Phase 4 (long articles need chunked audit)
      if (articlePhase === "phase4") {
        await runPhase4Chunked(article.project_id);
      } else {
        await runPhase(article.project_id, articlePhase);
      }
    } catch (error) {
      const msg = `${article.article_slug} ${articlePhase} 失败: ${sanitizeError(error)}`;
      setClusterPhaseStatus(clusterId, clusterPhase, "failed", msg);
      return msg;
    }
  }

  // Check completion and set appropriate status
  if (checkClusterPhaseCompletion(clusterId, articlePhase)) {
    if (CLUSTER_MANUAL_REVIEW_PHASES.includes(clusterPhase)) {
      setClusterPhaseStatus(clusterId, clusterPhase, "waiting_review");
    } else {
      approveClusterPhase(clusterId, clusterPhase);
    }
  }

  return null;
}

/**
 * Approve an article-level phase for all articles in the cluster.
 */
async function approvePhaseForAllArticles(
  clusterId: string,
  clusterPhase: ClusterPhaseId,
  articlePhase: PhaseId
): Promise<string | null> {
  const articles = listClusterArticles(clusterId);
  for (const article of articles) {
    try {
      await approvePhase(article.project_id, articlePhase);
    } catch (error) {
      return `${article.article_slug} ${articlePhase} 审批失败: ${sanitizeError(error)}`;
    }
  }
  approveClusterPhase(clusterId, clusterPhase);
  return null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clusterId: string }> }
) {
  const { clusterId } = await params;
  const cluster = getCluster(clusterId);
  if (!cluster) {
    return NextResponse.json({ error: "集群不存在" }, { status: 404 });
  }

  const state = readClusterState(clusterId);
  const progress = (await import("@/lib/clusterRunner")).getClusterProgress(clusterId);
  const articles = listClusterArticles(clusterId);

  // Get outlines for each article
  const outlines = articles.map((article) => {
    let content = "";
    try { content = readOutputForPhase(article.project_id, "phase1"); } catch { /* not yet */ }
    return { slug: article.article_slug, role: article.article_role, projectId: article.project_id, content };
  });

  // Get full articles for Phase 5 review
  const fullArticles = articles.map((article) => {
    let content = "";
    try { content = readOutputForPhase(article.project_id, "phase3"); } catch { /* not yet */ }
    return { slug: article.article_slug, role: article.article_role, projectId: article.project_id, content };
  });

  // Read cross-link plan
  let crossLinkPlan = "";
  try {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const planPath = path.join(getClusterDir(clusterId), "00_cross_link_plan.md");
    if (fs.existsSync(planPath)) crossLinkPlan = fs.readFileSync(planPath, "utf-8");
  } catch { /* ignore */ }

  return NextResponse.json({ cluster, state, progress, outlines, fullArticles, crossLinkPlan });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clusterId: string }> }
) {
  const { clusterId } = await params;
  const cluster = getCluster(clusterId);
  if (!cluster) {
    return NextResponse.json({ error: "集群不存在" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { action, phase } = body as { action: string; phase?: ClusterPhaseId };

    // ===== Cluster-specific phases =====

    if (action === "run" && phase === "cluster_phase0") {
      await runClusterPhase0(clusterId);
      return NextResponse.json({ ok: true });
    }

    if (action === "run" && phase === "cluster_phase1b") {
      await runPhase1b(clusterId);
      return NextResponse.json({ ok: true });
    }

    if (action === "approve" && phase === "cluster_phase1b") {
      approveClusterPhase(clusterId, "cluster_phase1b");
      return NextResponse.json({ ok: true });
    }

    // ===== Batch confirm =====

    if (action === "run" && phase === "cluster_batch_confirm") {
      setClusterPhaseStatus(clusterId, "cluster_batch_confirm", "running");
      try {
        await generateBatchReview(clusterId);
        setClusterPhaseStatus(clusterId, "cluster_batch_confirm", "waiting_review");
      } catch (error) {
        setClusterPhaseStatus(clusterId, "cluster_batch_confirm", "failed", String(error));
        return NextResponse.json({ error: sanitizeError(error) }, { status: 400 });
      }
      return NextResponse.json({ ok: true });
    }

    if (action === "approve" && phase === "cluster_batch_confirm") {
      approveClusterPhase(clusterId, "cluster_batch_confirm");
      return NextResponse.json({ ok: true });
    }

    // ===== Generic per-article phase dispatch (Phase 1-5) =====

    const articlePhase = phase ? CLUSTER_TO_ARTICLE_PHASE[phase] : undefined;

    if (action === "run" && articlePhase) {
      const error = await runPhaseForAllArticles(clusterId, phase!, articlePhase);
      if (error) return NextResponse.json({ error }, { status: 400 });
      return NextResponse.json({ ok: true });
    }

    if (action === "approve" && articlePhase) {
      const error = await approvePhaseForAllArticles(clusterId, phase!, articlePhase);
      if (error) return NextResponse.json({ error }, { status: 400 });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: `未知操作: ${action} ${phase}` }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: sanitizeError(error) }, { status: 400 });
  }
}
