"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { PhaseId, ProjectState } from "@/lib/types";
import { encodeProjectId } from "@/lib/routeParams";
import { phaseLabels } from "@/lib/validators";

interface WorkflowAutoRunnerProps {
  projectId: string;
  state: ProjectState;
  projectStatus: string;
}

export default function WorkflowAutoRunner({ projectId, state, projectStatus }: WorkflowAutoRunnerProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const runningKeyRef = useRef("");
  const currentPhase = state.currentPhase;
  const currentPhaseState = state.phases[currentPhase];
  const shouldAutoRun = projectStatus !== "completed" && currentPhaseState.status === "not_started";
  const isRunning = currentPhaseState.status === "running";

  useEffect(() => {
    if (!shouldAutoRun) {
      return;
    }

    const runKey = `${projectId}:${currentPhase}`;
    if (runningKeyRef.current === runKey) {
      return;
    }
    runningKeyRef.current = runKey;
    setError("");

    async function runCurrentPhase(phase: PhaseId) {
      try {
        const response = await fetch(`/api/projects/${encodeProjectId(projectId)}/phase`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "run", phase })
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "阶段自动运行失败");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        runningKeyRef.current = "";
        router.refresh();
      }
    }

    void runCurrentPhase(currentPhase);
  }, [currentPhase, projectId, router, shouldAutoRun]);

  useEffect(() => {
    if (!isRunning) {
      return;
    }
    const timer = window.setInterval(() => router.refresh(), 5000);
    return () => window.clearInterval(timer);
  }, [isRunning, router]);

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (shouldAutoRun || isRunning) {
    return (
      <div className="notice phase-row">
        <span>
          自动运行中：{currentPhase.toUpperCase()} {phaseLabels[currentPhase]}
        </span>
        <Loader2 size={16} className="spin" />
      </div>
    );
  }

  if (currentPhaseState.status === "waiting_review") {
    return <div className="notice">流程已暂停，请预览并确认 {currentPhase.toUpperCase()} 后继续自动推进。</div>;
  }

  if (currentPhaseState.status === "failed") {
    return <div className="error">当前阶段运行失败，请在 Phase 操作区重新运行该阶段。</div>;
  }

  return null;
}
