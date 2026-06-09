import fs from "node:fs";
import path from "node:path";
import { getInputsDir, getProjectDir, safeFileName } from "@/lib/fileStorage";

export interface SharedFilesStatus {
  hasWritingGuideline: boolean;
  hasExampleArticles: boolean;
  writingGuidelineFiles: string[];
  exampleArticleFiles: string[];
}

type SharedCategory = "writing-guidelines" | "examples";

export function getSharedRoot(): string {
  const configured = process.env.SHARED_STORAGE_DIR || "./storage/shared";
  return path.isAbsolute(configured) ? configured : path.join(/* turbopackIgnore: true */ process.cwd(), configured);
}

function getSharedCategoryDir(category: SharedCategory): string {
  return path.join(getSharedRoot(), category);
}

function ensureSharedCategoryDir(category: SharedCategory): string {
  const dir = getSharedCategoryDir(category);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function listSharedCategoryFiles(category: SharedCategory): string[] {
  const dir = getSharedCategoryDir(category);
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs
    .readdirSync(dir)
    .filter((file) => !file.startsWith("."))
    .map((file) => path.join(dir, file))
    .filter((file) => fs.statSync(file).isFile())
    .sort();
}

function clearSharedCategory(category: SharedCategory): void {
  const dir = ensureSharedCategoryDir(category);
  for (const file of fs.readdirSync(dir)) {
    const target = path.join(dir, file);
    if (fs.statSync(target).isFile()) {
      fs.unlinkSync(target);
    }
  }
}

export function getSharedFilesStatus(): SharedFilesStatus {
  const writingGuidelineFiles = listSharedCategoryFiles("writing-guidelines").map((file) => path.basename(file));
  const exampleArticleFiles = listSharedCategoryFiles("examples").map((file) => path.basename(file));
  return {
    hasWritingGuideline: writingGuidelineFiles.length > 0,
    hasExampleArticles: exampleArticleFiles.length > 0,
    writingGuidelineFiles,
    exampleArticleFiles
  };
}

export async function replaceSharedUploads(category: SharedCategory, files: File[], prefix: string): Promise<string[]> {
  clearSharedCategory(category);
  const dir = ensureSharedCategoryDir(category);
  const saved: string[] = [];
  for (const [index, file] of files.entries()) {
    const filename = safeFileName(`${prefix}${index + 1}_${file.name}`);
    const target = path.join(dir, filename);
    fs.writeFileSync(target, Buffer.from(await file.arrayBuffer()));
    saved.push(target);
  }
  return saved;
}

export function getSharedWritingGuidelineFiles(): string[] {
  return listSharedCategoryFiles("writing-guidelines");
}

export function getSharedExampleArticleFiles(): string[] {
  return listSharedCategoryFiles("examples");
}

export function copySharedFilesToProject(projectId: string, files: string[], prefix: string): string[] {
  fs.mkdirSync(getInputsDir(projectId), { recursive: true });
  return files.map((file, index) => {
    const filename = safeFileName(`${prefix}${index + 1}_${path.basename(file)}`);
    const target = path.join(getInputsDir(projectId), filename);
    fs.copyFileSync(file, target);
    return path.relative(getProjectDir(projectId), target).replace(/\\/g, "/");
  });
}
