"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Modal from "./Modal";
import Button from "@/components/ui/Button";

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

  useEffect(() => {
    if (open) {
      const hasOutline = outlineContent.trim().length > 0;
      setActiveTab(hasOutline ? "outline" : "fullArticle");
    }
  }, [open, slug, outlineContent]);

  const hasOutline = outlineContent.trim().length > 0;
  const hasFullArticle = fullArticleContent.trim().length > 0;

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
            <span className="help">
              需要审核？前往审阅 tab 提交修改意见或批准。
            </span>
            <Link
              href={`/clusters/${clusterId}?view=${reviewTab}`}
              className="btn btn-primary"
              onClick={onClose}
            >
              前往审阅 →
            </Link>
          </div>
        ) : undefined
      }
    >
      <div>
        <div className="tabs" role="tablist">
          <button
            type="button"
            role="tab"
            className={`tab${effectiveTab === "outline" ? " active" : ""}`}
            aria-selected={effectiveTab === "outline"}
            aria-controls="panel-outline"
            onClick={() => setActiveTab("outline")}
            disabled={!hasOutline}
            style={{ opacity: !hasOutline ? 0.5 : 1 }}
          >
            大纲
          </button>
          <button
            type="button"
            role="tab"
            className={`tab${effectiveTab === "fullArticle" ? " active" : ""}`}
            aria-selected={effectiveTab === "fullArticle"}
            aria-controls="panel-fullArticle"
            onClick={() => setActiveTab("fullArticle")}
            disabled={!hasFullArticle}
            style={{ opacity: !hasFullArticle ? 0.5 : 1 }}
          >
            全文
          </button>
        </div>

        <div
          id={effectiveTab === "outline" ? "panel-outline" : "panel-fullArticle"}
          role="tabpanel"
          className="outline-content"
          style={{ maxHeight: "60vh" }}
        >
          {isEmpty ? content : "内容尚未生成"}
        </div>
      </div>
    </Modal>
  );
}
