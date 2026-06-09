import { NextResponse } from "next/server";
import { getProject, listPhaseRuns, listReviewComments } from "@/lib/db";
import { listOutputFiles } from "@/lib/fileStorage";
import { readProjectState } from "@/lib/projectState";
import { decodeProjectId } from "@/lib/routeParams";
import { sanitizeError } from "@/lib/validators";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId: routeProjectId } = await context.params;
    const projectId = decodeProjectId(routeProjectId);
    const project = getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: "项目不存在" }, { status: 404 });
    }
    return NextResponse.json({
      project,
      state: readProjectState(projectId),
      phaseRuns: listPhaseRuns(projectId),
      reviewComments: listReviewComments(projectId),
      outputFiles: listOutputFiles(projectId)
    });
  } catch (error) {
    return NextResponse.json({ error: sanitizeError(error) }, { status: 500 });
  }
}
