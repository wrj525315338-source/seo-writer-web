import fs from "node:fs";
import path from "node:path";
import { getCluster, listClusterArticles, getProject } from "@/lib/db";
import { readClusterState, setClusterPhaseStatus, approveClusterPhase } from "@/lib/clusterState";
import { getClusterDir, getClusterStorageRoot } from "@/lib/fileStorage";
import { readProjectState, writeProjectState } from "@/lib/projectState";
import { runSkillPrompt } from "@/lib/codexClient";
import { ClusterPhaseId, ClusterState } from "@/lib/types";

/**
 * Run Cluster Phase 0: Shared material reading + checklist generation.
 * This runs once for the entire cluster, producing shared outputs.
 */
export async function runClusterPhase0(clusterId: string): Promise<void> {
  const cluster = getCluster(clusterId);
  if (!cluster) throw new Error(`集群不存在: ${clusterId}`);

  const state = readClusterState(clusterId);
  const clusterDir = getClusterDir(clusterId);
  const outputsDir = path.join(clusterDir, "outputs");
  fs.mkdirSync(outputsDir, { recursive: true });

  // Read the cluster brief
  const briefPath = path.join(clusterDir, "cluster_brief.md");
  const briefContent = fs.existsSync(briefPath) ? fs.readFileSync(briefPath, "utf-8") : "";

  // Read shared writing guidelines from the first article project
  const articles = listClusterArticles(clusterId);
  let guidelineContent = "";
  let exampleContent = "";

  if (articles.length > 0) {
    const firstProject = getProject(articles[0].project_id);
    if (firstProject) {
      const firstProjectState = readProjectState(articles[0].project_id);
      const projectDir = path.join(getClusterStorageRoot(), "..", "projects", articles[0].project_id);

      // Read writing guideline
      if (firstProjectState.inputs.writingGuidelineFile) {
        const guidelinePath = path.join(projectDir, firstProjectState.inputs.writingGuidelineFile);
        if (fs.existsSync(guidelinePath)) {
          guidelineContent = fs.readFileSync(guidelinePath, "utf-8");
        }
      }

      // Read example articles
      if (firstProjectState.inputs.exampleArticleFiles?.length > 0) {
        const exampleParts: string[] = [];
        for (const exampleFile of firstProjectState.inputs.exampleArticleFiles) {
          const examplePath = path.join(projectDir, exampleFile);
          if (fs.existsSync(examplePath)) {
            exampleParts.push(fs.readFileSync(examplePath, "utf-8"));
          }
        }
        exampleContent = exampleParts.join("\n\n---\n\n");
      }
    }
  }

  // Read cross-link plan
  const crossLinkPath = path.join(clusterDir, "00_cross_link_plan.md");
  const crossLinkContent = fs.existsSync(crossLinkPath) ? fs.readFileSync(crossLinkPath, "utf-8") : "";

  // Build the prompt input
  const promptInput = [
    "# Cluster Brief",
    briefContent,
    "---",
    "# Writing Guidelines",
    guidelineContent,
    "---",
    "# Example Articles",
    exampleContent,
    "---",
    "# Cross-Link Plan",
    crossLinkContent,
  ].join("\n");

  // Write input file for the skill prompt
  const inputPath = path.join(outputsDir, "phase0_input.md");
  fs.writeFileSync(inputPath, promptInput, "utf-8");

  // Use the first article's project for model config
  const firstProject = articles.length > 0 ? getProject(articles[0].project_id) : null;
  if (!firstProject) throw new Error("集群中没有文章项目");

  // Run the cluster Phase 0 skill prompt
  setClusterPhaseStatus(clusterId, "cluster_phase0", "running");

  try {
    // Run material reading prompt
    const summaryOutput = await runSkillPrompt(
      firstProject,
      [
        "scripts/run_prompt.py",
        "--prompt", "prompts/phase0_cluster_brief.md",
        "--input", inputPath,
        "--output", path.join(outputsDir, "00_shared_material_summary.md"),
      ]
    );

    // Run checklist generation prompt
    const checklistOutput = await runSkillPrompt(
      firstProject,
      [
        "scripts/run_prompt.py",
        "--prompt", "prompts/phase0_generate_checklist.md",
        "--input", inputPath,
        "--output", path.join(outputsDir, "00_shared_writing_checklist.md"),
      ]
    );

    // Update cluster state with output paths
    const updatedState = readClusterState(clusterId);
    updatedState.sharedSummaryPath = path.join(outputsDir, "00_shared_material_summary.md");
    updatedState.sharedChecklistPath = path.join(outputsDir, "00_shared_writing_checklist.md");
    const { writeClusterState } = await import("@/lib/clusterState");
    writeClusterState(updatedState);

    // Copy shared outputs to each article project
    for (const article of articles) {
      const articleOutputsDir = path.join(getClusterStorageRoot(), "..", "projects", article.project_id, "outputs");
      fs.mkdirSync(articleOutputsDir, { recursive: true });

      // Copy summary
      const summarySrc = path.join(outputsDir, "00_shared_material_summary.md");
      if (fs.existsSync(summarySrc)) {
        fs.copyFileSync(summarySrc, path.join(articleOutputsDir, "00_material_reading_summary.md"));
      }

      // Copy checklist
      const checklistSrc = path.join(outputsDir, "00_shared_writing_checklist.md");
      if (fs.existsSync(checklistSrc)) {
        fs.copyFileSync(checklistSrc, path.join(articleOutputsDir, "00_writing_checklist.md"));
      }
    }

    // Mark each article's Phase 0 as approved so Phase 1 can run
    const { approvePhaseInState } = await import("@/lib/projectState");
    for (const article of articles) {
      approvePhaseInState(article.project_id, "phase0");
    }

    approveClusterPhase(clusterId, "cluster_phase0");
  } catch (error) {
    setClusterPhaseStatus(clusterId, "cluster_phase0", "failed", String(error));
    throw error;
  }
}

