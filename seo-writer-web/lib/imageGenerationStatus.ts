import fs from "node:fs";
import path from "node:path";
import { getOutputsDir } from "@/lib/fileStorage";

export interface ImageGenerationRecoveryStatus {
  shouldShow: boolean;
  status: string;
  title: string;
  message: string;
  details: string[];
  metadataPath: string;
  logPath: string;
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

const modelErrorPatterns = [
  /InvalidEndpointOrModel\.NotFound/i,
  /image_model_id/i,
  /image_endpoint_id/i,
  /final_model_for_request/i,
  /official Model ID/i,
  /UI 展示名称/i,
  /model.*not.*found/i,
  /endpoint.*not.*found/i,
  /Missing API key/i,
  /Image API HTTP/i,
  /Image API network error/i,
  /火山方舟官方/i
];

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

function compactDetails(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).slice(0, 6);
}

function isModelLikeError(message: string): boolean {
  return modelErrorPatterns.some((pattern) => pattern.test(message));
}

export function readImageGenerationRecoveryStatus(projectId: string, expectedImageCount = 0): ImageGenerationRecoveryStatus {
  const outputsDir = getOutputsDir(projectId);
  const metadataPath = path.join(outputsDir, "image_metadata.json");
  const logPath = path.join(outputsDir, "phase6.log");
  const metadata = readJson<ImageMetadataFile>(metadataPath);
  const empty: ImageGenerationRecoveryStatus = {
    shouldShow: false,
    status: "",
    title: "",
    message: "",
    details: [],
    metadataPath,
    logPath
  };

  if (!metadata) {
    return empty;
  }

  const images = Array.isArray(metadata.images) ? metadata.images : [];
  const errors = compactDetails([
    String(metadata.error || metadata.reason || ""),
    ...images.map((image) => String(image.error || ""))
  ]);
  const successCount = images.filter((image) => image.status === "success").length;
  const failedCount = images.filter((image) => image.status && image.status !== "success").length;
  const plannedCount = Math.max(
    Number(metadata.planned_count || 0),
    images.length,
    Number(expectedImageCount || 0)
  );
  const topLevelFailed = metadata.status === "failed";
  const allAttemptedImagesFailed = images.length > 0 && successCount === 0 && failedCount > 0;
  const partialFailure = failedCount > 0 || Boolean(metadata.retry_needed) || (plannedCount > 0 && successCount < plannedCount);
  const hasModelLikeError = errors.some(isModelLikeError);

  if (!topLevelFailed && !allAttemptedImagesFailed && !partialFailure && !hasModelLikeError) {
    return empty;
  }

  return {
    shouldShow: true,
    status: metadata.status || (allAttemptedImagesFailed ? "failed" : "unknown"),
    title: hasModelLikeError ? "图片生成模型调用失败" : "图片生成未成功",
    message: partialFailure
      ? "Phase 6 尚未生成全部计划图片。已成功的图片会保留；点击重试时只会补失败或缺失的图片，全部成功后才生成最终 Word。"
      : hasModelLikeError
      ? "Phase 6 生图时模型或接口返回了错误。可以先重试；如果仍失败，请更换生图模型或 Endpoint ID 后再生成。"
      : "Phase 6 没有生成可插入 Word 的图片。可以重试当前配置，或更换模型后再生成。",
    details: errors,
    metadataPath,
    logPath
  };
}
