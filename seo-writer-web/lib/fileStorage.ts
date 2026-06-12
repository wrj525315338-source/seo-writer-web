import fs from "node:fs";
import path from "node:path";
import { PhaseId } from "@/lib/types";
import { phaseOutputs, publicOutputFiles, requiresManualReview } from "@/lib/validators";

export interface OutputFileInfo {
  name: string;
  updatedAt: string;
  size: number;
}

export function getStorageRoot(): string {
  const configured = process.env.STORAGE_DIR || "./storage/projects";
  return path.isAbsolute(configured) ? configured : path.join(/* turbopackIgnore: true */ process.cwd(), configured);
}

export function getProjectDir(projectId: string): string {
  return path.join(getStorageRoot(), projectId);
}

export function getInputsDir(projectId: string): string {
  return path.join(getProjectDir(projectId), "inputs");
}

export function getOutputsDir(projectId: string): string {
  return path.join(getProjectDir(projectId), "outputs");
}

export function getProjectStatePath(projectId: string): string {
  return path.join(getProjectDir(projectId), "project_state.json");
}

export function ensureProjectDirs(projectId: string): void {
  fs.mkdirSync(getInputsDir(projectId), { recursive: true });
  fs.mkdirSync(getOutputsDir(projectId), { recursive: true });
}

export function safeFileName(name: string): string {
  const cleaned = name.replace(/[\\/:*?"<>|]/g, "_").replace(/\s+/g, " ").trim();
  return cleaned || `file-${Date.now()}`;
}

export async function saveUpload(projectId: string, file: File, prefix = ""): Promise<string> {
  ensureProjectDirs(projectId);
  const filename = safeFileName(`${prefix}${file.name}`);
  const target = path.join(getInputsDir(projectId), filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(target, buffer);
  return path.relative(getProjectDir(projectId), target).replace(/\\/g, "/");
}

export function writeArticleBrief(projectId: string, content: string): string {
  ensureProjectDirs(projectId);
  const target = path.join(getInputsDir(projectId), "article_brief.md");
  fs.writeFileSync(target, content, "utf-8");
  return path.relative(getProjectDir(projectId), target).replace(/\\/g, "/");
}

export function readProjectFile(projectId: string, relativePath: string): string {
  const target = resolveProjectFile(projectId, relativePath);
  return fs.readFileSync(target, "utf-8");
}

export function readOutputForPhase(projectId: string, phase: PhaseId): string {
  const firstOutput = phaseOutputs[phase].find((file) => file.endsWith(".md"));
  if (!firstOutput) {
    return "";
  }
  const target = path.join(getOutputsDir(projectId), firstOutput);
  return fs.existsSync(target) ? fs.readFileSync(target, "utf-8") : "";
}

export function readPreviewForPhase(projectId: string, phase: PhaseId): string {
  if (!requiresManualReview(phase)) {
    return "";
  }
  if (phase === "phase5") {
    const articlePath = path.join(getOutputsDir(projectId), phaseOutputs.phase3[0]);
    const checklistPath = path.join(getOutputsDir(projectId), phaseOutputs.phase4[0]);
    const sections: string[] = [];
    if (fs.existsSync(articlePath)) {
      sections.push(["# Final Article Preview", "", fs.readFileSync(articlePath, "utf-8")].join("\n"));
    }
    if (fs.existsSync(checklistPath)) {
      sections.push(["# Phase 4 Checklist 查验结果", "", fs.readFileSync(checklistPath, "utf-8")].join("\n"));
    }
    return sections.join("\n\n");
  }
  return readOutputForPhase(projectId, phase);
}

export function listOutputFiles(projectId: string): OutputFileInfo[] {
  const outputDir = getOutputsDir(projectId);
  if (!fs.existsSync(outputDir)) {
    return [];
  }
  return publicOutputFiles
    .filter((file) => fs.existsSync(path.join(outputDir, file)))
    .filter((file) => !file.startsWith("."))
    .map((file) => {
      const stats = fs.statSync(path.join(outputDir, file));
      return {
        name: file,
        updatedAt: stats.mtime.toISOString(),
        size: stats.size
      };
    });
}

export function resolveProjectFile(projectId: string, relativePath: string): string {
  const projectDir = getProjectDir(projectId);
  const target = path.resolve(projectDir, relativePath);
  if (!target.startsWith(path.resolve(projectDir))) {
    throw new Error("非法文件路径");
  }
  if (!fs.existsSync(target)) {
    throw new Error("文件不存在");
  }
  return target;
}

// ============ Cluster Storage ============

export function getClusterStorageRoot(): string {
  const configured = process.env.CLUSTER_STORAGE_DIR || "./storage/clusters";
  return path.isAbsolute(configured) ? configured : path.join(/* turbopackIgnore: true */ process.cwd(), configured);
}

export function getClusterDir(clusterId: string): string {
  return path.join(getClusterStorageRoot(), clusterId);
}

export function getClusterArticlesDir(clusterId: string): string {
  return path.join(getClusterDir(clusterId), "articles");
}

export function getClusterStatePath(clusterId: string): string {
  return path.join(getClusterDir(clusterId), "cluster_state.json");
}

export function ensureClusterDirs(clusterId: string): void {
  fs.mkdirSync(getClusterDir(clusterId), { recursive: true });
  fs.mkdirSync(getClusterArticlesDir(clusterId), { recursive: true });
}

export function saveClusterBrief(clusterId: string, content: string): string {
  ensureClusterDirs(clusterId);
  const target = path.join(getClusterDir(clusterId), "cluster_brief.md");
  fs.writeFileSync(target, content, "utf-8");
  return target;
}

export function readClusterFile(clusterId: string, relativePath: string): string {
  const clusterDir = getClusterDir(clusterId);
  const target = path.resolve(clusterDir, relativePath);
  if (!target.startsWith(path.resolve(clusterDir))) {
    throw new Error("非法文件路径");
  }
  if (!fs.existsSync(target)) {
    throw new Error("文件不存在");
  }
  return target;
}
