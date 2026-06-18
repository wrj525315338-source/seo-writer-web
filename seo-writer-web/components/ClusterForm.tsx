"use client";

import { FormEvent, useRef, useState } from "react";
import ModelConfigForm from "@/components/ModelConfigForm";
import FileUpload from "@/components/FileUpload";
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
  imagePlanningMode: "placeholder_only" | "full_planning";
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
  const ipm = String(fd.get("imagePlanningMode") || "full_planning");
  return {
    writingProvider: wp, writingModelName: wm, writingBaseUrl: wb, writingTemperature: wt,
    auditorProvider: ap, auditorModelName: am, auditorBaseUrl: ab, auditorTemperature: at,
    imagePlanningMode: ipm as "placeholder_only" | "full_planning",
  };
}

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

    // Read file content for later use (only for text formats)
    const ext = briefFile.name.split(".").pop()?.toLowerCase() || "";
    const isBinary = ["docx", "doc", "xlsx", "xlsm"].includes(ext);
    if (!isBinary) {
      const content = await briefFile.text();
      setBriefContent(content);
    }
    setOriginalFileName(briefFile.name);

    // Save model config before the form gets unmounted
    // Use formRef.current instead of e.currentTarget (which may be stale after await)
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
      // Use server-extracted brief content (handles binary formats correctly)
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

      // Redirect to cluster detail page
      window.location.href = `/clusters/${data.clusterId}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "网络错误");
      setStep("preview");
      setLoading(false);
    }
  }

  return (
    <div>
      {step === "upload" && (
        <form ref={formRef} onSubmit={handleParse}>
          <div className="form-section">
            <h2>集群 Brief</h2>
            <p className="help">
              上传包含多篇文章规划的 brief 文件（.md / .xlsx / .docx / .txt）。系统会自动解析出文章列表、关键词和互链规则。
            </p>
            <div className="field">
              <label htmlFor="briefFile">Brief 文件</label>
              <input
                id="briefFile"
                name="briefFile"
                type="file"
                accept=".md,.markdown,.xlsx,.xlsm,.docx,.doc,.txt"
                required
              />
            </div>
          </div>

          <div className="form-section">
            <h2>长期参考文件（可复用已有）</h2>
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
          </div>

          <ModelConfigForm />

          {error && <p className="error">{error}</p>}

          <div className="form-actions">
            <button type="submit" className="btn primary" disabled={loading}>
              {loading ? "解析中..." : "解析 Brief →"}
            </button>
          </div>
        </form>
      )}

      {step === "preview" && parsed && (
        <div>
          <div className="form-section">
            <h2>Brief 解析结果 — 请确认</h2>
            <p className="help">来源文件：{originalFileName}</p>
          </div>

          <div className="form-section">
            <h3>集群信息</h3>
            <table>
              <tbody>
                <tr><td><strong>集群名称</strong></td><td>{parsed.clusterName}</td></tr>
                <tr><td><strong>品牌</strong></td><td>{parsed.brandName}</td></tr>
                <tr><td><strong>语言</strong></td><td>{parsed.language}</td></tr>
              </tbody>
            </table>
          </div>

          <div className="form-section">
            <h3>识别到 {parsed.articles.length} 篇文章</h3>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>角色</th>
                  <th>标题</th>
                  <th>主关键词</th>
                  <th>类型</th>
                  <th>字数</th>
                </tr>
              </thead>
              <tbody>
                {parsed.articles.map((article, i) => (
                  <tr key={article.slug}>
                    <td>{i + 1}</td>
                    <td>{article.role}</td>
                    <td>{article.title}</td>
                    <td>{article.primaryKeyword}</td>
                    <td>{article.articleType}</td>
                    <td>{article.targetWordCount.min}-{article.targetWordCount.max}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="form-section">
            <h3>识别到 {parsed.crossLinkRules.length} 条互链规则</h3>
            <table>
              <thead>
                <tr>
                  <th>来源</th>
                  <th>目标</th>
                  <th>锚文本</th>
                  <th>位置</th>
                  <th>方向</th>
                </tr>
              </thead>
              <tbody>
                {parsed.crossLinkRules.map((rule, i) => (
                  <tr key={i}>
                    <td>{rule.sourceSlug}</td>
                    <td>{rule.targetSlug}</td>
                    <td>{rule.anchorText}</td>
                    <td>{rule.placementHint}</td>
                    <td>{rule.direction === "bidirectional" ? "双向" : "单向"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {parsed.specialRequirements.bannedCompetitors.length > 0 && (
            <div className="form-section">
              <h3>竞品禁令</h3>
              <ul>
                {parsed.specialRequirements.bannedCompetitors.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          )}

          {parsed.specialRequirements.collisionWarnings.length > 0 && (
            <div className="form-section">
              <h3>已上线文章冲突警告</h3>
              <ul>
                {parsed.specialRequirements.collisionWarnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {parsed.specialRequirements.brandData.length > 0 && (
            <div className="form-section">
              <h3>品牌数据</h3>
              <ul>
                {parsed.specialRequirements.brandData.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </div>
          )}

          {parsed.specialRequirements.requiredModules.length > 0 && (
            <div className="form-section">
              <h3>必须描述的功能模块</h3>
              <ul>
                {parsed.specialRequirements.requiredModules.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
          )}

          {error && <p className="error">{error}</p>}

          <div className="form-actions">
            <button type="button" className="btn" onClick={() => { setStep("upload"); setParsed(null); }}>
              ← 返回修改
            </button>
            <button type="button" className="btn primary" onClick={handleCreate} disabled={loading}>
              确认创建集群项目 →
            </button>
          </div>
        </div>
      )}

      {step === "creating" && (
        <div className="form-section">
          <h2>正在创建集群项目...</h2>
          <p>正在为 {parsed?.articles.length} 篇文章创建项目和目录结构，请稍候。</p>
        </div>
      )}
    </div>
  );
}
