"use client";

import { useMemo, useState } from "react";
import { Copy } from "lucide-react";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderMarkdown(markdown: string): string {
  const lines = markdown.split(/\r?\n/);
  let html = "";
  let inList = false;
  for (const line of lines) {
    if (!line.trim()) {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      continue;
    }
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      html += `<h${heading[1].length}>${escapeHtml(heading[2])}</h${heading[1].length}>`;
      continue;
    }
    const bullet = /^[-*]\s+(.+)$/.exec(line);
    if (bullet) {
      if (!inList) {
        html += "<ul>";
        inList = true;
      }
      html += `<li>${escapeHtml(bullet[1])}</li>`;
      continue;
    }
    if (inList) {
      html += "</ul>";
      inList = false;
    }
    html += `<p>${escapeHtml(line)}</p>`;
  }
  if (inList) {
    html += "</ul>";
  }
  return html;
}

export default function MarkdownPreview({ content }: { content: string }) {
  const [mode, setMode] = useState<"preview" | "raw">("preview");
  const html = useMemo(() => renderMarkdown(content || ""), [content]);

  if (!content) {
    return <div className="empty">当前阶段还没有可预览输出。流程生成可确认内容后会在这里显示结果。</div>;
  }

  async function copyContent() {
    await navigator.clipboard.writeText(content);
  }

  return (
    <>
      <div className="preview-toolbar">
        <div className="preview-tabs">
          <button type="button" className={mode === "preview" ? "primary" : ""} onClick={() => setMode("preview")}>
            Markdown 预览
          </button>
          <button type="button" className={mode === "raw" ? "primary" : ""} onClick={() => setMode("raw")}>
            原始文本
          </button>
        </div>
        <button type="button" onClick={copyContent}>
          <Copy size={15} />
          复制
        </button>
      </div>
      {mode === "preview" ? (
        <div className="preview" dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <pre className="preview raw">{content}</pre>
      )}
    </>
  );
}
