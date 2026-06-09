import { NextRequest, NextResponse } from "next/server";
import { deleteProjects } from "@/lib/projectDeletion";
import { sanitizeError } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const projectIds = Array.isArray(body.projectIds) ? body.projectIds : [];
    if (projectIds.length === 0) {
      throw new Error("请选择要删除的文章项目。");
    }
    const deletedProjectIds = deleteProjects(projectIds.map((id: unknown) => String(id)));
    return NextResponse.json({ deletedProjectIds });
  } catch (error) {
    return NextResponse.json({ error: sanitizeError(error) }, { status: 400 });
  }
}
