"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { PhaseId } from "@/lib/types";
import { encodeProjectId } from "@/lib/routeParams";

export default function ReviewCommentBox({ projectId, phase, disabled }: {
  projectId: string;
  phase: PhaseId;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch(`/api/projects/${encodeProjectId(projectId)}/phase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revise", phase, comment })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "提交修改意见失败");
      }
      setComment("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="panel" onSubmit={handleSubmit}>
      <h2>人工修改意见区</h2>
      <p className="page-subtitle">
        {phase === "phase5"
          ? "提交后会结合 Phase 4 审查结果修正文稿，并自动回到 Phase 4 重新查验。"
          : "修改意见会继续调用 SEO Article Writer Skill，并重新检查写作规范冲突。"}
      </p>
      {error ? <div className="error">{error}</div> : null}
      <div className="field">
        <label htmlFor="review-comment">修改意见</label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          disabled={disabled || isSubmitting}
          placeholder="例如：让大纲里的产品植入更靠后，FAQ 增加一个关于免费功能的问题。"
        />
      </div>
      <button className="primary" type="submit" disabled={disabled || isSubmitting || !comment.trim()}>
        <Send size={15} />
        {isSubmitting ? "修订中..." : "提交修改意见"}
      </button>
    </form>
  );
}
