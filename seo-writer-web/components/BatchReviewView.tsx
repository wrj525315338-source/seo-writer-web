"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

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
    <Card title={readOnly ? "批量查看" : "批量确认"}>
      <div className="batch-review-content">
        {batchReview || "批量审查报告尚未生成。请先运行批量确认阶段。"}
      </div>

      {!readOnly && (
        <>
          {error && <p className="error">{error}</p>}
          <div style={{ marginTop: 16 }}>
            <Button variant="primary" onClick={handleApprove} disabled={approving || !batchReview}>
              {approving ? "审批中..." : "确认集群完成 →"}
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
