import { ImageProvider, PhaseId, PhaseState, ProjectState, Provider } from "@/lib/types";
import { volcengineArkImageModelIds } from "@/lib/imageModelCatalog";

export const phases: PhaseId[] = ["phase0", "phase1", "phase2", "phase3", "phase4", "phase5"];

export const manualReviewPhases: PhaseId[] = ["phase1", "phase5"];
export const autoApprovedPhases: PhaseId[] = ["phase0", "phase2", "phase3", "phase4"];

export const phaseLabels: Record<PhaseId, string> = {
  phase0: "读取材料与规范提取",
  phase1: "生成文章大纲",
  phase2: "撰写前两个 H2",
  phase3: "完成全文",
  phase4: "Checklist 查验",
  phase5: "生成最终文件"
};

export const phaseOutputs: Record<PhaseId, string[]> = {
  phase0: ["00_material_reading_summary.md", "00_writing_checklist.md"],
  phase1: ["01_outline.md"],
  phase2: ["02_first_two_sections.md"],
  phase3: ["03_full_article.md"],
  phase4: ["04_checklist_report.md"],
  phase5: ["final_article_for_google_docs.docx"]
};

export const publicOutputFiles = [
  phaseOutputs.phase1[0],
  phaseOutputs.phase5[0],
  "image_style_reference_examples.md",
  "image_plan.json",
  "image_planning.log",
  "final_article_with_image_slots.md",
  "final_article_with_images.docx",
  "image_metadata.json",
  "image_compliance_report.json",
  "phase6.log"
];

export function requiresManualReview(phase: PhaseId): boolean {
  return manualReviewPhases.includes(phase);
}

export const providers: Provider[] = ["openai", "anthropic", "deepseek", "qwen", "doubao", "xiaomi", "custom"];
export const imageProviders: ImageProvider[] = ["openai_image", "doubao", "volcengine_ark", "qwen", "custom"];

export function isVolcengineArkImageProvider(provider: ImageProvider): boolean {
  return provider === "volcengine_ark" || provider === "doubao";
}

export function asProvider(value: FormDataEntryValue | null): Provider {
  const provider = String(value || "openai");
  return providers.includes(provider as Provider) ? (provider as Provider) : "openai";
}

export function asImageProvider(value: FormDataEntryValue | null): ImageProvider {
  const provider = String(value || "volcengine_ark");
  return imageProviders.includes(provider as ImageProvider) ? (provider as ImageProvider) : "volcengine_ark";
}

export function resolveImageModelSelection(
  provider: ImageProvider,
  displayNameValue: FormDataEntryValue | null,
  modelIdValue: FormDataEntryValue | null
): { imageModelDisplayName: string; imageModelId: string } {
  const imageModelDisplayName = optionalText(displayNameValue);
  const submittedModelId = optionalText(modelIdValue);

  if (!isVolcengineArkImageProvider(provider)) {
    const modelId = submittedModelId || imageModelDisplayName;
    return {
      imageModelDisplayName: imageModelDisplayName || modelId,
      imageModelId: modelId
    };
  }

  const mappedModelId = volcengineArkImageModelIds[imageModelDisplayName] || "";
  if (mappedModelId) {
    return {
      imageModelDisplayName,
      imageModelId: mappedModelId
    };
  }

  const displayNameFromModelId =
    Object.entries(volcengineArkImageModelIds).find(([, modelId]) => modelId === submittedModelId)?.[0] || "";
  return {
    imageModelDisplayName: imageModelDisplayName || displayNameFromModelId,
    imageModelId: submittedModelId
  };
}

export function slugifyName(name: string): string {
  const cleaned = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || "seo-project";
}

export function parseSecondaryKeywords(value: string): string[] {
  return value
    .split(/[,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function requireText(value: FormDataEntryValue | null, label: string): string {
  const text = String(value || "").trim();
  if (!text) {
    throw new Error(`${label}不能为空`);
  }
  return text;
}

export function optionalText(value: FormDataEntryValue | null): string {
  return String(value || "").trim();
}

export function requireFile(value: FormDataEntryValue | null, label: string): File {
  if (!value || typeof value === "string" || value.size === 0) {
    throw new Error(`请上传${label}`);
  }
  return value;
}

export function sanitizeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message
    .replace(/[A-Z]:\\[^"'`\n\r]+/g, "[local path]")
    .replace(
      /(OPENAI_API_KEY|ANTHROPIC_API_KEY|DEEPSEEK_API_KEY|QWEN_API_KEY|DOUBAO_API_KEY|XIAOMI_API_KEY|CUSTOM_API_KEY|DOUBAO_IMAGE_API_KEY|ARK_API_KEY|QWEN_IMAGE_API_KEY|DASHSCOPE_API_KEY|CUSTOM_IMAGE_API_KEY)=\S+/g,
      "$1=[hidden]"
    );
}

export function getNextPhase(phase: PhaseId): PhaseId {
  const index = phases.indexOf(phase);
  return phases[Math.min(index + 1, phases.length - 1)];
}

export function assertPhaseCanRun(state: ProjectState, phase: PhaseId): void {
  if (phase === "phase1" && !isComplete(state.phases.phase0)) {
    throw new Error("Phase 0 尚未完成，不能运行 Phase 1。");
  }
  if (phase === "phase2" && !state.phases.phase1.approved) {
    throw new Error("Phase 1 大纲未确认，不能进入 Phase 2。");
  }
  if (phase === "phase3" && !state.phases.phase2.approved) {
    throw new Error("Phase 2 前两个 H2 尚未完成，不能进入 Phase 3。");
  }
  if (phase === "phase4" && !isComplete(state.phases.phase3)) {
    throw new Error("Phase 3 全文尚未完成，不能运行 Phase 4。");
  }
  if (phase === "phase5" && !state.phases.phase4.approved) {
    throw new Error("Phase 4 checklist 尚未完成，不能生成最终文件。");
  }
}

export function assertPhaseCanApprove(state: ProjectState, phase: PhaseId): void {
  if (!requiresManualReview(phase)) {
    throw new Error("该阶段运行完成后会自动通过，无需人工确认。");
  }
  if (!isComplete(state.phases[phase])) {
    throw new Error("该阶段还没有可确认的输出。");
  }
}

export function isComplete(phase: PhaseState): boolean {
  return phase.status === "waiting_review" || phase.status === "approved";
}
