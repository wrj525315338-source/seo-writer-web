"use client";

import { FormEvent, useRef, useState } from "react";
import ModelConfigForm from "@/components/ModelConfigForm";
import FileUpload from "@/components/FileUpload";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import DataTable from "@/components/ui/DataTable";
import WarningCard from "@/components/ui/WarningCard";
import FormSection from "@/components/ui/FormSection";
import FormField from "@/components/ui/FormField";
import type { ParsedCluster } from "@/lib/types";

type Step = "upload" | "preview" | "creating";

interface ModelConfig {
  writingProvider: string;
  writingModelName: string;
  writingBaseUrl: string;
  writingTemperature: number;
  auditorProvider: string;
  auditorModelName: string;
  auditorBaseUrl: string;
  auditorTemperature: number;
  imagePlanningMode: "auto" | "placeholder_only" | "full_planning";
}

interface ClusterFormProps {
  sharedFiles: {
    hasWritingGuideline: boolean;
    hasExampleArticles: boolean;
    writingGuidelineFiles: string[];
    exampleArticleFiles: string[];
  };
}

function extractModelConfig(form: HTMLFormElement): ModelConfig {
  const fd = new FormData(form);
  const wp = String(fd.get("writingProvider") || "openai");
  const wm = String(fd.get("writingModelName") || "");
  const wb = String(fd.get("writingBaseUrl") || "");
  const wt = Number(fd.get("writingTemperature") || 0.7);
  const ap = String(fd.get("auditorProvider") || wp);
  const am = String(fd.get("auditorModelName") || wm);
  const ab = String(fd.get("auditorBaseUrl") || wb);
  const at = Number(fd.get("auditorTemperature") || 0.2);
  const ipm = String(fd.get("imagePlanningMode") || "auto");
  return {
    writingProvider: wp, writingModelName: wm, writingBaseUrl: wb, writingTemperature: wt,
    auditorProvider: ap, auditorModelName: am, auditorBaseUrl: ab, auditorTemperature: at,
    imagePlanningMode: ipm as "auto" | "placeholder_only" | "full_planning",
  };
}

const articleColumns = [
  { key: "index", header: "#", width: "48px" },
  { key: "role", header: "角色" },
  { key: "title", header: "标题" },
  { key: "primaryKeyword", header: "主关键词" },
  { key: "articleType", header: "类型" },
  { key: "wordCount", header: "字数" },
];

const crossLinkColumns = [
  { key: "sourceSlug", header: "来源" },
  { key: "targetSlug", header: "目标" },
  { key: "anchorText", header: "锚文本" },
  { key: "placementHint", header: "位置" },
  { key: "direction", header: "方向" },
];

