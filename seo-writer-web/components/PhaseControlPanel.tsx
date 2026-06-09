"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, RotateCcw, Settings } from "lucide-react";
import { providerLabels, resolveTextModel, textModelOptions } from "@/lib/modelCatalog";
import { PhaseId, ProjectState, Provider } from "@/lib/types";
import { encodeProjectId } from "@/lib/routeParams";
import { phaseLabels, phases, requiresManualReview } from "@/lib/validators";

interface PhaseControlPanelProps {
  projectId: string;
  state: ProjectState;
  selectedPhase: PhaseId;
}

type PhaseAction = "run" | "changeAuditorModelAndRetry" | "approve";

export default function PhaseControlPanel({ projectId, state, selectedPhase }: PhaseControlPanelProps) {
  const router = useRouter();
  const auditorConfig = state.modelConfig.auditorModel;
  const [busyPhase, setBusyPhase] = useState<PhaseId | null>(null);
  const [error, setError] = useState("");
  const [auditorProvider, setAuditorProvider] = useState<Provider>(auditorConfig.provider);
  const [auditorModelName, setAuditorModelName] = useState(resolveTextModel(auditorConfig.provider, auditorConfig.modelName));
  const [auditorBaseUrl, setAuditorBaseUrl] = useState(auditorConfig.baseUrl || "");
  const [auditorTemperature, setAuditorTemperature] = useState(String(auditorConfig.temperature ?? 0.2));

  useEffect(() => {
    setAuditorProvider(auditorConfig.provider);
    setAuditorModelName(resolveTextModel(auditorConfig.provider, auditorConfig.modelName));
    setAuditorBaseUrl(auditorConfig.baseUrl || "");
    setAuditorTemperature(String(auditorConfig.temperature ?? 0.2));
  }, [auditorConfig.baseUrl, auditorConfig.modelName, auditorConfig.provider, auditorConfig.temperature]);

  function handleAuditorProviderChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextProvider = event.target.value as Provider;
    setAuditorProvider(nextProvider);
    setAuditorModelName(textModelOptions[nextProvider][0].value);
    setAuditorBaseUrl("");
  }

  async function submit(action: PhaseAction, phase: PhaseId, extraBody: Record<string, unknown> = {}) {
    setError("");
    setBusyPhase(phase);
    try {
      const response = await fetch(`/api/projects/${encodeProjectId(projectId)}/phase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, phase, ...extraBody })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "操作失败");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyPhase(null);
    }
  }

  function changeAuditorModelAndRetry(phase: PhaseId) {
    void submit("changeAuditorModelAndRetry", phase, {
      auditorProvider,
      auditorModelName,
      auditorBaseUrl,
      auditorTemperature
    });
  }

  return (
    <div className="panel">
      <div className="phase-row">
        <h2>Phase 操作区</h2>
        <span className="help">流程会自动推进；失败后可重新运行当前阶段</span>
      </div>
      {error ? <div className="error">{error}</div> : null}
      {busyPhase ? (
        <div className="notice">
          正在处理 {busyPhase.toUpperCase()}，如果该阶段会生成图片或 Word 文件，请稍等到页面自动刷新。
        </div>
      ) : null}
      <div className="phase-list">
        {phases.map((phase) => {
          const phaseState = state.phases[phase];
          const isBusy = busyPhase === phase || phaseState.status === "running";
          const showReviewControls = requiresManualReview(phase);
          const canConfirm = phaseState.status === "waiting_review";
          const showRerun = phaseState.status === "failed";
          const showConfirm = showReviewControls;
          const isPhase4Failed = phase === "phase4" && phaseState.status === "failed";
          return (
            <div className={`phase-card ${selectedPhase === phase ? "active" : ""}`} key={phase}>
              <div className="phase-row">
                {showReviewControls ? (
                  <a href={`/projects/${encodeProjectId(projectId)}?phase=${phase}`}>
                    <strong>{phase.toUpperCase()}</strong> {phaseLabels[phase]}
                  </a>
                ) : (
                  <span>
                    <strong>{phase.toUpperCase()}</strong> {phaseLabels[phase]}
                  </span>
                )}
                <span className={`status ${phaseState.status}`}>{phaseState.status}</span>
              </div>
              {phaseState.errorMessage ? <div className="error">{phaseState.errorMessage}</div> : null}
              {showRerun || showConfirm ? (
                <div className="phase-actions">
                  {showRerun ? (
                    isPhase4Failed ? (
                      <div className="phase-retry-model">
                        <p className="help">
                          当前审查模型：{auditorConfig.provider} / {auditorConfig.modelName || resolveTextModel(auditorConfig.provider, "")}
                        </p>
                        <div className="form-grid compact">
                          <div className="field">
                            <label htmlFor="retryAuditorProvider">Provider</label>
                            <select id="retryAuditorProvider" value={auditorProvider} onChange={handleAuditorProviderChange}>
                              {Object.entries(providerLabels).map(([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="field">
                            <label htmlFor="retryAuditorModelName">Model name</label>
                            <select
                              id="retryAuditorModelName"
                              value={auditorModelName}
                              onChange={(event) => setAuditorModelName(event.target.value)}
                            >
                              {textModelOptions[auditorProvider].map((model) => (
                                <option key={model.value} value={model.value}>
                                  {model.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="field">
                            <label htmlFor="retryAuditorBaseUrl">Base URL</label>
                            <input
                              id="retryAuditorBaseUrl"
                              value={auditorBaseUrl}
                              onChange={(event) => setAuditorBaseUrl(event.target.value)}
                              placeholder="custom endpoint，可选"
                            />
                          </div>
                          <div className="field">
                            <label htmlFor="retryAuditorTemperature">Temperature</label>
                            <input
                              id="retryAuditorTemperature"
                              type="number"
                              min="0"
                              max="2"
                              step="0.1"
                              value={auditorTemperature}
                              onChange={(event) => setAuditorTemperature(event.target.value)}
                            />
                          </div>
                        </div>
                        <div className="phase-actions">
                          <button type="button" onClick={() => submit("run", phase)} disabled={isBusy}>
                            <RotateCcw size={15} />
                            重试当前审查模型
                          </button>
                          <button
                            type="button"
                            className="primary"
                            onClick={() => changeAuditorModelAndRetry(phase)}
                            disabled={isBusy || !auditorModelName}
                          >
                            <Settings size={15} />
                            更换模型并重试
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button type="button" onClick={() => submit("run", phase)} disabled={isBusy}>
                        <RotateCcw size={15} />
                        重新运行
                      </button>
                    )
                  ) : null}
                  {showConfirm ? (
                    <button type="button" className="primary" onClick={() => submit("approve", phase)} disabled={isBusy || !canConfirm}>
                      <Check size={15} />
                      {busyPhase === phase ? "处理中..." : "确认通过"}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
