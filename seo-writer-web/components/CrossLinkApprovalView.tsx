"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface CrossLinkApprovalViewProps {
  clusterId: string;
  crossLinkPlan: string;
}

export default function CrossLinkApprovalView({ clusterId, crossLinkPlan }: CrossLinkApprovalViewProps) {
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
    <div style={{ margin: "1rem 0" }}>
      <h3>互链规划审阅</h3>
      <pre style={{
        background: "#f9fafb",
        border: "1px solid #e5e7eb",
        borderRadius: "6px",
        padding: "1rem",
        whiteSpace: "pre-wrap",
        fontSize: "0.85rem",
        maxHeight: "600px",
        overflowY: "auto",
        marginBottom: "1rem",
      }}>
        {crossLinkPlan || "互链规划尚未生成"}
      </pre>
      {error && <p style={{ color: "#ef4444", marginBottom: "0.5rem" }}>{error}</p>}
      <button className="btn primary" onClick={handleApprove} disabled={approving}>
        {approving ? "审批中..." : "批准互链规划 →"}
      </button>
    </div>
  );
}
