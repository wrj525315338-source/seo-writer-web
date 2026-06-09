import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { ImageProvider, Project, Provider } from "@/lib/types";
import { sanitizeError } from "@/lib/validators";

export type ModelRole = "writing" | "auditor";

interface RuntimeModelConfig {
  provider: Provider;
  modelName: string;
  baseUrl: string;
  temperature: number;
}

const providerApiKeyNames: Record<Provider, string> = {
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  deepseek: "DEEPSEEK_API_KEY",
  qwen: "QWEN_API_KEY",
  doubao: "DOUBAO_API_KEY",
  xiaomi: "XIAOMI_API_KEY",
  custom: "CUSTOM_API_KEY"
};

const imageProviderApiKeyNames: Record<ImageProvider, string[]> = {
  openai_image: ["OPENAI_API_KEY"],
  doubao: ["DOUBAO_IMAGE_API_KEY", "DOUBAO_API_KEY", "ARK_API_KEY"],
  volcengine_ark: ["DOUBAO_IMAGE_API_KEY", "DOUBAO_API_KEY", "ARK_API_KEY"],
  qwen: ["QWEN_IMAGE_API_KEY", "DASHSCOPE_API_KEY", "QWEN_API_KEY"],
  custom: ["CUSTOM_IMAGE_API_KEY", "CUSTOM_API_KEY"]
};

export function getSkillDir(): string {
  const configured = process.env.SEO_SKILL_DIR || "../skills/seo-article-writer";
  return path.isAbsolute(configured) ? configured : path.resolve(/* turbopackIgnore: true */ process.cwd(), configured);
}

export function resolvePythonPath(): string {
  if (process.env.PYTHON_PATH) {
    return process.env.PYTHON_PATH;
  }
  const bundled = path.join(
    os.homedir(),
    ".cache",
    "codex-runtimes",
    "codex-primary-runtime",
    "dependencies",
    "python",
    process.platform === "win32" ? "python.exe" : "bin/python"
  );
  return fs.existsSync(bundled) ? bundled : "python";
}

function apiEnvForProvider(provider: Provider): Record<string, string> {
  const keyName = providerApiKeyNames[provider];
  const apiKey = process.env[keyName] || "";
  if (!apiKey) {
    throw new Error(`当前选择的是 ${provider}，但 ${keyName} 未配置。`);
  }
  return { [keyName]: apiKey };
}

function removeUnusedProviderEnv(env: NodeJS.ProcessEnv, provider: Provider): void {
  const selectedKeyName = providerApiKeyNames[provider];
  for (const keyName of Object.keys(env)) {
    if (keyName.endsWith("_BASE_URL")) {
      delete env[keyName];
    }
    if (keyName.endsWith("_API_KEY") && keyName !== selectedKeyName) {
      delete env[keyName];
    }
  }
}

function defaultBaseUrlForProvider(provider: Provider): string {
  if (provider === "deepseek") {
    return process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1";
  }
  if (provider === "qwen") {
    return process.env.QWEN_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1";
  }
  if (provider === "doubao") {
    return process.env.DOUBAO_BASE_URL || "https://ark.cn-beijing.volces.com/api/v3";
  }
  if (provider === "xiaomi") {
    return process.env.XIAOMI_BASE_URL || "https://api.xiaomimimo.com/v1";
  }
  if (provider === "custom") {
    return process.env.CUSTOM_BASE_URL || "";
  }
  return "";
}

function normalizeModelName(provider: Provider, modelName: string): string {
  if (provider === "deepseek") {
    if (modelName === "deepseek-v4-Pro") {
      return "deepseek-v4-pro";
    }
    if (modelName === "deepseek-v4-Flash") {
      return "deepseek-v4-flash";
    }
  }
  return modelName;
}

function getRuntimeModelConfig(project: Project, role: ModelRole): RuntimeModelConfig {
  const writingConfig: RuntimeModelConfig = {
    provider: project.writing_provider || project.provider,
    modelName: project.writing_model_name || project.model_name,
    baseUrl: project.writing_base_url || project.base_url,
    temperature: Number(project.writing_temperature ?? project.temperature ?? 0.7)
  };

  if (role === "writing") {
    return writingConfig;
  }

  return {
    provider: project.auditor_provider || writingConfig.provider,
    modelName: project.auditor_model_name || writingConfig.modelName,
    baseUrl: project.auditor_base_url || writingConfig.baseUrl,
    temperature: Number(project.auditor_temperature ?? 0.2)
  };
}

export function buildModelEnv(project: Project, role: ModelRole = "writing"): NodeJS.ProcessEnv {
  const config = getRuntimeModelConfig(project, role);
  const baseUrl =
    config.provider === "custom"
      ? config.baseUrl || process.env.CUSTOM_BASE_URL || ""
      : config.baseUrl || defaultBaseUrlForProvider(config.provider);
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    ...apiEnvForProvider(config.provider),
    MODEL_PROVIDER: config.provider,
    MODEL_NAME: normalizeModelName(config.provider, config.modelName || process.env.DEFAULT_MODEL || ""),
    BASE_URL: baseUrl,
    TEMPERATURE: String(config.temperature),
    MODEL_API_TIMEOUT: process.env.MODEL_API_TIMEOUT || "300",
    MODEL_API_RETRIES: process.env.MODEL_API_RETRIES || "3",
    PYTHONIOENCODING: "utf-8"
  };
  delete env.MAX_TOKENS;
  removeUnusedProviderEnv(env, config.provider);
  return env;
}

export function buildImageEnv(project: Project): NodeJS.ProcessEnv {
  const provider = project.image_provider || "volcengine_ark";
  const keyNames = imageProviderApiKeyNames[provider] || [];
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    IMAGE_PROVIDER: provider,
    IMAGE_MODEL_DISPLAY_NAME: project.image_model_display_name || project.image_model_name || "",
    IMAGE_MODEL_NAME: project.image_model_name || "",
    IMAGE_MODEL_ID: project.image_model_id || "",
    IMAGE_ENDPOINT_ID: project.image_endpoint_id || "",
    IMAGE_USE_ENDPOINT_ID: project.image_use_endpoint_id ? "true" : "false",
    IMAGE_BASE_URL: project.image_base_url || "",
    IMAGE_TEMPERATURE: String(project.image_temperature ?? 0.2),
    PYTHONIOENCODING: "utf-8"
  };
  for (const keyName of keyNames) {
    if (process.env[keyName]) {
      env[keyName] = process.env[keyName];
    }
  }
  return env;
}

export async function runPythonScript(args: string[], options: {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  timeoutMs?: number;
} = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(resolvePythonPath(), args, {
      cwd: options.cwd || process.cwd(),
      env: options.env || process.env,
      shell: false,
      windowsHide: true
    });

    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error("Skill 调用超时，请检查模型响应或网络配置。"));
    }, options.timeoutMs || 180000);

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });
    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(new Error(sanitizeError(error)));
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(sanitizeError(stderr || stdout || `Skill 调用失败，退出码 ${code}`)));
      }
    });
  });
}

export async function runSkillPrompt(project: Project, args: string[], role: ModelRole = "writing"): Promise<string> {
  return runPythonScript(args, {
    cwd: getSkillDir(),
    env: buildModelEnv(project, role),
    timeoutMs: 600000
  });
}
