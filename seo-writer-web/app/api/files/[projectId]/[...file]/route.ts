import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { resolveProjectFile } from "@/lib/fileStorage";
import { decodeProjectId } from "@/lib/routeParams";
import { sanitizeError } from "@/lib/validators";

export const runtime = "nodejs";

function contentType(filename: string): string {
  const lower = filename.toLowerCase();
  if (filename.endsWith(".md")) {
    return "text/markdown; charset=utf-8";
  }
  if (filename.endsWith(".json")) {
    return "application/json; charset=utf-8";
  }
  if (filename.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (lower.endsWith(".png")) {
    return "image/png";
  }
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
    return "image/jpeg";
  }
  if (lower.endsWith(".webp")) {
    return "image/webp";
  }
  if (lower.endsWith(".gif")) {
    return "image/gif";
  }
  return "application/octet-stream";
}

function contentDisposition(filename: string): string {
  return contentType(filename).startsWith("image/")
    ? "inline"
    : `attachment; filename="${encodeURIComponent(path.basename(filename))}"`;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ projectId: string; file: string[] }> }
) {
  try {
    const { projectId: routeProjectId, file } = await context.params;
    const projectId = decodeProjectId(routeProjectId);
    const relativePath = file.join("/");
    const target = resolveProjectFile(projectId, relativePath);
    const data = fs.readFileSync(target);
    return new NextResponse(data, {
      headers: {
        "Content-Type": contentType(target),
        "Content-Disposition": contentDisposition(target)
      }
    });
  } catch (error) {
    return NextResponse.json({ error: sanitizeError(error) }, { status: 404 });
  }
}
