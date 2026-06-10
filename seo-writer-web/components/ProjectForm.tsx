"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Save } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import ModelConfigForm from "@/components/ModelConfigForm";
import { encodeProjectId } from "@/lib/routeParams";
import type { SharedFilesStatus } from "@/lib/sharedFiles";

interface ProductInfo {
  name: string;
  hasExtractedMaterials: boolean;
  sourceFiles: string[];
}

interface ProjectFormProps {
  sharedFiles: SharedFilesStatus;
}

export default function ProjectForm({ sharedFiles }: ProjectFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);
  const [products, setProducts] = useState<ProductInfo[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductInfo | null>(null);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => setProducts(data.products || []))
      .catch(() => {});
  }, []);

  function handleBrandNameChange(value: string) {
    const product = products.find((p) => p.name === value) || null;
    setSelectedProduct(product);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        body: formData
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "项目创建失败");
      }
      router.push(`/projects/${encodeProjectId(data.projectId)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="panel" onSubmit={handleSubmit} autoComplete="off">
      {error ? <div className="error">{error}</div> : null}

      <div className="form-section">
        <h2>基础信息</h2>
        <div className="notice">
          articleTitle、targetAudience 和 searchIntent 会在 Phase 0 / Phase 1 由 SEO Article Writer Skill 根据材料自动生成。
        </div>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="projectName">projectName</label>
            <input id="projectName" name="projectName" required placeholder="例如 Korean beginner resources" />
          </div>
          <div className="field">
            <label htmlFor="language">language</label>
            <input id="language" name="language" defaultValue="English" />
          </div>
          <div className="field">
            <label htmlFor="brandName">brandName（产品名）</label>
            <input
              id="brandName"
              name="brandName"
              list="productList"
              placeholder="选择已有产品或输入新产品名"
              onChange={(event) => handleBrandNameChange(event.target.value)}
            />
            <datalist id="productList">
              {products.map((product) => (
                <option key={product.name} value={product.name} />
              ))}
            </datalist>
            {selectedProduct ? (
              <span className="help">
                已有产品：将复用已提取的材料（{selectedProduct.sourceFiles.length} 个源文件）。
              </span>
            ) : products.length > 0 ? (
              <span className="help">可从下拉选择已有产品，或手动输入新产品名。</span>
            ) : null}
          </div>
        </div>
      </div>

      <ModelConfigForm />

      <div className="form-section">
        <h2>文章要求</h2>
        <div className="form-grid">
          <div className="field full">
            <label htmlFor="topic">选题</label>
            <textarea id="topic" name="topic" required />
          </div>
          <div className="field">
            <label htmlFor="primaryKeyword">主关键词</label>
            <input id="primaryKeyword" name="primaryKeyword" required autoComplete="off" />
          </div>
          <div className="field">
            <label htmlFor="secondaryKeywords">副关键词</label>
            <input id="secondaryKeywords" name="secondaryKeywords" placeholder="可选，不填则在 Phase 1 大纲阶段自动生成" />
            <span className="help">可用逗号或换行分隔；留空时由 AI 根据主关键词、搜索意图和写作规范生成。</span>
          </div>
          <div className="field full">
            <label htmlFor="articleFocus">文章重点</label>
            <textarea id="articleFocus" name="articleFocus" required />
          </div>
          <div className="field full">
            <label htmlFor="recommendationReason">推荐理由</label>
            <textarea id="recommendationReason" name="recommendationReason" required />
          </div>
          <div className="field">
            <label htmlFor="imageRequirements">图片数量或位置要求</label>
            <input id="imageRequirements" name="imageRequirements" placeholder="例如 2 张，开头和 FAQ 前" />
          </div>
          <div className="field">
            <label htmlFor="extraNotes">额外注意事项</label>
            <input id="extraNotes" name="extraNotes" placeholder="可填无" />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h2>长期参考文件</h2>
        <div className="notice">
          写作规范和示例文章会保存为共享默认文件。后续新项目会自动复用它们；只有重新选择文件时，才会更新共享文件。
        </div>
        <div className="form-grid">
          <FileUpload
            name="writingGuidelineFile"
            label="writingGuidelineFile"
            required={!sharedFiles.hasWritingGuideline}
            accept=".docx,.pdf,.md,.txt"
            help={
              sharedFiles.hasWritingGuideline
                ? `当前已保存：${sharedFiles.writingGuidelineFiles.join(", ")}。不上传新文件将继续复用。`
                : "尚未保存共享写作规范，首次创建项目必须上传。"
            }
          />
          <FileUpload
            name="exampleArticleFiles"
            label="exampleArticleFiles"
            multiple
            accept=".docx,.pdf,.md,.txt"
            help={
              sharedFiles.hasExampleArticles
                ? `当前已保存 ${sharedFiles.exampleArticleFiles.length} 个示例文件。不上传新文件将继续复用。`
                : "尚未保存共享示例文章。可先上传一次，后续项目自动复用。"
            }
          />
          <FileUpload
            name="topicRequirementFile"
            label="topicRequirementFile"
            accept=".xlsx,.xlsm,.docx,.pdf,.md,.txt"
            help="可选：本次项目专用的选题或 prompt 表，不会作为长期共享文件。"
          />
        </div>
      </div>

      <button className="primary" type="submit" disabled={isSubmitting}>
        <Save size={16} />
        {isSubmitting ? "创建中..." : "创建项目"}
      </button>
    </form>
  );
}
