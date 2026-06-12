import fs from "node:fs";
import { getClusterStatePath, ensureClusterDirs } from "@/lib/fileStorage";
import { updateClusterPhase } from "@/lib/db";
import { ClusterPhaseId, ClusterState, PhaseState } from "@/lib/types";

const CLUSTER_PHASES: ClusterPhaseId[] = [
  "cluster_phase0",
  "cluster_phase1",
  "cluster_phase1b",
  "cluster_phase2",
  "cluster_phase3",
  "cluster_phase4",
  "cluster_phase5",
  "cluster_batch_confirm",
];

function createInitialClusterPhases(): Record<ClusterPhaseId, PhaseState> {
  const phases = {} as Record<ClusterPhaseId, PhaseState>;
  for (const phase of CLUSTER_PHASES) {
    phases[phase] = { status: "not_started", approved: false };
  }
  return phases;
}

export function createInitialClusterState(params: {
  clusterId: string;
  clusterName: string;
  clusterSlug: string;
  articles: ClusterState["articles"];
  crossLinkRules: ClusterState["crossLinkRules"];
  specialRequirements: ClusterState["specialRequirements"];
  blogBaseUrl: string;
}): ClusterState {
  return {
    clusterId: params.clusterId,
    clusterName: params.clusterName,
    clusterSlug: params.clusterSlug,
    articles: params.articles,
    crossLinkRules: params.crossLinkRules,
    specialRequirements: params.specialRequirements,
    sharedChecklistPath: "",
    sharedSummaryPath: "",
    crossLinkPlanPath: "",
    currentPhase: "cluster_phase0",
    blogBaseUrl: params.blogBaseUrl,
    phases: createInitialClusterPhases(),
  };
}

export function writeClusterState(state: ClusterState): void {
  ensureClusterDirs(state.clusterId);
  fs.writeFileSync(getClusterStatePath(state.clusterId), JSON.stringify(state, null, 2), "utf-8");
}

export function readClusterState(clusterId: string): ClusterState {
  const statePath = getClusterStatePath(clusterId);
  if (!fs.existsSync(statePath)) {
    throw new Error(`集群状态文件不存在: ${statePath}`);
  }
  return JSON.parse(fs.readFileSync(statePath, "utf-8")) as ClusterState;
}

export function setClusterPhaseStatus(
  clusterId: string,
  phase: ClusterPhaseId,
  status: "not_started" | "running" | "waiting_review" | "approved" | "failed",
  errorMessage = ""
): ClusterState {
  const state = readClusterState(clusterId);
  state.phases[phase].status = status;
  state.phases[phase].errorMessage = errorMessage || undefined;
  if (status !== "approved") {
    state.phases[phase].approved = false;
  }
  if (status === "waiting_review") {
    state.currentPhase = phase;
  }
  writeClusterState(state);
  return state;
}

export function approveClusterPhase(clusterId: string, phase: ClusterPhaseId): ClusterState {
  const state = readClusterState(clusterId);
  state.phases[phase].status = "approved";
  state.phases[phase].approved = true;
  state.phases[phase].errorMessage = undefined;
  // Advance to next cluster phase
  const idx = CLUSTER_PHASES.indexOf(phase);
  let nextPhase: ClusterPhaseId = phase;
  if (idx >= 0 && idx < CLUSTER_PHASES.length - 1) {
    nextPhase = CLUSTER_PHASES[idx + 1];
    state.currentPhase = nextPhase;
  }
  writeClusterState(state);
  // Also update the DB so GET /api/clusters returns correct phase
  try {
    updateClusterPhase(clusterId, nextPhase);
  } catch { /* non-fatal: JSON state is authoritative */ }
  return state;
}

export function getNextClusterPhase(phase: ClusterPhaseId): ClusterPhaseId | null {
  const idx = CLUSTER_PHASES.indexOf(phase);
  if (idx >= 0 && idx < CLUSTER_PHASES.length - 1) {
    return CLUSTER_PHASES[idx + 1];
  }
  return null;
}
