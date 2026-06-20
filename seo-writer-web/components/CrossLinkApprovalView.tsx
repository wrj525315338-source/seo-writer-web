"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

interface CrossLinkApprovalViewProps {
  clusterId: string;
  crossLinkPlan: string;
  readOnly?: boolean;
}

export default function CrossLinkApprovalView({ clusterId, crossLinkPlan, readOnly = false }: CrossLinkApprovalViewProps) {
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
        body: JSON.stringify({ action: "approve", phase: "cluster_phase1b" }),
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "审批失败");
        return;
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "网络错误");
    } finally {
      setApproving(false);
    }
  }

  return (
    <Card title={readOnly ? "互链规划查看" : "互链规划审阅"}>
      <div className="crosslink-content">
        {crossLinkPlan || "互链规划尚未生成"}
      </div>
      {!readOnly && (
        <>
          {error && <p className="error">{error}</p>}
          <div style={{ marginTop: 16 }}>
            <Button variant="primary" onClick={handleApprove} disabled={approving}>
              {approving ? "审批中..." : "批准互链规划 →"}
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
