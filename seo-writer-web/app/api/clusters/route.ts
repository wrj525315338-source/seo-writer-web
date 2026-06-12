import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createCluster, createClusterArticle, listClusters } from "@/lib/db";
import { createInitialClusterState, writeClusterState } from "@/lib/clusterState";
import {
  ensureClusterDirs,
  getClusterStorageRoot,
  saveClusterBrief,
} from "@/lib/fileStorage";
import {
  copySharedFilesToProject,
  getSharedExampleArticleFiles,
  getSharedWritingGuidelineFiles,
  replaceSharedUploads,
} from "@/lib/sharedFiles";
import {
  ArticleRole,
  ArticleType,
  Cluster,
  ClusterArticle,
  ClusterArticleRecord,
  CrossLinkRule,
  ParsedCluster,
  SpecialRequirements,
} from "@/lib/types";
import { optionalText, sanitizeError, slugifyName } from "@/lib/validators";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ clusters: listClusters() });
}

/**
 * POST /api/clusters
 * Creates a cluster project from a parsed cluster preview.
 * Expects JSON body with the parsed cluster data, model config, and optional file references.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const clusterName: string = body.clusterName || "Untitled Cluster";
    const brandName: string = body.brandName || "";
    const language: string = body.language || "English";
    const blogBaseUrl: string = body.blogBaseUrl || "https://www.hellotalk.com/en/blog";
    const articles: ClusterArticle[] = body.articles || [];
    const crossLinkRules: CrossLinkRule[] = body.crossLinkRules || [];
    const specialRequirements: SpecialRequirements = body.specialRequirements || {
      bannedCompetitors: [],
      brandData: [],
      requiredModules: [],
      collisionWarnings: [],
      antiAiRules: [],
    };

    // Model config (shared across all articles in the cluster)
    const writingProvider = body.writingProvider || "openai";
    const writingModelName = body.writingModelName || "";
    const writingBaseUrl = body.writingBaseUrl || "";
    const writingTemperature = body.writingTemperature ?? 0.7;
    const auditorProvider = body.auditorProvider || writingProvider;
    const auditorModelName = body.auditorModelName || writingModelName;
    const auditorBaseUrl = body.auditorBaseUrl || writingBaseUrl;
    const auditorTemperature = body.auditorTemperature ?? 0.2;

    if (articles.length === 0) {
      return NextResponse.json({ error: "集群中至少需要一篇文章。" }, { status: 400 });
    }
    if (!writingModelName) {
      return NextResponse.json({ error: "请提供写作模型名称。" }, { status: 400 });
    }

    // Generate cluster ID
    const clusterSlug = slugifyName(clusterName);
    const clusterId = `cluster-${clusterSlug}-${randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();

    // Create cluster directory and save brief
    ensureClusterDirs(clusterId);

    // Save the original brief content if provided
    const briefContent = body.briefContent || "";
    if (briefContent) {
      saveClusterBrief(clusterId, briefContent);
    }

    // Resolve shared writing guidelines and examples
    const sharedGuidelines = getSharedWritingGuidelineFiles();
    const sharedExamples = getSharedExampleArticleFiles();

    // Create cluster record in DB
    const cluster: Cluster = {
      id: clusterId,
      name: clusterName,
      brand_name: brandName,
      language,
      brief_source_path: briefContent ? "cluster_brief.md" : "",
      shared_summary_path: "",
      shared_checklist_path: "",
      cross_link_plan_path: "",
      current_phase: "cluster_phase0",
      status: "active",
      blog_base_url: blogBaseUrl,
      created_at: now,
      updated_at: now,
    };
    createCluster(cluster);

    // Create individual projects for each article
    const articleRecords: ClusterArticleRecord[] = [];

    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      const projectId = `${clusterSlug}-${slugifyName(article.slug)}-${randomUUID().slice(0, 8)}`;

      // Import project creation dependencies
      const { createProject } = await import("@/lib/db");
      const { ensureProjectDirs: ensureArticleDirs } = await import("@/lib/fileStorage");
      const { createInitialProjectState, writeProjectState } = await import("@/lib/projectState");

      ensureArticleDirs(projectId);

      // Copy shared files to this article's project
      const guidelinePath =
        sharedGuidelines.length > 0
          ? copySharedFilesToProject(projectId, sharedGuidelines.slice(0, 1), "guideline_")[0]
          : "";
      const examplePaths =
        sharedExamples.length > 0
          ? copySharedFilesToProject(projectId, sharedExamples, "example_")
          : [];

      // Create project record
      const project = {
        id: projectId,
        name: `${clusterName} - ${article.title}`,
        article_title: article.title,
        topic: article.title,
        primary_keyword: article.primaryKeyword,
        secondary_keywords: article.secondaryKeywords.join(", "),
        article_focus: `${article.role} article in cluster: ${clusterName}`,
        recommendation_reason: `Part of ${clusterName} cluster, covering keyword: ${article.primaryKeyword}`,
        target_audience: "",
        search_intent: article.searchIntent || "",
        language,
        brand_name: brandName,
        writing_provider: writingProvider,
        writing_model_name: writingModelName,
        writing_base_url: writingBaseUrl,
        writing_temperature: writingTemperature,
        writing_max_tokens: 0,
        auditor_provider: auditorProvider,
        auditor_model_name: auditorModelName,
        auditor_base_url: auditorBaseUrl,
        auditor_temperature: auditorTemperature,
        auditor_max_tokens: 0,
        enable_image_generation: false,
        image_provider: "volcengine_ark" as const,
        image_model_display_name: "",
        image_model_name: "",
        image_model_id: "",
        image_endpoint_id: "",
        image_use_endpoint_id: false,
        image_base_url: "",
        image_temperature: 0.2,
        image_skill_path: "../skills/hellotalk-blog-image-planner-v2.skill",
        image_output_format: "png",
        image_aspect_ratio_default: "16:9",
        image_retry_count: 2,
        image_insert_mode: "placeholder",
        image_count_default: 3,
        image_allow_non_compliant_images: false,
        provider: writingProvider,
        model_name: writingModelName,
        base_url: writingBaseUrl,
        temperature: writingTemperature,
        max_tokens: 0,
        current_phase: "phase0" as const,
        status: "active" as const,
        created_at: now,
        updated_at: now,
      };

      createProject(project);

      // Create project state
      const state = createInitialProjectState(project, {
        writingGuidelineFile: guidelinePath,
        exampleArticleFiles: examplePaths,
        topicRequirementFile: "",
        imageRequirements: "",
        extraNotes: `Cluster: ${clusterId}\nArticle Role: ${article.role}\nArticle Type: ${article.articleType}\nTarget Words: ${article.targetWordCount.min}-${article.targetWordCount.max}`,
      });
      writeProjectState(state);

      // Create cluster-article association
      const record: ClusterArticleRecord = {
        id: `ca-${randomUUID().slice(0, 8)}`,
        cluster_id: clusterId,
        project_id: projectId,
        article_role: article.role as ArticleRole,
        article_slug: article.slug,
        article_type: article.articleType as ArticleType,
        target_word_min: article.targetWordCount.min,
        target_word_max: article.targetWordCount.max,
        sort_order: i,
      };
      createClusterArticle(record);
      articleRecords.push(record);
    }

    // Create cluster state
    const clusterState = createInitialClusterState({
      clusterId,
      clusterName,
      clusterSlug,
      articles,
      crossLinkRules,
      specialRequirements,
      blogBaseUrl,
    });
    writeClusterState(clusterState);

    // Generate initial cross-link plan
    const crossLinkPlanContent = generateCrossLinkPlanMarkdown(articles, crossLinkRules, specialRequirements);
    const crossLinkPlanPath = path.join(getClusterStorageRoot(), clusterId, "00_cross_link_plan.md");
    fs.writeFileSync(crossLinkPlanPath, crossLinkPlanContent, "utf-8");

    return NextResponse.json(
      {
        clusterId,
        articles: articleRecords.map((r) => ({
          projectId: r.project_id,
          role: r.article_role,
          slug: r.article_slug,
        })),
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: sanitizeError(error) }, { status: 400 });
  }
}

function generateCrossLinkPlanMarkdown(
  articles: ClusterArticle[],
  rules: CrossLinkRule[],
  requirements: SpecialRequirements
): string {
  const lines: string[] = [
    "# Cross-Link Plan",
    "",
    "## Articles",
    "",
    "| # | Role | Title | Keyword | Slug | Type | Words |",
    "|---|------|-------|---------|------|------|-------|",
  ];

  for (let i = 0; i < articles.length; i++) {
    const a = articles[i];
    lines.push(
      `| ${i + 1} | ${a.role} | ${a.title} | ${a.primaryKeyword} | ${a.slug} | ${a.articleType} | ${a.targetWordCount.min}-${a.targetWordCount.max} |`
    );
  }

  lines.push("");
  lines.push("## Cross-Link Rules");
  lines.push("");
  lines.push("| Source | Target | Anchor Text | Placement | Direction |");
  lines.push("|--------|--------|-------------|-----------|-----------|");

  for (const rule of rules) {
    lines.push(
      `| ${rule.sourceSlug} | ${rule.targetSlug} | ${rule.anchorText} | ${rule.placementHint} | ${rule.direction} |`
    );
  }

  if (requirements.bannedCompetitors.length > 0) {
    lines.push("");
    lines.push("## Banned Competitors");
    lines.push("");
    for (const c of requirements.bannedCompetitors) {
      lines.push(`- ${c}`);
    }
  }

  if (requirements.collisionWarnings.length > 0) {
    lines.push("");
    lines.push("## Collision Warnings");
    lines.push("");
    for (const w of requirements.collisionWarnings) {
      lines.push(`- ${w}`);
    }
  }

  return lines.join("\n");
}
