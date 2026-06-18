import { NextRequest, NextResponse, after } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { getCluster, listClusterArticles } from "@/lib/db";
import { readClusterState, approveClusterPhase, setClusterPhaseStatus } from "@/lib/clusterState";
import { runClusterPhase0, runPhase1b, checkClusterPhaseCompletion, generateBatchReview } from "@/lib/clusterRunner";
import { runPhase, runPhase4Chunked, approvePhase } from "@/lib/phaseRunner";
import { readOutputForPhase, getClusterDir, getClusterStatePath } from "@/lib/fileStorage";
import { sanitizeError } from "@/lib/validators";
import type { ClusterPhaseId, PhaseId } from "@/lib/types";

export const runtime = "nodejs";

/** All valid cluster phase IDs */
const CLUSTER_PHASES: ClusterPhaseId[] = [
  "cluster_phase0", "cluster_phase1", "cluster_phase1b", "cluster_phase2",
  "cluster_phase3", "cluster_phase4", "cluster_phase5", "cluster_batch_confirm",
];

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
  "cluster_phase4",
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
  articlePhase: PhaseId,
  onArticleStart?: () => void
): Promise<string | null> {
  const articles = listClusterArticles(clusterId);
  setClusterPhaseStatus(clusterId, clusterPhase, "running");

  for (const article of articles) {
    // Write heartbeat before each article (prevents stale detection)
    if (onArticleStart) onArticleStart();
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
 * For auto-approved phases (like Phase 4), just verify all articles are approved.
 * For manual-review phases (like Phase 1, Phase 5), call approvePhase for each.
 */
async function approvePhaseForAllArticles(
  clusterId: string,
  clusterPhase: ClusterPhaseId,
  articlePhase: PhaseId
): Promise<string | null> {
  const articles = listClusterArticles(clusterId);
  const { requiresManualReview } = await import("@/lib/validators");

  let hasProcessingPhase5 = false;

  for (const article of articles) {
    try {
      const { readProjectState } = await import("@/lib/projectState");
      const state = readProjectState(article.project_id);
      const phaseState = state.phases[articlePhase];

      // Skip already-approved articles (idempotent)
      if (phaseState.approved) continue;

      // Skip processing articles (Phase 5 background task)
      if (phaseState.status === "processing") {
        hasProcessingPhase5 = true;
        continue;
      }

      // For auto-approved phases, verify they completed successfully
      if (!requiresManualReview(articlePhase)) {
        if (phaseState.status !== "approved" && phaseState.status !== "waiting_review") {
          return `${article.article_slug} ${articlePhase} 尚未完成 (status: ${phaseState.status})`;
        }
        continue;
      }

      // For manual-review phases, call approvePhase
      await approvePhase(article.project_id, articlePhase);

      // Check if Phase 5 is now processing
      if (articlePhase === "phase5") {
        const updatedState = readProjectState(article.project_id);
        if (updatedState.phases.phase5?.status === "processing") {
          hasProcessingPhase5 = true;
        }
      }
    } catch (error) {
      return `${article.article_slug} ${articlePhase} 审批失败: ${sanitizeError(error)}`;
    }
  }

  // Only advance cluster phase if no Phase 5 is still processing
  if (!hasProcessingPhase5) {
    approveClusterPhase(clusterId, clusterPhase);
  }
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

  // Detect and recover stale "running" states (from server crashes)
  // Uses heartbeat file written by background workers. Timeout: 30 minutes.
  const now = Date.now();
  const STALE_TIMEOUT_MS = 30 * 60 * 1000;
  for (const [phaseId, phaseState] of Object.entries(state.phases)) {
    if (phaseState.status === "running") {
      try {
        const heartbeatPath = path.join(getClusterDir(clusterId), ".phase_heartbeat");
        let lastActivity = 0;
        if (fs.existsSync(heartbeatPath)) {
          lastActivity = fs.statSync(heartbeatPath).mtimeMs;
        } else {
          lastActivity = fs.statSync(getClusterStatePath(clusterId)).mtimeMs;
        }
        const elapsed = now - lastActivity;
        if (elapsed > STALE_TIMEOUT_MS) {
          setClusterPhaseStatus(clusterId, phaseId as ClusterPhaseId, "failed", `超时自动恢复（无活动超过 ${Math.round(elapsed / 60000)} 分钟）`);
        }
      } catch { /* ignore */ }
    }
  }

  // Re-read state after potential recovery
  const freshState = readClusterState(clusterId);
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

  return NextResponse.json({ cluster, state: freshState, progress, outlines, fullArticles, crossLinkPlan });
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

    // ===== Validate phase state before transitions =====
    const clusterState = readClusterState(clusterId);

    if (!phase || !CLUSTER_PHASES.includes(phase as ClusterPhaseId)) {
      return NextResponse.json({ error: `无效的阶段: ${phase}` }, { status: 400 });
    }

    const phaseState = clusterState.phases[phase as ClusterPhaseId];

    // ===== Approve actions (fast, synchronous) =====

    if (action === "approve") {
      // Can only approve phases in waiting_review status
      if (phaseState.status !== "waiting_review") {
        return NextResponse.json({
          error: `阶段 ${phase} 当前状态为 ${phaseState.status}，无法审批（需要 waiting_review）`
        }, { status: 400 });
      }

      if (phase === "cluster_phase1b") {
        approveClusterPhase(clusterId, "cluster_phase1b");
        return NextResponse.json({ ok: true });
      }
      if (phase === "cluster_batch_confirm") {
        approveClusterPhase(clusterId, "cluster_batch_confirm");
        return NextResponse.json({ ok: true });
      }
      const articlePhase = CLUSTER_TO_ARTICLE_PHASE[phase as ClusterPhaseId];
      if (articlePhase) {
        const error = await approvePhaseForAllArticles(clusterId, phase as ClusterPhaseId, articlePhase);
        if (error) return NextResponse.json({ error }, { status: 400 });
        return NextResponse.json({ ok: true });
      }
    }

    // ===== Run actions (long-running, fire-and-forget) =====
    // Return 202 immediately. Work continues in background.
    // Frontend polls via ClusterDashboard.

    if (action === "run") {
      // Can only run phases in not_started or failed status
      if (phaseState.status !== "not_started" && phaseState.status !== "failed") {
        return NextResponse.json({
          error: `阶段 ${phase} 当前状态为 ${phaseState.status}，无法运行（需要 not_started 或 failed）`
        }, { status: 400 });
      }

      // Fire-and-forget: schedule work after response is sent
      const runAsync = async () => {
        // Write heartbeat file so stale detection knows work is in progress
        const writeHeartbeat = () => {
          try {
            const heartbeatPath = path.join(getClusterDir(clusterId), ".phase_heartbeat");
            fs.writeFileSync(heartbeatPath, new Date().toISOString(), "utf-8");
          } catch { /* non-fatal */ }
        };

        try {
          writeHeartbeat();
          if (phase === "cluster_phase0") {
            await runClusterPhase0(clusterId);
          } else if (phase === "cluster_phase1b") {
            await runPhase1b(clusterId);
          } else if (phase === "cluster_batch_confirm") {
            setClusterPhaseStatus(clusterId, "cluster_batch_confirm", "running");
            await generateBatchReview(clusterId);
            setClusterPhaseStatus(clusterId, "cluster_batch_confirm", "waiting_review");
          } else {
            const articlePhase = CLUSTER_TO_ARTICLE_PHASE[phase as ClusterPhaseId];
            if (articlePhase) {
              await runPhaseForAllArticles(clusterId, phase as ClusterPhaseId, articlePhase, writeHeartbeat);
            }
          }
        } catch (error) {
          if (phase) {
            setClusterPhaseStatus(clusterId, phase as ClusterPhaseId, "failed", String(error));
          }
        }
      };

      // Use Next.js after() for durable async execution (works in serverless)
      after(() => { runAsync(); });

      return NextResponse.json({ ok: true, async: true }, { status: 202 });
    }

    return NextResponse.json({ error: `未知操作: ${action} ${phase}` }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: sanitizeError(error) }, { status: 400 });
  }
}
