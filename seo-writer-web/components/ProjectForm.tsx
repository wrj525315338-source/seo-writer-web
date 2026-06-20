"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Save } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import ModelConfigForm from "@/components/ModelConfigForm";
import FormSection from "@/components/ui/FormSection";
import FormField from "@/components/ui/FormField";
import Button from "@/components/ui/Button";
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
    <form onSubmit={handleSubmit} autoComplete="off">
      {error ? <div className="error">{error}</div> : null}

      <FormSection
        title="基础信息"
        description="articleTitle、targetAudience 和 searchIntent 会在 Phase 0 / Phase 1 由 SEO Article Writer Skill 根据材料自动生成。"
      >
        <FormField label="projectName" htmlFor="projectName">
          <input id="projectName" name="projectName" required placeholder="例如 Korean beginner resources" />
        </FormField>
        <FormField label="language" htmlFor="language">
          <input id="language" name="language" defaultValue="English" />
        </FormField>
        <FormField
          label="brandName（产品名）"
          htmlFor="brandName"
          helpText={
            selectedProduct
              ? `已有产品：将复用已提取的材料（${selectedProduct.sourceFiles.length} 个源文件）。`
              : products.length > 0
                ? "可从下拉选择已有产品，或手动输入新产品名。"
                : undefined
          }
        >
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
        </FormField>
      </FormSection>

      <ModelConfigForm />

      <FormSection title="文章要求">
        <FormField label="选题" htmlFor="topic" full>
          <textarea id="topic" name="topic" required />
        </FormField>
        <FormField label="主关键词" htmlFor="primaryKeyword">
          <input id="primaryKeyword" name="primaryKeyword" required autoComplete="off" />
        </FormField>
        <FormField
          label="副关键词"
          htmlFor="secondaryKeywords"
          helpText="可用逗号或换行分隔；留空时由 AI 根据主关键词、搜索意图和写作规范生成。"
        >
          <input id="secondaryKeywords" name="secondaryKeywords" placeholder="可选，不填则在 Phase 1 大纲阶段自动生成" />
        </FormField>
        <FormField label="文章重点" htmlFor="articleFocus" full>
          <textarea id="articleFocus" name="articleFocus" required />
        </FormField>
        <FormField label="推荐理由" htmlFor="recommendationReason" full>
          <textarea id="recommendationReason" name="recommendationReason" required />
        </FormField>
        <FormField label="图片数量或位置要求" htmlFor="imageRequirements">
          <input id="imageRequirements" name="imageRequirements" placeholder="例如 2 张，开头和 FAQ 前" />
        </FormField>
        <FormField label="额外注意事项" htmlFor="extraNotes">
          <input id="extraNotes" name="extraNotes" placeholder="可填无" />
        </FormField>
      </FormSection>

      <FormSection
        title="长期参考文件"
        description="写作规范和示例文章会保存为共享默认文件。后续新项目会自动复用它们；只有重新选择文件时，才会更新共享文件。"
      >
        <FileUpload
          name="writingGuidelineFile"
          label="writingGuidelineFile"
          required={!sharedFiles.hasWritingGuideline}
          accept=".docx,.pdf,.md,.txt"
          currentFiles={sharedFiles.hasWritingGuideline ? sharedFiles.writingGuidelineFiles : undefined}
          help={
            sharedFiles.hasWritingGuideline
              ? "上传新文件将替换当前规范，后续项目也会使用新版本。"
              : "尚未保存共享写作规范，首次创建项目必须上传。"
          }
        />
        <FileUpload
          name="exampleArticleFiles"
          label="exampleArticleFiles"
          multiple
          accept=".docx,.pdf,.md,.txt"
          currentFiles={sharedFiles.hasExampleArticles ? sharedFiles.exampleArticleFiles : undefined}
          help={
            sharedFiles.hasExampleArticles
              ? "上传新文件将替换当前示例，后续项目也会使用新版本。"
              : "尚未保存共享示例文章。可先上传一次，后续项目自动复用。"
          }
        />
        <FileUpload
          name="topicRequirementFile"
          label="topicRequirementFile"
          accept=".xlsx,.xlsm,.docx,.pdf,.md,.txt"
          help="可选：本次项目专用的选题或 prompt 表，不会作为长期共享文件。"
        />
      </FormSection>

      <Button variant="primary" type="submit" disabled={isSubmitting}>
        <Save size={16} />
        {isSubmitting ? "创建中..." : "创建项目"}
      </Button>
    </form>
  );
}
