import fs from "node:fs";
import path from "node:path";
import { getOutputsDir, getProjectDir } from "@/lib/fileStorage";

export type ImageReviewItemStatus = "pending" | "approved" | "needs_revision" | "failed";

export interface ImageReviewItem {
  id: string;
  type: string;
  prompt: string;
  altText: string;
  insertAfterText: string;
  insertBeforeHeading: string;
  relativePath: string;
  status: ImageReviewItemStatus;
  reviewComment: string;
  error: string;
  compliant: boolean;
  failedChecks: string[];
  generatedAt: string;
  updatedAt: string;
}

export interface ImageReviewStatus {
  shouldShow: boolean;
  label: string;
  statusClass: "not_started" | "running" | "waiting_review" | "approved" | "failed";
  description: string;
  allApproved: boolean;
  canGenerateFinal: boolean;
  outputDocxExists: boolean;
  plannedCount: number;
  successCount: number;
  items: ImageReviewItem[];
  details: string[];
}

interface ImagePlanEntry {
  id?: string;
  type?: string;
  prompt?: string;
  alt_text?: string;
  insert_after_text?: string;
  insert_before_heading?: string;
}

interface ImagePlanFile {
  images?: ImagePlanEntry[];
}

interface ImageMetadataEntry {
  id?: string;
  type?: string;
  prompt?: string;
  original_prompt?: string;
  alt_text?: string;
  insert_after_text?: string;
  insert_before_heading?: string;
  file_path?: string;
  status?: string;
  error?: string;
  compliant?: boolean;
  compliance_failed_checks?: string[];
}

interface ImageMetadataFile {
  status?: string;
  error?: string;
  reason?: string;
  planned_count?: number;
  success_count?: number;
  retry_needed?: boolean;
  images?: ImageMetadataEntry[];
}

interface ImageReviewFile {
  status?: string;
  updatedAt?: string;
  images?: Record<string, {
    status?: ImageReviewItemStatus;
    reviewComment?: string;
    updatedAt?: string;
  }>;
}

function reviewPath(projectId: string): string {
  return path.join(getOutputsDir(projectId), "image_review.json");
}

