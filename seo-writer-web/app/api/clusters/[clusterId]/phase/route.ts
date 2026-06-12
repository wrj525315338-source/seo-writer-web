import { NextRequest, NextResponse } from "next/server";
import { getCluster, listClusterArticles, getProject } from "@/lib/db";
import { readClusterState, approveClusterPhase, setClusterPhaseStatus } from "@/lib/clusterState";
import { getClusterProgress, runClusterPhase0, runPhase1b, checkClusterPhaseCompletion } from "@/lib/clusterRunner";
import { runPhase, approvePhase } from "@/lib/phaseRunner";
import { readProjectState } from "@/lib/projectState";
import { readOutputForPhase } from "@/lib/fileStorage";
import { sanitizeError } from "@/lib/validators";
import type { ClusterPhaseId } from "@/lib/types";

export const runtime = "nodejs";

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
  const progress = getClusterProgress(clusterId);

  // Get outlines for each article
  const articles = listClusterArticles(clusterId);
  const outlines = articles.map((article) => {
    try {
      const content = readOutputForPhase(article.project_id, "phase1");
      return {
        slug: article.article_slug,
        role: article.article_role,
        projectId: article.project_id,
        content,
      };
    } catch {
      return {
        slug: article.article_slug,
        role: article.article_role,
        projectId: article.project_id,
        content: "",
      };
    }
  });

  // Read cross-link plan
  let crossLinkPlan = "";
  try {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { getClusterDir } = await import("@/lib/fileStorage");
    const planPath = path.join(getClusterDir(clusterId), "00_cross_link_plan.md");
    if (fs.existsSync(planPath)) {
      crossLinkPlan = fs.readFileSync(planPath, "utf-8");
    }
  } catch {
    // ignore
  }

  return NextResponse.json({
    cluster,
    state,
    progress,
    outlines,
    crossLinkPlan,
  });
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

    if (action === "run" && phase === "cluster_phase0") {
      await runClusterPhase0(clusterId);
      return NextResponse.json({ ok: true });
    }

    if (action === "run" && phase === "cluster_phase1") {
      // Run Phase 1 for each article
      const articles = listClusterArticles(clusterId);
      setClusterPhaseStatus(clusterId, "cluster_phase1", "running");

      for (const article of articles) {
        try {
          await runPhase(article.project_id, "phase1");
        } catch (error) {
          setClusterPhaseStatus(clusterId, "cluster_phase1", "failed", `${article.article_slug}: ${error}`);
          return NextResponse.json({ error: `${article.article_slug} Phase 1 失败: ${sanitizeError(error)}` }, { status: 400 });
        }
      }

      // Check if all articles completed Phase 1
      if (checkClusterPhaseCompletion(clusterId, "phase1")) {
        setClusterPhaseStatus(clusterId, "cluster_phase1", "waiting_review");
      }

      return NextResponse.json({ ok: true });
    }

    if (action === "approve" && phase === "cluster_phase1") {
      // Approve Phase 1 for all articles
      const articles = listClusterArticles(clusterId);
      for (const article of articles) {
        try {
          await approvePhase(article.project_id, "phase1");
        } catch (error) {
          return NextResponse.json({ error: `${article.article_slug} Phase 1 审批失败: ${sanitizeError(error)}` }, { status: 400 });
        }
      }
      approveClusterPhase(clusterId, "cluster_phase1");
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

    if (action === "run" && phase === "cluster_batch_confirm") {
      // Generate batch review report
      approveClusterPhase(clusterId, "cluster_batch_confirm");
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: `未知操作: ${action} ${phase}` }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: sanitizeError(error) }, { status: 400 });
  }
}
