import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { parseClusterBrief } from "@/lib/clusterParser";
import { safeFileName } from "@/lib/fileStorage";
import { getSharedWritingGuidelineFiles, getSharedExampleArticleFiles } from "@/lib/sharedFiles";
import { sanitizeError } from "@/lib/validators";

export const runtime = "nodejs";

function isUploadedFile(value: FormDataEntryValue | null): value is File {
  return Boolean(value && typeof value !== "string" && value.size > 0);
}

function uploadedFiles(values: FormDataEntryValue[]): File[] {
  return values.filter((value): value is File => typeof value !== "string" && value.size > 0);
}

/** Save uploaded file to session-scoped directory, return absolute path */
async function saveToSession(sessionDir: string, file: File, prefix: string): Promise<string> {
  fs.mkdirSync(sessionDir, { recursive: true });
  const filename = safeFileName(`${prefix}${file.name}`);
  const target = path.join(sessionDir, filename);
  fs.writeFileSync(target, Buffer.from(await file.arrayBuffer()));
  return target;
}

/**
 * POST /api/clusters/parse
 * Accepts a brief file (md/xlsx/docx/txt) and optionally writing guidelines + examples.
 * Uploaded reference files are saved to a session-scoped directory (not global shared storage).
 * Returns parsed cluster structure + sessionId for later use during creation.
 */
export async function POST(request: NextRequest) {
  let sessionDir = "";
  try {
    const formData = await request.formData();
    const briefFile = formData.get("briefFile");

    if (!briefFile || typeof briefFile === "string" || briefFile.size === 0) {
      return NextResponse.json({ error: "请上传 brief 文件。" }, { status: 400 });
    }

    // Create session-scoped temp directory for this parse session
    const sessionId = randomUUID().slice(0, 8);
    sessionDir = path.join(process.cwd(), "storage", "temp", `parse_${sessionId}`);
    fs.mkdirSync(sessionDir, { recursive: true });

    // Save uploaded guidelines to session directory (not global shared)
    const uploadedGuideline = formData.get("writingGuidelineFile");
    if (isUploadedFile(uploadedGuideline)) {
      await saveToSession(sessionDir, uploadedGuideline, "guideline_");
    }

    // Save uploaded examples to session directory
    const uploadedExamples = uploadedFiles(formData.getAll("exampleArticleFiles"));
    for (let i = 0; i < uploadedExamples.length; i++) {
      await saveToSession(sessionDir, uploadedExamples[i], `example_${i + 1}_`);
    }

    // Check that writing guidelines exist (either uploaded to session or previously shared)
    const sessionGuidelines = fs.readdirSync(sessionDir)
      .filter(f => f.startsWith("guideline_"))
      .map(f => path.join(sessionDir, f));
    const sharedGuidelines = getSharedWritingGuidelineFiles();
    const hasGuideline = sessionGuidelines.length > 0 || sharedGuidelines.length > 0;

    if (!hasGuideline) {
      return NextResponse.json(
        { error: "请上传写作规范。上传一次后，后续项目会自动复用。" },
        { status: 400 }
      );
    }

    // Save the brief file for parsing
    const tempFileName = safeFileName(`brief_${Date.now()}_${briefFile.name}`);
    const tempFilePath = path.join(sessionDir, tempFileName);
    fs.writeFileSync(tempFilePath, Buffer.from(await briefFile.arrayBuffer()));

    const ext = briefFile.name.split(".").pop()?.toLowerCase() || "";
    const isBinary = ["docx", "doc", "xlsx", "xlsm"].includes(ext);

    // Extract text content for binary formats
    let briefContent = "";
    if (isBinary) {
      const { execFileSync } = await import("node:child_process");
      const extractOutPath = tempFilePath + ".for_client.md";
      const scriptPath = path.join(process.cwd(), "..", "skills", "seo-article-writer", "scripts", "extract_materials.py");
      try {
        execFileSync("python", [scriptPath, tempFilePath, "-o", extractOutPath], { timeout: 30000, stdio: "pipe" });
        if (fs.existsSync(extractOutPath)) {
          briefContent = fs.readFileSync(extractOutPath, "utf-8");
          fs.unlinkSync(extractOutPath);
        }
      } catch { /* extraction failed */ }
    } else {
      briefContent = fs.readFileSync(tempFilePath, "utf-8");
    }

    // Parse the brief (Layer 1 only - no LLM for preview)
    let parsed;
    try {
      parsed = await parseClusterBrief(tempFilePath);
    } catch {
      if (isBinary) {
        parsed = {
          clusterName: "未命名集群",
          brandName: "",
          language: "English",
          articles: [],
          crossLinkRules: [],
          specialRequirements: { bannedCompetitors: [], brandData: [], requiredModules: [], collisionWarnings: [], antiAiRules: [] },
          sourceType: "docx" as const,
        };
      } else {
        throw new Error("Brief 解析失败，请检查文件格式。");
      }
    }

    if (isBinary && parsed.articles.length === 0) {
      return NextResponse.json({
        error: "无法从二进制格式中自动解析文章列表。请改用 .md 或 .txt 格式的 brief 文件。",
        parsed: null,
        briefContent,
        originalFileName: briefFile.name,
      }, { status: 400 });
    }

    return NextResponse.json({
      parsed,
      briefContent,
      originalFileName: briefFile.name,
      sessionId,
    });
  } catch (error) {
    // Clean up session directory on failure
    if (sessionDir && fs.existsSync(sessionDir)) {
      try { fs.rmSync(sessionDir, { recursive: true, force: true }); } catch { /* non-fatal */ }
    }
    return NextResponse.json({ error: sanitizeError(error) }, { status: 400 });
  }
}
