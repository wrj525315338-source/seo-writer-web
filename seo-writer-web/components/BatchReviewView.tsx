"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface BatchReviewViewProps {
  clusterId: string;
  batchReview: string;
  onApprove?: () => void;
  readOnly?: boolean;
}

export default function BatchReviewView({ clusterId, batchReview, onApprove, readOnly = false }: BatchReviewViewProps) {
  const router = useRouter();
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState("");

  async function handleApprove() {
    setApproving(true);
    setError("");
    try {
      const response = await fetch(`/api/clusters/${clusterId}/phase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", phase: "cluster_batch_confirm" }),
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "审批失败");
        return;
      }
      onApprove?.();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "网络错误");
    } finally {
      setApproving(false);
    }
  }

  return (
    <div style={{ margin: "1rem 0" }}>
      <h3>{readOnly ? "批量查看" : "批量确认"}</h3>
      <div style={{
        background: "#f9fafb",
        border: "1px solid #e5e7eb",
        borderRadius: "6px",
        padding: "1rem",
        maxHeight: "600px",
        overflowY: "auto",
        marginBottom: "1rem",
        whiteSpace: "pre-wrap",
        fontSize: "0.85rem",
        lineHeight: "1.6",
      }}>
        {batchReview || "批量审查报告尚未生成。请先运行批量确认阶段。"}
      </div>

      {!readOnly && (
        <>
          {error && <p style={{ color: "#ef4444", marginBottom: "0.5rem" }}>{error}</p>}

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button className="btn primary" onClick={handleApprove} disabled={approving || !batchReview}>
              {approving ? "审批中..." : "确认集群完成 →"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