export default function ClusterForm({ sharedFiles }: ClusterFormProps) {
  const [step, setStep] = useState<Step>("upload");
  const [parsed, setParsed] = useState<ParsedCluster | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [originalFileName, setOriginalFileName] = useState("");
  const [briefContent, setBriefContent] = useState("");
  const [modelConfig, setModelConfig] = useState<ModelConfig | null>(null);
  const [sessionId, setSessionId] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  async function handleParse(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const briefFile = formData.get("briefFile") as File;

    if (!briefFile || briefFile.size === 0) {
      setError("请上传 brief 文件。");
      setLoading(false);
      return;
    }

    const ext = briefFile.name.split(".").pop()?.toLowerCase() || "";
    const isBinary = ["docx", "doc", "xlsx", "xlsm"].includes(ext);
    if (!isBinary) {
      const content = await briefFile.text();
      setBriefContent(content);
    }
    setOriginalFileName(briefFile.name);

    if (formRef.current) {
      setModelConfig(extractModelConfig(formRef.current));
    }

    try {
      const response = await fetch("/api/clusters/parse", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "解析失败");
        setLoading(false);
        return;
      }

      setParsed(data.parsed);
      if (data.briefContent) {
        setBriefContent(data.briefContent);
      }
      if (data.sessionId) {
        setSessionId(data.sessionId);
      }
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "网络错误");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!parsed || !modelConfig) return;
    setError("");
    setLoading(true);
    setStep("creating");

    try {
      const response = await fetch("/api/clusters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clusterName: parsed.clusterName,
          brandName: parsed.brandName,
          language: parsed.language,
          blogBaseUrl: "https://www.hellotalk.com/en/blog",
          articles: parsed.articles,
          crossLinkRules: parsed.crossLinkRules,
          specialRequirements: parsed.specialRequirements,
          briefContent,
          sessionId,
          ...modelConfig,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "创建失败");
        setStep("preview");
        setLoading(false);
        return;
      }

      window.location.href = `/clusters/${data.clusterId}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "网络错误");
      setStep("preview");
      setLoading(false);
    }
  }

  const articleData = parsed
    ? parsed.articles.map((article, i) => ({
        index: String(i + 1),
        role: article.role,
        title: article.title,
        primaryKeyword: article.primaryKeyword,
        articleType: article.articleType,
        wordCount: `${article.targetWordCount.min}-${article.targetWordCount.max}`,
      }))
    : [];

  const crossLinkData = parsed
    ? parsed.crossLinkRules.map((rule) => ({
        ...rule,
        direction: rule.direction === "bidirectional" ? "双向" : "单向",
      }))
    : [];

  return (
    <div>
      {step === "upload" && (
        <form ref={formRef} onSubmit={handleParse}>
          <FormSection
            title="集群 Brief"
            description="上传包含多篇文章规划的 brief 文件（.md / .xlsx / .docx / .txt）。系统会自动解析出文章列表、关键词和互链规则。"
          >
            <FormField label="Brief 文件" htmlFor="briefFile" full>
              <input
                id="briefFile"
                name="briefFile"
                type="file"
                accept=".md,.markdown,.xlsx,.xlsm,.docx,.doc,.txt"
                required
              />
            </FormField>
          </FormSection>

          <FormSection title="长期参考文件（可复用已有）">
            <FileUpload
              name="writingGuidelineFile"
              label="写作规范"
              required={!sharedFiles.hasWritingGuideline}
              accept=".docx,.pdf,.md,.txt"
              currentFiles={sharedFiles.hasWritingGuideline ? sharedFiles.writingGuidelineFiles : undefined}
              help={sharedFiles.hasWritingGuideline ? "上传新文件将替换当前规范。" : "首次必须上传。"}
            />
            <FileUpload
              name="exampleArticleFiles"
              label="示例文章（可选，可多选）"
              multiple
              accept=".docx,.pdf,.md,.txt"
              currentFiles={sharedFiles.hasExampleArticles ? sharedFiles.exampleArticleFiles : undefined}
              help={sharedFiles.hasExampleArticles ? "上传新文件将替换当前示例。" : "可先上传一次，后续自动复用。"}
            />
          </FormSection>

          <ModelConfigForm />

          {error && <p className="error">{error}</p>}

          <div className="form-actions">
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? "解析中..." : "解析 Brief →"}
            </Button>
          </div>
        </form>
      )}

      {step === "preview" && parsed && (
        <div>
          <Card title="Brief 解析结果 — 请确认">
            <p className="help">来源文件：{originalFileName}</p>
          </Card>

          <Card title="集群信息">
            <table>
              <tbody>
                <tr><td><strong>集群名称</strong></td><td>{parsed.clusterName}</td></tr>
                <tr><td><strong>品牌</strong></td><td>{parsed.brandName}</td></tr>
                <tr><td><strong>语言</strong></td><td>{parsed.language}</td></tr>
              </tbody>
            </table>
          </Card>

          <Card title={`识别到 ${parsed.articles.length} 篇文章`}>
            <DataTable columns={articleColumns} data={articleData} />
          </Card>

          <Card title={`识别到 ${parsed.crossLinkRules.length} 条互链规则`}>
            <DataTable columns={crossLinkColumns} data={crossLinkData} />
          </Card>

          {parsed.specialRequirements.bannedCompetitors.length > 0 && (
            <Card title="竞品禁令">
              <ul>
                {parsed.specialRequirements.bannedCompetitors.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </Card>
          )}

          {parsed.specialRequirements.collisionWarnings.length > 0 && (
            <WarningCard title="已上线文章冲突警告">
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {parsed.specialRequirements.collisionWarnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </WarningCard>
          )}

          {parsed.specialRequirements.brandData.length > 0 && (
            <Card title="品牌数据">
              <ul>
                {parsed.specialRequirements.brandData.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </Card>
          )}

          {parsed.specialRequirements.requiredModules.length > 0 && (
            <Card title="必须描述的功能模块">
              <ul>
                {parsed.specialRequirements.requiredModules.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </Card>
          )}

          {error && <p className="error">{error}</p>}

          <div className="form-actions">
            <Button type="button" onClick={() => { setStep("upload"); setParsed(null); }}>
              ← 返回修改
            </Button>
            <Button variant="primary" type="button" onClick={handleCreate} disabled={loading}>
              确认创建集群项目 →
            </Button>
          </div>
        </div>
      )}

      {step === "creating" && (
        <Card title="正在创建集群项目...">
          <p>正在为 {parsed?.articles.length} 篇文章创建项目和目录结构，请稍候。</p>
        </Card>
      )}
    </div>
  );
}
