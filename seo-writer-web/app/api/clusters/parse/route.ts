import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { parseClusterBrief } from "@/lib/clusterParser";
import { safeFileName } from "@/lib/fileStorage";
import { sanitizeError } from "@/lib/validators";

export const runtime = "nodejs";

/**
 * POST /api/clusters/parse
 * Accepts a brief file (md/xlsx/docx/txt) and optionally writing guidelines + examples.
 * Returns parsed cluster structure for preview before creation.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const briefFile = formData.get("briefFile");

    if (!briefFile || typeof briefFile === "string" || briefFile.size === 0) {
      return NextResponse.json({ error: "请上传 brief 文件。" }, { status: 400 });
    }

    // Save the brief file to a temp location for parsing
    const tempDir = path.join(process.cwd(), "storage", "temp");
    fs.mkdirSync(tempDir, { recursive: true });
    const tempFileName = safeFileName(`brief_${Date.now()}_${briefFile.name}`);
    const tempFilePath = path.join(tempDir, tempFileName);
    fs.writeFileSync(tempFilePath, Buffer.from(await briefFile.arrayBuffer()));

    try {
      // Parse the brief (Layer 1 only - no LLM for preview)
      const parsed = await parseClusterBrief(tempFilePath);

      return NextResponse.json({
        parsed,
        tempFilePath: tempFileName, // Return filename for later use during creation
        originalFileName: briefFile.name,
      });
    } finally {
      // Clean up temp file
      // Note: We keep it for now so the creation step can reuse it.
      // It will be cleaned up during cluster creation or by a periodic cleanup job.
    }
  } catch (error) {
    return NextResponse.json({ error: sanitizeError(error) }, { status: 400 });
  }
}
