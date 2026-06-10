import { NextResponse } from "next/server";
import {
  approveGeneratedImage,
  approveGeneratedImagesAndCreateFinal,
  approvePhase,
  changeAuditorModelAndRetry,
  changeImageModelAndRetry,
  regenerateGeneratedImage,
  retryImageGeneration,
  revisePhase,
  runPhase,
  runPhase4Chunked,
  setImageGenerationEnabled,
  startImageGeneration
} from "@/lib/phaseRunner";
import { PhaseId } from "@/lib/types";
import { decodeProjectId } from "@/lib/routeParams";
import { asImageProvider, asProvider, optionalText, phases, resolveImageModelSelection, sanitizeError } from "@/lib/validators";

export const runtime = "nodejs";

function parsePhase(value: unknown): PhaseId {
  if (typeof value === "string" && phases.includes(value as PhaseId)) {
    return value as PhaseId;
  }
  throw new Error("无效的 Phase。");
}

export async function POST(request: Request, context: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId: routeProjectId } = await context.params;
    const projectId = decodeProjectId(routeProjectId);
    const body = await request.json();
    const phase = parsePhase(body.phase);
    const action = String(body.action || "");

    if (action === "run") {
      await runPhase(projectId, phase);
    } else if (action === "changeAuditorModelAndRetry") {
      if (phase !== "phase4") {
        throw new Error("只有 Phase 4 可以更换审查模型后重试。");
      }
      await changeAuditorModelAndRetry(projectId, {
        provider: asProvider(body.auditorProvider),
        modelName: optionalText(body.auditorModelName),
        baseUrl: optionalText(body.auditorBaseUrl),
        temperature: Number(optionalText(body.auditorTemperature) || 0.2)
      });
    } else if (action === "runPhase4Chunked") {
      await runPhase4Chunked(projectId);
    } else if (action === "revise") {
      const comment = String(body.comment || "").trim();
      if (!comment) {
        throw new Error("修改意见不能为空。");
      }
      await revisePhase(projectId, phase, comment);
    } else if (action === "approve") {
      await approvePhase(projectId, phase);
    } else if (action === "approveGeneratedImage") {
      if (phase !== "phase5") {
        throw new Error("图片审核只能在 Phase 5 之后进行。");
      }
      await approveGeneratedImage(projectId, optionalText(body.imageId));
    } else if (action === "regenerateGeneratedImage") {
      if (phase !== "phase5") {
        throw new Error("图片重生成只能在 Phase 5 之后进行。");
      }
      await regenerateGeneratedImage(projectId, optionalText(body.imageId), optionalText(body.reviewComment));
    } else if (action === "approveGeneratedImagesAndCreateFinal") {
      if (phase !== "phase5") {
        throw new Error("生成带图最终文件只能在 Phase 5 之后进行。");
      }
      await approveGeneratedImagesAndCreateFinal(projectId);
    } else if (action === "retryImageGeneration") {
      await retryImageGeneration(projectId);
    } else if (action === "setImageGenerationEnabled") {
      setImageGenerationEnabled(projectId, Boolean(body.enabled));
    } else if (action === "startImageGeneration") {
      await startImageGeneration(projectId);
    } else if (action === "changeImageModelAndRetry") {
      const imageProvider = asImageProvider(body.imageProvider);
      const { imageModelDisplayName, imageModelId } = resolveImageModelSelection(
        imageProvider,
        body.imageModelDisplayName ?? body.imageModelName,
        body.imageModelId
      );
      await changeImageModelAndRetry(projectId, {
        provider: imageProvider,
        modelDisplayName: imageModelDisplayName,
        modelId: imageModelId,
        endpointId: optionalText(body.imageEndpointId),
        useEndpointId: Boolean(body.imageUseEndpointId)
      });
    } else {
      throw new Error("无效的阶段操作。");
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: sanitizeError(error) }, { status: 400 });
  }
}
