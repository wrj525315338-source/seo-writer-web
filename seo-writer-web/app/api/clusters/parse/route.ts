import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { parseClusterBrief } from "@/lib/clusterParser";
import { safeFileName } from "@/lib/fileStorage";
import { replaceSharedUploads, getSharedWritingGuidelineFiles, getSharedExampleArticleFiles } from "@/lib/sharedFiles";
import { sanitizeError } from "@/lib/validators";

export const runtime = "nodejs";

function isUploadedFile(value: FormDataEntryValue | null): value is File {
  return Boolean(value && typeof value !== "string" && value.size > 0);
}

function uploadedFiles(values: FormDataEntryValue[]): File[] {
  return values.filter((value): value is File => typeof value !== "string" && value.size > 0);
}

/**
 * POST /api/clusters/parse
 * Accepts a brief file (md/xlsx/docx/txt) and optionally writing guidelines + examples.
 * Saves guideline/example uploads to shared storage for later reuse.
 * Returns parsed cluster structure for preview before creation.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const briefFile = formData.get("briefFile");

    if (!briefFile || typeof briefFile === "string" || briefFile.size === 0) {
      return NextResponse.json({ error: "请上传 brief 文件。" }, { status: 400 });
    }

    // Save uploaded writing guidelines to shared storage
    const uploadedGuideline = formData.get("writingGuidelineFile");
    if (isUploadedFile(uploadedGuideline)) {
      await replaceSharedUploads("writing-guidelines", [uploadedGuideline], "guideline_");
    }

    // Save uploaded example articles to shared storage
    const uploadedExamples = uploadedFiles(formData.getAll("exampleArticleFiles"));
    if (uploadedExamples.length > 0) {
      await replaceSharedUploads("examples", uploadedExamples, "example_");
    }

    // Check that writing guidelines exist (either just uploaded or previously shared)
    const guidelines = getSharedWritingGuidelineFiles();
    if (guidelines.length === 0) {
      return NextResponse.json(
        { error: "请上传写作规范。上传一次后，后续项目会自动复用。" },
        { status: 400 }
      );
    }

    // Save the brief file to a temp location for parsing
    const tempDir = path.join(process.cwd(), "storage", "temp");
    fs.mkdirSync(tempDir, { recursive: true });
    const tempFileName = safeFileName(`brief_${Date.now()}_${briefFile.name}`);
    const tempFilePath = path.join(tempDir, tempFileName);
    fs.writeFileSync(tempFilePath, Buffer.from(await briefFile.arrayBuffer()));

    try {
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
        // Binary formats may fail local parsing - return empty articles with warning
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

      const needsLlm = isBinary && parsed.articles.length === 0;

      return NextResponse.json({
        parsed,
        briefContent,
        originalFileName: briefFile.name,
        needsLlm,
        warning: needsLlm ? "二进制格式需要 LLM 解析文章列表。请改用 .md 格式，或在创建后手动配置文章。" : undefined,
      });
    } finally {
      // Clean up temp file after parsing
      try {
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        const extractedPath = tempFilePath + ".extracted.md";
        if (fs.existsSync(extractedPath)) fs.unlinkSync(extractedPath);
      } catch {
        // cleanup failure is non-fatal
      }
    }
  } catch (error) {
    return NextResponse.json({ error: sanitizeError(error) }, { status: 400 });
  }
}
