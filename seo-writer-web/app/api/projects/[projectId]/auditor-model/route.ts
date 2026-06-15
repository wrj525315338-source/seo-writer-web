import { NextRequest, NextResponse } from "next/server";
import { getProject, updateProjectAuditorModelConfig } from "@/lib/db";
import { updateAuditorModelInState } from "@/lib/projectState";
import { decodeProjectId } from "@/lib/routeParams";
import { sanitizeError } from "@/lib/validators";
import type { Provider } from "@/lib/types";

export const runtime = "nodejs";

const VALID_PROVIDERS: Provider[] = ["openai", "anthropic", "deepseek", "qwen", "doubao", "xiaomi", "custom"];

/**
 * PUT /api/projects/:projectId/auditor-model
 * Update the auditor model configuration for a project.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId: routeProjectId } = await params;
    const projectId = decodeProjectId(routeProjectId);
    const project = getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: "项目不存在" }, { status: 404 });
    }

    const body = await request.json();
    const provider: Provider = VALID_PROVIDERS.includes(body.provider) ? body.provider : "openai";
    const modelName: string = String(body.modelName || "");
    const baseUrl: string = String(body.baseUrl || "");
    const temperature: number = Number(body.temperature) || 0.2;

    if (!modelName) {
      return NextResponse.json({ error: "模型名称不能为空" }, { status: 400 });
    }

    // Update DB
    updateProjectAuditorModelConfig(projectId, { provider, modelName, baseUrl, temperature });

    // Update project state JSON
    updateAuditorModelInState(projectId, { provider, modelName, baseUrl, temperature });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: sanitizeError(error) }, { status: 400 });
  }
}
