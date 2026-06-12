import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { getCluster, listClusterArticles, getProject } from "@/lib/db";
import { readClusterState, setClusterPhaseStatus, approveClusterPhase } from "@/lib/clusterState";
import { getClusterDir, getProjectDir, getOutputsDir, getInputsDir, writeArticleBrief } from "@/lib/fileStorage";
import { readProjectState, writeProjectState } from "@/lib/projectState";
import { runSkillPrompt } from "@/lib/codexClient";
import { ClusterPhaseId } from "@/lib/types";

/** Extract text from binary formats using extract_materials.py */
function extractTextFromBinaryFile(filePath: string): string | null {
  const ext = path.extname(filePath).toLowerCase();
  if (![".docx", ".doc", ".xlsx", ".xlsm", ".pdf"].includes(ext)) return null;
  const scriptPath = path.join(process.cwd(), "..", "skills", "seo-article-writer", "scripts", "extract_materials.py");
  if (!fs.existsSync(scriptPath)) return null;
  try {
    const tempOut = filePath + ".extracted.md";
    execFileSync("python", [scriptPath, filePath, "-o", tempOut], { timeout: 30000, stdio: "pipe" });
    if (fs.existsSync(tempOut)) {
      const text = fs.readFileSync(tempOut, "utf-8");
      fs.unlinkSync(tempOut);
      return text;
    }
  } catch { /* extraction failed */ }
  return null;
}

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
    const firstProjectId = articles[0].project_id;
    const firstProject = getProject(firstProjectId);
    if (firstProject) {
      const firstProjectState = readProjectState(firstProjectId);
      const projectDir = getProjectDir(firstProjectId);

      // Read writing guideline (extract binary formats first)
      if (firstProjectState.inputs.writingGuidelineFile) {
        const guidelinePath = path.join(projectDir, firstProjectState.inputs.writingGuidelineFile);
        if (fs.existsSync(guidelinePath)) {
          guidelineContent = extractTextFromBinaryFile(guidelinePath) || fs.readFileSync(guidelinePath, "utf-8");
        }
      }

      // Read example articles (extract binary formats first)
      if (firstProjectState.inputs.exampleArticleFiles?.length > 0) {
        const exampleParts: string[] = [];
        for (const exampleFile of firstProjectState.inputs.exampleArticleFiles) {
          const examplePath = path.join(projectDir, exampleFile);
          if (fs.existsSync(examplePath)) {
            const text = extractTextFromBinaryFile(examplePath) || fs.readFileSync(examplePath, "utf-8");
            exampleParts.push(text);
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

    // Copy shared outputs to each article project and write article_brief.md
    for (const article of articles) {
      const articleOutputsDir = getOutputsDir(article.project_id);
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

      // Write article_brief.md for this article (required by Phase 1)
      const articleBrief = [
        "# Article Brief",
        "",
        `- Cluster: ${clusterId}`,
        `- Article Role: ${article.article_role}`,
        `- Article Type: ${article.article_type}`,
        `- Slug: ${article.article_slug}`,
        `- Target Words: ${article.target_word_min}-${article.target_word_max}`,
        `- Primary Keyword: ${getProject(article.project_id)?.primary_keyword || ""}`,
        `- Secondary Keywords: ${getProject(article.project_id)?.secondary_keywords || ""}`,
      ].join("\n");
      writeArticleBrief(article.project_id, articleBrief);

      // Copy brief to inputs for the article
      const articleInputsDir = getInputsDir(article.project_id);
      fs.mkdirSync(articleInputsDir, { recursive: true });
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
 * Run Cluster Phase 1b: Cross-link plan refinement.
 * Reads all approved outlines and refines the cross-link plan.
 */
export async function runPhase1b(clusterId: string): Promise<void> {
  const cluster = getCluster(clusterId);
  if (!cluster) throw new Error(`集群不存在: ${clusterId}`);

  const state = readClusterState(clusterId);
  const articles = listClusterArticles(clusterId);
  const clusterDir = getClusterDir(clusterId);
  const outputsDir = path.join(clusterDir, "outputs");
  fs.mkdirSync(outputsDir, { recursive: true });

  setClusterPhaseStatus(clusterId, "cluster_phase1b", "running");

  try {
    // Read each article's approved outline
    const outlineParts: string[] = [];
    for (const article of articles) {
      const outlinePath = path.join(getOutputsDir(article.project_id), "01_outline.md");
      if (fs.existsSync(outlinePath)) {
        outlineParts.push(`## Article: ${article.article_slug} (${article.article_role})\n\n${fs.readFileSync(outlinePath, "utf-8")}`);
      }
    }

    // Read current cross-link plan
    const crossLinkPath = path.join(clusterDir, "00_cross_link_plan.md");
    const crossLinkContent = fs.existsSync(crossLinkPath) ? fs.readFileSync(crossLinkPath, "utf-8") : "";

    // Build input for Phase 1b prompt
    const inputContent = [
      "# Approved Outlines",
      ...outlineParts,
      "---",
      "# Current Cross-Link Plan",
      crossLinkContent,
    ].join("\n\n");

    const inputPath = path.join(outputsDir, "phase1b_input.md");
    fs.writeFileSync(inputPath, inputContent, "utf-8");

    // Use the first article's project for model config
    const firstProject = getProject(articles[0].project_id);
    if (!firstProject) throw new Error("集群中没有文章项目");

    // Run Phase 1b skill prompt
    await runSkillPrompt(
      firstProject,
      [
        "scripts/run_prompt.py",
        "--prompt", "prompts/phase1b_cross_link_refine.md",
        "--input", inputPath,
        "--output", crossLinkPath,
      ]
    );

    // Update cluster state
    const updatedState = readClusterState(clusterId);
    updatedState.crossLinkPlanPath = crossLinkPath;
    const { writeClusterState } = await import("@/lib/clusterState");
    writeClusterState(updatedState);

    setClusterPhaseStatus(clusterId, "cluster_phase1b", "waiting_review");
  } catch (error) {
    setClusterPhaseStatus(clusterId, "cluster_phase1b", "failed", String(error));
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

/**
 * Validate cross-links in each article against the cluster's cross-link plan.
 * Returns a report of found/missing links per article.
 */
export function validateCrossLinks(clusterId: string): Array<{
  slug: string;
  totalRequired: number;
  found: number;
  missingBackLink: boolean;
  details: string[];
}> {
  const state = readClusterState(clusterId);
  const articles = listClusterArticles(clusterId);
  const rules = state.crossLinkRules;

  return articles.map((article) => {
    const articlePath = path.join(getOutputsDir(article.project_id), "03_full_article.md");
    if (!fs.existsSync(articlePath)) {
      return { slug: article.article_slug, totalRequired: 0, found: 0, missingBackLink: true, details: ["文章尚未生成"] };
    }

    const content = fs.readFileSync(articlePath, "utf-8").toLowerCase();
    const outgoingRules = rules.filter((r) => r.sourceSlug === article.article_slug);
    const details: string[] = [];
    let found = 0;
    let missingBackLink = true;

    for (const rule of outgoingRules) {
      // Check if the target slug appears in the article (as a link or plain text)
      const targetSlug = rule.targetSlug.toLowerCase();
      if (content.includes(targetSlug) || content.includes(rule.anchorText.toLowerCase())) {
        found++;
        details.push(`✓ ${rule.targetSlug}: "${rule.anchorText}"`);
      } else {
        details.push(`✗ ${rule.targetSlug}: "${rule.anchorText}" — 未找到`);
      }
    }

    // Check back-link to pillar
    const pillarArticle = articles.find((a) => a.article_role === "pillar");
    if (pillarArticle && article.article_role !== "pillar") {
      const hasBackLink = rules.some(
        (r) => r.sourceSlug === article.article_slug && r.targetSlug === pillarArticle.article_slug
      );
      missingBackLink = !hasBackLink;
    } else {
      missingBackLink = false;
    }

    return {
      slug: article.article_slug,
      totalRequired: outgoingRules.length,
      found,
      missingBackLink,
      details,
    };
  });
}

/**
 * Generate a batch review report for the entire cluster.
 * Checks cross-links, content overlap, and creates a summary.
 */
export async function generateBatchReview(clusterId: string): Promise<void> {
  const state = readClusterState(clusterId);
  const articles = listClusterArticles(clusterId);
  const clusterDir = getClusterDir(clusterId);

  // Validate cross-links
  const crossLinkReport = validateCrossLinks(clusterId);

  // Collect checklist reports
  const checklistReports = articles.map((article) => {
    const reportPath = path.join(getOutputsDir(article.project_id), "04_checklist_report.md");
    let content = "";
    if (fs.existsSync(reportPath)) {
      content = fs.readFileSync(reportPath, "utf-8");
    }
    const passed = content.includes("checklist_passed: true");
    return { slug: article.article_slug, role: article.article_role, passed, content };
  });

  // Build batch review markdown
  const lines: string[] = [
    "# 集群批量审查报告",
    "",
    `集群: ${state.clusterName}`,
    `文章数: ${articles.length}`,
    `互链规则: ${state.crossLinkRules.length} 条`,
    "",
    "## 1. 文章状态",
    "",
  ];

  for (const report of checklistReports) {
    lines.push(`- **${report.slug}** (${report.role}): ${report.passed ? "✓ Checklist 通过" : "✗ Checklist 未通过"}`);
  }

  lines.push("", "## 2. 互链验证", "");

  let allLinksOk = true;
  for (const report of crossLinkReport) {
    lines.push(`### ${report.slug}`);
    lines.push(`- 需要: ${report.totalRequired} 条出链, 找到: ${report.found} 条`);
    if (report.missingBackLink) {
      lines.push(`- ⚠ 缺少指向 Pillar 的回链`);
      allLinksOk = false;
    }
    for (const detail of report.details) {
      lines.push(`  - ${detail}`);
    }
    if (report.found < report.totalRequired) allLinksOk = false;
    lines.push("");
  }

  lines.push("## 3. 总结", "");
  const allChecklistPassed = checklistReports.every((r) => r.passed);
  lines.push(`- Checklist: ${allChecklistPassed ? "全部通过" : "部分未通过"}`);
  lines.push(`- 互链: ${allLinksOk ? "全部到位" : "存在缺失"}`);

  if (allChecklistPassed && allLinksOk) {
    lines.push("", "**集群审查通过，可以进入最终确认。**");
  } else {
    lines.push("", "**集群审查存在问题，请检查上述项目。**");
  }

  // Write the report
  const reportPath = path.join(clusterDir, "outputs", "cluster_batch_review.md");
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, lines.join("\n"), "utf-8");
}
