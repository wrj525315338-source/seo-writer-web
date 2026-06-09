export type PhaseId = "phase0" | "phase1" | "phase2" | "phase3" | "phase4" | "phase5";

export type PhaseStatus = "not_started" | "running" | "waiting_review" | "approved" | "failed";

export type ProjectStatus = "active" | "completed" | "failed";

export type Provider = "openai" | "anthropic" | "deepseek" | "qwen" | "doubao" | "xiaomi" | "custom";

export type ImageProvider = "openai_image" | "doubao" | "volcengine_ark" | "qwen" | "custom";

export interface ImageGenerationConfig {
  enabled: boolean;
  provider: ImageProvider;
  modelDisplayName: string;
  modelName: string;
  modelId: string;
  endpointId: string;
  useEndpointId: boolean;
  baseUrl: string;
  temperature: number;
  skillPath: string;
  outputFormat: string;
  defaultAspectRatio: string;
  retryCount: number;
  insertMode: string;
  defaultImageCount: number;
  allowNonCompliantImages: boolean;
}

export interface Project {
  id: string;
  name: string;
  article_title: string;
  topic: string;
  primary_keyword: string;
  secondary_keywords: string;
  article_focus: string;
  recommendation_reason: string;
  target_audience: string;
  search_intent: string;
  language: string;
  brand_name: string;
  writing_provider: Provider;
  writing_model_name: string;
  writing_base_url: string;
  writing_temperature: number;
  writing_max_tokens: number;
  auditor_provider: Provider;
  auditor_model_name: string;
  auditor_base_url: string;
  auditor_temperature: number;
  auditor_max_tokens: number;
  enable_image_generation: boolean;
  image_provider: ImageProvider;
  image_model_display_name: string;
  image_model_name: string;
  image_model_id: string;
  image_endpoint_id: string;
  image_use_endpoint_id: boolean;
  image_base_url: string;
  image_temperature: number;
  image_skill_path: string;
  image_output_format: string;
  image_aspect_ratio_default: string;
  image_retry_count: number;
  image_insert_mode: string;
  image_count_default: number;
  image_allow_non_compliant_images: boolean;
  /** Legacy alias for writing_provider. */
  provider: Provider;
  /** Legacy alias for writing_model_name. */
  model_name: string;
  /** Legacy alias for writing_base_url. */
  base_url: string;
  /** Legacy alias for writing_temperature. */
  temperature: number;
  /** Legacy alias for writing_max_tokens. */
  max_tokens: number;
  current_phase: PhaseId;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface PhaseRun {
  id: number;
  project_id: string;
  phase: PhaseId;
  status: PhaseStatus;
  input_prompt: string;
  output_file_path: string;
  error_message: string;
  created_at: string;
  updated_at: string;
}

export interface ReviewComment {
  id: number;
  project_id: string;
  phase: PhaseId;
  comment: string;
  response_file_path: string;
  created_at: string;
}

export interface PhaseState {
  status: PhaseStatus;
  outputFile?: string;
  outputFiles?: string[];
  approved: boolean;
  errorMessage?: string;
}

export interface ProjectState {
  projectId: string;
  projectName: string;
  currentPhase: PhaseId;
  modelConfig: {
    writingModel: {
      provider: Provider;
      modelName: string;
      baseUrl: string;
      temperature: number;
    };
    auditorModel: {
      provider: Provider;
      modelName: string;
      baseUrl: string;
      temperature: number;
    };
    imageGeneration: ImageGenerationConfig;
  };
  inputs: {
    writingGuidelineFile: string;
    exampleArticleFiles: string[];
    topicRequirementFile: string;
    articleBrief: {
      topic: string;
      primaryKeyword: string;
      secondaryKeywords: string[];
      articleFocus: string;
      recommendationReason: string;
      targetAudience: string;
      searchIntent: string;
      imageRequirements: string;
      extraNotes: string;
    };
  };
  phases: Record<PhaseId, PhaseState>;
}

export interface ProjectFormData {
  projectName: string;
  language: string;
  brandName: string;
  writingProvider: Provider;
  writingModelName: string;
  writingBaseUrl: string;
  writingTemperature: number;
  auditorProvider: Provider;
  auditorModelName: string;
  auditorBaseUrl: string;
  auditorTemperature: number;
  enableImageGeneration: boolean;
  imageProvider: ImageProvider;
  imageModelDisplayName: string;
  imageModelName: string;
  imageModelId: string;
  imageEndpointId: string;
  imageUseEndpointId: boolean;
  imageBaseUrl: string;
  imageTemperature: number;
  imageSkillPath: string;
  imageOutputFormat: string;
  imageAspectRatioDefault: string;
  imageRetryCount: number;
  imageInsertMode: string;
  imageCountDefault: number;
  imageAllowNonCompliantImages: boolean;
  topic: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  articleFocus: string;
  recommendationReason: string;
  imageRequirements: string;
  extraNotes: string;
}
