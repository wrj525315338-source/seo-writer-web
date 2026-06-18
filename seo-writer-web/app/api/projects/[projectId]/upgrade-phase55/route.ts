import { NextRequest, NextResponse } from "next/server";
import { upgradePhase55ToFullPlanning } from "@/lib/phaseRunner";
import { sanitizeError } from "@/lib/validators";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await context.params;
    await upgradePhase55ToFullPlanning(projectId);

    return NextResponse.json({
      success: true,
      message: "已升级为完整规划模式"
    });
  } catch (error) {
    const message = sanitizeError(error);
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