function outputDocxPath(projectId: string): string {
  return path.join(getOutputsDir(projectId), "final_article_with_images.docx");
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

function writeJson(filePath: string, data: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function compactDetails(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).slice(0, 6);
}

function normalizeId(value: unknown, fallback: string): string {
  const raw = String(value || fallback).trim();
  return raw || fallback;
}

function safeRelativeProjectPath(projectId: string, filePath: string): string {
  if (!filePath) {
    return "";
  }
  const projectDir = path.resolve(getProjectDir(projectId));
  const resolved = path.resolve(filePath);
  if ((resolved !== projectDir && !resolved.startsWith(projectDir + path.sep)) || !fs.existsSync(resolved)) {
    return "";
  }
  return path.relative(projectDir, resolved).replace(/\\/g, "/");
}

function metadataById(metadata: ImageMetadataEntry[]): Map<string, ImageMetadataEntry> {
  const byId = new Map<string, ImageMetadataEntry>();
  for (const entry of metadata) {
    const id = String(entry.id || "").trim();
    if (id) {
      byId.set(id, entry);
    }
  }
  return byId;
}

function planIds(planImages: ImagePlanEntry[], metadataImages: ImageMetadataEntry[]): string[] {
  const ids = new Set<string>();
  planImages.forEach((image, index) => ids.add(normalizeId(image.id, `IMAGE_${index + 1}`)));
  metadataImages.forEach((image, index) => ids.add(normalizeId(image.id, `IMAGE_${index + 1}`)));
  return Array.from(ids).sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
}

function buildReviewFileFromStatus(status: ImageReviewStatus, changedImageId = ""): ImageReviewFile {
  const now = new Date().toISOString();
  const images: ImageReviewFile["images"] = {};
  for (const item of status.items) {
    const shouldReset = changedImageId ? item.id === changedImageId : item.status !== "approved";
    images[item.id] = {
      status: item.relativePath ? (shouldReset ? "pending" : item.status) : "failed",
      reviewComment: shouldReset ? "" : item.reviewComment,
      updatedAt: now
    };
  }
  return {
    status: "waiting_review",
    updatedAt: now,
    images
  };
}

export function readImageReviewStatus(projectId: string): ImageReviewStatus {
  const outputsDir = getOutputsDir(projectId);
  const plan = readJson<ImagePlanFile>(path.join(outputsDir, "image_plan.json"));
  const metadata = readJson<ImageMetadataFile>(path.join(outputsDir, "image_metadata.json"));
  const review = readJson<ImageReviewFile>(reviewPath(projectId));
  const planImages = Array.isArray(plan?.images) ? plan.images : [];
  const metadataImages = Array.isArray(metadata?.images) ? metadata.images : [];
  const metadataMap = metadataById(metadataImages);
  const outputDocxExists = fs.existsSync(outputDocxPath(projectId));
  const ids = planIds(planImages, metadataImages);
  const plannedCount = Math.max(Number(metadata?.planned_count || 0), planImages.length, ids.length);
  const successCount = Number(
    metadata?.success_count
      ?? metadataImages.filter((image) => image.status === "success").length
  );

  const items: ImageReviewItem[] = ids.map((id, index) => {
    const planImage = planImages.find((image) => normalizeId(image.id, `IMAGE_${index + 1}`) === id) || {};
    const meta = metadataMap.get(id) || {};
    const fileRelativePath = safeRelativeProjectPath(projectId, String(meta.file_path || ""));
    const reviewState = review?.images?.[id];
    const hasGeneratedFile = Boolean(fileRelativePath);
    const status: ImageReviewItemStatus = hasGeneratedFile
      ? (reviewState?.status || (outputDocxExists ? "approved" : "pending"))
      : "failed";
    return {
      id,
      type: String(meta.type || planImage.type || ""),
      prompt: String(meta.original_prompt || meta.prompt || planImage.prompt || ""),
      altText: String(meta.alt_text || planImage.alt_text || ""),
      insertAfterText: String(meta.insert_after_text || planImage.insert_after_text || ""),
      insertBeforeHeading: String(meta.insert_before_heading || planImage.insert_before_heading || ""),
      relativePath: fileRelativePath,
      status,
      reviewComment: String(reviewState?.reviewComment || ""),
      error: String(meta.error || ""),
      compliant: Boolean(meta.compliant),
      failedChecks: Array.isArray(meta.compliance_failed_checks) ? meta.compliance_failed_checks.map(String) : [],
      generatedAt: "",
      updatedAt: String(reviewState?.updatedAt || "")
    };
  });

  const generatedCount = items.filter((item) => item.relativePath).length;
  const allGenerated = plannedCount > 0 && generatedCount >= plannedCount && items.every((item) => item.relativePath);
  const allApproved = items.length > 0 && items.every((item) => item.status === "approved" && item.relativePath);
  const details = compactDetails([
    allGenerated ? "" : String(metadata?.error || metadata?.reason || ""),
    ...items.map((item) => item.error)
  ]);

  if (!metadata && !plan && !review) {
    return {
      shouldShow: false,
      label: "not_started",
      statusClass: "not_started",
      description: "图片生成尚未开始。",
      allApproved: false,
      canGenerateFinal: false,
      outputDocxExists,
      plannedCount: 0,
      successCount: 0,
      items: [],
      details: []
    };
  }

  if (!allGenerated) {
    return {
      shouldShow: items.length > 0,
      label: "failed",
      statusClass: "failed",
      description: "图片还没有全部生成成功。可以先查看已生成图片，失败图片需要重试或更换生图模型。",
      allApproved: false,
      canGenerateFinal: false,
      outputDocxExists,
      plannedCount,
      successCount: generatedCount,
      items,
      details
    };
  }

  if (outputDocxExists || metadata?.status === "completed") {
    return {
      shouldShow: items.length > 0,
      label: "completed",
      statusClass: "approved",
      description: "图片已通过审核并插入最终 Word 文件。",
      allApproved: true,
      canGenerateFinal: false,
      outputDocxExists,
      plannedCount,
      successCount: generatedCount,
      items: items.map((item) => ({ ...item, status: "approved" })),
      details
    };
  }

  if (allApproved) {
    return {
      shouldShow: true,
      label: "approved",
      statusClass: "approved",
      description: "所有图片已确认通过，可以生成带图最终文件。",
      allApproved: true,
      canGenerateFinal: true,
      outputDocxExists,
      plannedCount,
      successCount: generatedCount,
      items,
      details
    };
  }

  return {
    shouldShow: items.length > 0,
    label: "waiting_review",
    statusClass: "waiting_review",
    description: "图片已生成，请逐张预览。通过后再插入文档；不通过时只重生成对应图片。",
    allApproved: false,
    canGenerateFinal: false,
    outputDocxExists,
    plannedCount,
    successCount: generatedCount,
    items,
    details
  };
}

export function resetImageReviewForGeneratedImages(projectId: string, changedImageId = ""): void {
  const status = readImageReviewStatus(projectId);
  if (status.items.length === 0) {
    return;
  }
  writeJson(reviewPath(projectId), buildReviewFileFromStatus(status, changedImageId));
}

export function approveImage(projectId: string, imageId: string): void {
  const status = readImageReviewStatus(projectId);
  const target = status.items.find((item) => item.id === imageId);
  if (!target || !target.relativePath) {
    throw new Error(`图片不存在或尚未生成成功：${imageId}`);
  }
  const review = readJson<ImageReviewFile>(reviewPath(projectId)) || { images: {} };
  const now = new Date().toISOString();
  review.images = review.images || {};
  review.images[imageId] = {
    status: "approved",
    reviewComment: target.reviewComment,
    updatedAt: now
  };
  review.status = "waiting_review";
  review.updatedAt = now;
  writeJson(reviewPath(projectId), review);
}

export function markImageNeedsRevision(projectId: string, imageId: string, comment: string): void {
  const status = readImageReviewStatus(projectId);
  const target = status.items.find((item) => item.id === imageId);
  if (!target) {
    throw new Error(`图片不存在：${imageId}`);
  }
  const review = readJson<ImageReviewFile>(reviewPath(projectId)) || { images: {} };
  const now = new Date().toISOString();
  review.images = review.images || {};
  review.images[imageId] = {
    status: "needs_revision",
    reviewComment: comment,
    updatedAt: now
  };
  review.status = "waiting_review";
  review.updatedAt = now;
  writeJson(reviewPath(projectId), review);
}

export function approveAllImages(projectId: string): void {
  const status = readImageReviewStatus(projectId);
  if (status.items.length === 0) {
    throw new Error("还没有可审核的图片。");
  }
  const missing = status.items.filter((item) => !item.relativePath || item.status === "failed");
  if (missing.length > 0) {
    throw new Error(`仍有图片未生成成功：${missing.map((item) => item.id).join(", ")}`);
  }
  const now = new Date().toISOString();
  const images: ImageReviewFile["images"] = {};
  for (const item of status.items) {
    images[item.id] = {
      status: "approved",
      reviewComment: item.reviewComment,
      updatedAt: now
    };
  }
  writeJson(reviewPath(projectId), {
    status: "approved",
    updatedAt: now,
    images
  });
}
