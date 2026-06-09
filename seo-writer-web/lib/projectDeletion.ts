import fs from "node:fs";
import path from "node:path";
import { deleteProjectRecords, getProject } from "@/lib/db";
import { decodeProjectId } from "@/lib/routeParams";

function resolveStorageRoot(): string {
  const configured = process.env.STORAGE_DIR || "./storage/projects";
  if (configured === "./storage/projects" || configured === "storage/projects") {
    return path.join(/* turbopackIgnore: true */ process.cwd(), "storage", "projects");
  }
  return path.isAbsolute(configured)
    ? path.resolve(configured)
    : path.join(/* turbopackIgnore: true */ process.cwd(), configured);
}

function assertProjectDirInsideStorage(projectId: string): string {
  const storageRoot = resolveStorageRoot();
  const projectDir = path.resolve(path.join(storageRoot, projectId));
  if (projectDir !== storageRoot && projectDir.startsWith(`${storageRoot}${path.sep}`)) {
    return projectDir;
  }
  throw new Error("项目目录路径不安全，已取消删除。");
}

export function deleteProject(projectId: string): boolean {
  const id = decodeProjectId(projectId).trim();
  if (!id) {
    return false;
  }

  const project = getProject(id);
  if (!project) {
    return false;
  }

  const projectDir = assertProjectDirInsideStorage(id);
  const deleted = deleteProjectRecords(id);
  if (deleted) {
    fs.rmSync(/* turbopackIgnore: true */ projectDir, { recursive: true, force: true });
  }
  return deleted;
}

export function deleteProjects(projectIds: string[]): string[] {
  const uniqueIds = Array.from(new Set(projectIds.map((id) => String(id || "").trim()).filter(Boolean)));
  const deleted: string[] = [];
  for (const projectId of uniqueIds) {
    if (deleteProject(projectId)) {
      deleted.push(decodeProjectId(projectId).trim());
    }
  }
  return deleted;
}
