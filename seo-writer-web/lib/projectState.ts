import fs from "node:fs";
import { getProjectStatePath, ensureProjectDirs } from "@/lib/fileStorage";
import { PhaseId, PhaseStatus, Project, ProjectState, Provider } from "@/lib/types";
import { autoApprovedPhases, getNextPhase, phaseOutputs, resolveImageModelSelection } from "@/lib/validators";

export function createInitialProjectState(project: Project, inputPaths: {
  writingGuidelineFile: string;
  exampleArticleFiles: string[];
  topicRequirementFile: string;
  imageRequirements: string;
  extraNotes: string;
}): ProjectState {
  return {
    projectId: project.id,
    projectName: project.name,
    currentPhase: "phase0",
    modelConfig: {
      writingModel: {
        provider: project.writing_provider,
        modelName: project.writing_model_name,
        baseUrl: project.writing_base_url,
        temperature: project.writing_temperature
      },
      auditorModel: {
        provider: project.auditor_provider,
        modelName: project.auditor_model_name,
        baseUrl: project.auditor_base_url,
        temperature: project.auditor_temperature
      },
      imageGeneration: {
        enabled: Boolean(project.enable_image_generation),
        provider: project.image_provider,
        modelDisplayName: project.image_model_display_name || project.image_model_name,
        modelName: project.image_model_display_name || project.image_model_name,
        modelId: project.image_model_id,
        endpointId: project.image_endpoint_id,
        useEndpointId: Boolean(project.image_use_endpoint_id),
        baseUrl: project.image_base_url,
        temperature: project.image_temperature,
        skillPath: project.image_skill_path,
        outputFormat: project.image_output_format,
        defaultAspectRatio: project.image_aspect_ratio_default,
        retryCount: project.image_retry_count,
        insertMode: project.image_insert_mode,
        defaultImageCount: project.image_count_default,
        allowNonCompliantImages: Boolean(project.image_allow_non_compliant_images)
      }
    },
    inputs: {
      writingGuidelineFile: inputPaths.writingGuidelineFile,
      exampleArticleFiles: inputPaths.exampleArticleFiles,
      topicRequirementFile: inputPaths.topicRequirementFile,
      articleBrief: {
        topic: project.topic,
        primaryKeyword: project.primary_keyword,
        secondaryKeywords: project.secondary_keywords.split(",").map((item) => item.trim()).filter(Boolean),
        articleFocus: project.article_focus,
        recommendationReason: project.recommendation_reason,
        targetAudience: project.target_audience,
        searchIntent: project.search_intent,
        imageRequirements: inputPaths.imageRequirements,
        extraNotes: inputPaths.extraNotes
      }
    },
    phases: {
      phase0: { status: "not_started", outputFile: phaseOutputs.phase0[0], approved: false },
      phase1: { status: "not_started", outputFile: phaseOutputs.phase1[0], approved: false },
      phase2: { status: "not_started", outputFile: phaseOutputs.phase2[0], approved: false },
      phase3: { status: "not_started", outputFile: phaseOutputs.phase3[0], approved: false },
      phase4: { status: "not_started", outputFile: phaseOutputs.phase4[0], approved: false },
      phase5: { status: "not_started", outputFiles: phaseOutputs.phase5, approved: false }
    }
  };
}

export function writeProjectState(state: ProjectState): void {
  ensureProjectDirs(state.projectId);
  fs.writeFileSync(getProjectStatePath(state.projectId), JSON.stringify(state, null, 2), "utf-8");
}