/**
 * Run a cluster phase that dispatches to per-article execution.
 * Each article runs the corresponding single-article phase independently.
 */
export async function runClusterPerArticlePhase(
  clusterId: string,
  clusterPhase: ClusterPhaseId,
  articlePhase: "phase1" | "phase2" | "phase3" | "phase4" | "phase5"
): Promise<void> {
  const state = readClusterState(clusterId);
  const articles = listClusterArticles(clusterId);

  setClusterPhaseStatus(clusterId, clusterPhase, "running");

  const errors: string[] = [];

  for (const article of articles) {
    try {
      // Update the article's project state to the target phase
      const projectState = readProjectState(article.project_id);
      projectState.currentPhase = articlePhase;
      writeProjectState(projectState);

      // Note: The actual phase execution is handled by the existing phaseRunner
      // through the normal API endpoint. This function just coordinates the cluster-level state.
    } catch (error) {
      errors.push(`${article.article_slug}: ${error}`);
    }
  }

  if (errors.length > 0) {
    setClusterPhaseStatus(clusterId, clusterPhase, "failed", errors.join("; "));
    throw new Error(`部分文章启动失败: ${errors.join("; ")}`);
  }

  // Cluster phase stays in "running" until all articles complete.
  // The web app will poll each article's phase status and advance the cluster phase
  // when all articles have completed the corresponding phase.
}

/**
 * Check if all articles in the cluster have completed a given single-article phase.
 * If so, advance the cluster to the next phase.
 */
export function checkClusterPhaseCompletion(clusterId: string, articlePhase: string): boolean {
  const articles = listClusterArticles(clusterId);

  for (const article of articles) {
    const state = readProjectState(article.project_id);
    const phaseState = state.phases[articlePhase as keyof typeof state.phases];
    if (!phaseState || (phaseState.status !== "approved" && phaseState.status !== "waiting_review")) {
      return false;
    }
  }

  return true;
}

/**
 * Get a summary of each article's current phase status for the cluster dashboard.
 */
export function getClusterProgress(clusterId: string): Array<{
  slug: string;
  role: string;
  projectId: string;
  currentPhase: string;
  phaseStatus: string;
}> {
  const articles = listClusterArticles(clusterId);
  return articles.map((article) => {
    const state = readProjectState(article.project_id);
    const currentPhase = state.currentPhase;
    const phaseState = state.phases[currentPhase];
    return {
      slug: article.article_slug,
      role: article.article_role,
      projectId: article.project_id,
      currentPhase,
      phaseStatus: phaseState?.status || "not_started",
    };
  });
}
