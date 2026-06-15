"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Modal from "./Modal";

interface ArticlePreviewModalProps {
  open: boolean;
  onClose: () => void;
  slug: string;
  role: string;
  outlineContent: string;
  fullArticleContent: string;
  clusterId: string;
  showOutlineReviewLink: boolean;
  showArticleReviewLink: boolean;
}

type PreviewTab = "outline" | "fullArticle";

export default function ArticlePreviewModal({
  open,
  onClose,
  slug,
  role,
  outlineContent,
  fullArticleContent,
  clusterId,
  showOutlineReviewLink,
  showArticleReviewLink,
}: ArticlePreviewModalProps) {
  const [activeTab, setActiveTab] = useState<PreviewTab>("outline");

  // Reset tab state when modal opens for a new article
  useEffect(() => {
    if (open) {
      const hasOutline = outlineContent.trim().length > 0;
      setActiveTab(hasOutline ? "outline" : "fullArticle");
    }
  }, [open, slug, outlineContent]);

  const hasOutline = outlineContent.trim().length > 0;
  const hasFullArticle = fullArticleContent.trim().length > 0;

  // Default to the tab that has content
  const effectiveTab = activeTab === "outline" && !hasOutline && hasFullArticle
    ? "fullArticle"
    : activeTab;

  const content = effectiveTab === "outline" ? outlineContent : fullArticleContent;
  const isEmpty = content.trim().length > 0;
  const reviewTab = effectiveTab === "outline" ? "outlines" : "articles";
  const showReviewLink = effectiveTab === "outline" ? showOutlineReviewLink : showArticleReviewLink;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${role}: ${slug}`}
      width="900px"
      footer={
        showReviewLink ? (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>
              需要审核？前往审阅 tab 提交修改意见或批准。
            </span>
            <Link
              href={`/clusters/${clusterId}?view=${reviewTab}`}
              className="btn primary"
              onClick={onClose}
              style={{ textDecoration: "none" }}
            >
              前往审阅 →
            </Link>
          </div>
        ) : undefined
      }
    >
      <div>
        <div role="tablist" style={{ display: "flex", gap: "0.25rem", marginBottom: "1rem", borderBottom: "1px solid #e5e7eb", paddingBottom: "0.5rem" }}>
          <button
            role="tab"
            aria-selected={effectiveTab === "outline"}
            aria-controls="panel-outline"
            onClick={() => setActiveTab("outline")}
            disabled={!hasOutline}
            style={{
              padding: "0.4rem 0.75rem",
              background: "none",
              border: "none",
              borderBottom: effectiveTab === "outline" ? "2px solid #3b82f6" : "2px solid transparent",
              cursor: hasOutline ? "pointer" : "default",
              fontSize: "0.9rem",
              fontWeight: effectiveTab === "outline" ? 600 : 400,
              color: !hasOutline ? "#d1d5db" : effectiveTab === "outline" ? "#1e40af" : "#6b7280",
              opacity: !hasOutline ? 0.5 : 1,
            }}
          >
            大纲
          </button>
          <button
            role="tab"
            aria-selected={effectiveTab === "fullArticle"}
            aria-controls="panel-fullArticle"
            onClick={() => setActiveTab("fullArticle")}
            disabled={!hasFullArticle}
            style={{
              padding: "0.4rem 0.75rem",
              background: "none",
              border: "none",
              borderBottom: effectiveTab === "fullArticle" ? "2px solid #3b82f6" : "2px solid transparent",
              cursor: hasFullArticle ? "pointer" : "default",
              fontSize: "0.9rem",
              fontWeight: effectiveTab === "fullArticle" ? 600 : 400,
              color: !hasFullArticle ? "#d1d5db" : effectiveTab === "fullArticle" ? "#1e40af" : "#6b7280",
              opacity: !hasFullArticle ? 0.5 : 1,
            }}
          >
            全文
          </button>
        </div>

        <div
          id={effectiveTab === "outline" ? "panel-outline" : "panel-fullArticle"}
          role="tabpanel"
          style={{
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
            padding: "1rem",
            maxHeight: "60vh",
            overflowY: "auto",
            whiteSpace: "pre-wrap",
            fontSize: "0.85rem",
            lineHeight: "1.6",
          }}
        >
          {isEmpty ? content : "内容尚未生成"}
        </div>
      </div>
    </Modal>
  );
}
