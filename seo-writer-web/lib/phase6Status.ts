import fs from "node:fs";
import path from "node:path";
import { getOutputsDir } from "@/lib/fileStorage";
import type { Project, ProjectState } from "@/lib/types";

export interface Phase6StatusSummary {
  label: string;
  statusClass: "not_started" | "running" | "waiting_review" | "approved" | "failed";
  description: string;
  provider: string;
  modelDisplayName: string;
  modelId: string;
  endpointId: string;
  useEndpointId: boolean;
  imagePlanExists: boolean;
  metadataExists: boolean;
  outputDocxExists: boolean;
  plannedCount: number;
  successCount: number;
  failedCount: number;
  details: string[];
}

interface ImagePlanFile {
  images?: unknown[];
}

interface ImageMetadataEntry {
  id?: string;
  status?: string;
  error?: string;
}

interface ImageMetadataFile {
  status?: string;
  error?: string;
  reason?: string;
  planned_count?: number;
  success_count?: number;
  failed_count?: number;
  retry_needed?: boolean;
  images?: ImageMetadataEntry[];
}

interface ImageReviewFile {
  images?: Record<string, { status?: string }>;
}

function readJson<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
  } catch {
    return null;
  }
}

function cleanDetails(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).slice(0, 4);
}

export function readPhase6Status(project: Project, state: ProjectState): Phase6StatusSummary {
  const outputsDir = getOutputsDir(project.id);
  const imagePlanPath = path.join(outputsDir, "image_plan.json");
  const metadataPath = path.join(outputsDir, "image_metadata.json");
  const outputDocxPath = path.join(outputsDir, "final_article_with_images.docx");
  const imagePlan = readJson<ImagePlanFile>(imagePlanPath);
  const metadata = readJson<ImageMetadataFile>(metadataPath);
  const images = Array.isArray(metadata?.images) ? metadata.images : [];
  const plannedImages = Array.isArray(imagePlan?.images) ? imagePlan.images : [];
  const successCount = Number(metadata?.success_count ?? images.filter((image) => image.status === "success").length);
  const failedCount = Number(metadata?.failed_count ?? images.filter((image) => image.status && image.status !== "success").length);
  const expectedCount = Math.max(0, Number(project.image_count_default || 0));
  const plannedCount = Math.max(Number(metadata?.planned_count ?? 0), plannedImages.length, expectedCount);
  const reviewPath = path.join(outputsDir, "image_review.json");
  const review = readJson<ImageReviewFile>(reviewPath);
  const reviewImages = review?.images || {};
  const allResolved = images.length > 0 && images.every((image) => {
    const id = String(image.id || "").trim();
    return image.status === "success" || reviewImages[id]?.status === "approved";
  });
  const rawDetails = allResolved ? [] : [
    String(metadata?.error || metadata?.reason || ""),
    ...images.map((image) => String(image.error || ""))
  ];
  const details = cleanDetails(rawDetails);
  const enabled = Boolean(Number(project.enable_image_generation));
  const imagePlanExists = fs.existsSync(imagePlanPath);
  const metadataExists = fs.existsSync(metadataPath);
  const outputDocxExists = fs.existsSync(outputDocxPath);
  const modelDisplayName = project.image_model_display_name || project.image_model_name || project.image_model_id || "未设置";

  const base = {
    provider: project.image_provider || "volcengine_ark",
    modelDisplayName,
    modelId: project.image_model_id || "",
    endpointId: project.image_endpoint_id || "",
    useEndpointId: Boolean(Number(project.image_use_endpoint_id)),
    imagePlanExists,
    metadataExists,
    outputDocxExists,
    plannedCount,
    successCount,
    failedCount,
    details
  };

  if (!enabled && !imagePlanExists) {
    return {
      ...base,
      label: "disabled",
      statusClass: "not_started",
      description: "生图已关闭。Phase 5 确认后会生成图片计划和含占位符的 Word 文档。点击「开始生图」即可生成图片。"
    };
  }

  if (!enabled && imagePlanExists) {
    return {
      ...base,
      label: "ready",
      statusClass: "waiting_review",
      description: "图片计划已就绪，生图功能当前关闭。点击「开始生图」即可生成图片。"
    };
  }

  if (
    !allResolved && (
      metadata?.status === "failed"
      || Boolean(metadata?.retry_needed)
      || failedCount > 0
      || (metadataExists && plannedCount > 0 && successCount < plannedCount)
    )
  ) {
    return {
      ...base,
      label: "failed",
      statusClass: "failed",
      description: "Phase 6 尚未生成全部计划图片。已成功的图片会保留，重试时只补失败或缺失的部分。"
    };
  }

  if (metadata?.status === "skipped") {
    return {
      ...base,
      label: "skipped",
      statusClass: "waiting_review",
      description: metadata.reason || "Phase 6 已跳过，通常是缺少图片计划或生图未启用。"
    };
  }

  if (metadata?.status === "waiting_image_review") {
    return {
      ...base,
      label: "waiting_review",
      statusClass: "waiting_review",
      description: "图片已生成，等待人工预览确认。确认通过后才会插入 Word 并生成带图最终文件。"
    };
  }

  if (metadata?.status === "completed" || outputDocxExists) {
    return {
      ...base,
      label: "completed",
      statusClass: "approved",
      description: "Phase 6 已完成，带图 Word 已生成或已写入最终输出。"
    };
  }

  if (state.phases.phase5.status !== "approved") {
    return {
      ...base,
      label: "waiting",
      statusClass: "not_started",
      description: "等待 Phase 5 确认后生成图片计划。确认后可随时点击「开始生图」生成图片。"
    };
  }

  if (imagePlanExists) {
    return {
      ...base,
      label: "ready",
      statusClass: "waiting_review",
      description: "图片计划已就绪。点击「开始生图」即可生成图片，不生图也不影响项目完成。"
    };
  }

  return {
    ...base,
    label: "not_started",
    statusClass: "not_started",
    description: "Phase 6 尚未开始。确认 Phase 5 后会生成图片计划，之后可随时点击「开始生图」生成图片。"
  };
}