export function readProjectState(projectId: string): ProjectState {
  const state = JSON.parse(fs.readFileSync(getProjectStatePath(projectId), "utf-8")) as ProjectState;
  let changed = false;
  if (!state.modelConfig.imageGeneration) {
    state.modelConfig.imageGeneration = {
      enabled: true,
      provider: "volcengine_ark",
      modelDisplayName: "",
      modelName: "",
      modelId: "",
      endpointId: "",
      useEndpointId: false,
      baseUrl: "",
      temperature: 0.2,
      skillPath: "../skills/hellotalk-blog-image-planner-v2.skill",
      outputFormat: "png",
      defaultAspectRatio: "16:9",
      retryCount: 2,
      insertMode: "placeholder",
      defaultImageCount: 3,
      allowNonCompliantImages: false
    };
    changed = true;
  }
  const imageGeneration = state.modelConfig.imageGeneration;
  if (imageGeneration.provider === undefined) {
    imageGeneration.provider = "volcengine_ark";
    changed = true;
  }
  if (imageGeneration.modelDisplayName === undefined) {
    imageGeneration.modelDisplayName = imageGeneration.modelName || "";
    changed = true;
  }
  if (imageGeneration.modelName === undefined) {
    imageGeneration.modelName = imageGeneration.modelDisplayName || "";
    changed = true;
  }
  if (imageGeneration.modelId === undefined) {
    imageGeneration.modelId = "";
    changed = true;
  }
  const resolvedImageModel = resolveImageModelSelection(
    imageGeneration.provider,
    imageGeneration.modelDisplayName || imageGeneration.modelName,
    imageGeneration.modelId
  );
  if (resolvedImageModel.imageModelDisplayName && imageGeneration.modelDisplayName !== resolvedImageModel.imageModelDisplayName) {
    imageGeneration.modelDisplayName = resolvedImageModel.imageModelDisplayName;
    changed = true;
  }
  if (resolvedImageModel.imageModelDisplayName && imageGeneration.modelName !== resolvedImageModel.imageModelDisplayName) {
    imageGeneration.modelName = resolvedImageModel.imageModelDisplayName;
    changed = true;
  }
  if (resolvedImageModel.imageModelId && imageGeneration.modelId !== resolvedImageModel.imageModelId) {
    imageGeneration.modelId = resolvedImageModel.imageModelId;
    changed = true;
  }
  if (imageGeneration.endpointId === undefined) {
    imageGeneration.endpointId = "";
    changed = true;
  }
  if (imageGeneration.useEndpointId === undefined) {
    imageGeneration.useEndpointId = false;
    changed = true;
  }
  if (imageGeneration.allowNonCompliantImages === undefined) {
    imageGeneration.allowNonCompliantImages = false;
    changed = true;
  }
  for (const phase of autoApprovedPhases) {
    const phaseState = state.phases[phase];
    if (phaseState.status === "waiting_review") {
      phaseState.status = "approved";
      phaseState.approved = true;
      phaseState.errorMessage = undefined;
      changed = true;
    }
  }
  if (autoApprovedPhases.includes(state.currentPhase) && state.phases[state.currentPhase].approved) {
    state.currentPhase = getNextPhase(state.currentPhase);
    changed = true;
  }
  if (changed) {
    writeProjectState(state);
  }
  return state;
}

export function setPhaseStatus(projectId: string, phase: PhaseId, status: PhaseStatus, errorMessage = ""): ProjectState {
  const state = readProjectState(projectId);
  state.phases[phase].status = status;
  state.phases[phase].errorMessage = errorMessage || undefined;
  if (status !== "approved") {
    state.phases[phase].approved = false;
  }
  if (status === "waiting_review") {
    state.currentPhase = phase;
  }
  writeProjectState(state);
  return state;
}

export function approvePhaseInState(projectId: string, phase: PhaseId): ProjectState {
  const state = readProjectState(projectId);
  state.phases[phase].status = "approved";
  state.phases[phase].approved = true;
  state.phases[phase].errorMessage = undefined;
  state.currentPhase = getNextPhase(phase);
  writeProjectState(state);
  return state;
}

export function updateAuditorModelInState(projectId: string, config: {
  provider: Provider;
  modelName: string;
  baseUrl: string;
  temperature: number;
}): ProjectState {
  const state = readProjectState(projectId);
  state.modelConfig.auditorModel = {
    provider: config.provider,
    modelName: config.modelName,
    baseUrl: config.baseUrl,
    temperature: config.temperature
  };
  writeProjectState(state);
  return state;
}

export function rewindToPhase4AfterPhase5Revision(projectId: string): ProjectState {
  const state = readProjectState(projectId);
  state.currentPhase = "phase4";
  for (const phase of ["phase4", "phase5"] as PhaseId[]) {
    state.phases[phase].status = "not_started";
    state.phases[phase].approved = false;
    state.phases[phase].errorMessage = undefined;
  }
  writeProjectState(state);
  return state;
}
