import type { ReactNode } from "react";

interface PhaseItem {
  name: string;
  description?: string;
  status?: string;
  actions?: ReactNode;
}

interface PhaseTimelineProps {
  phases: PhaseItem[];
  activePhase?: number;
}

export default function PhaseTimeline({
  phases,
  activePhase = -1,
}: PhaseTimelineProps) {
  return (
    <div className="phase-timeline">
      {phases.map((phase, i) => {
        const isActive = i === activePhase;
        const isCompleted = phase.status === "approved" || phase.status === "completed";
        const classes = [
          "phase-item",
          isActive ? "active" : "",
          isCompleted ? "completed" : "",
        ].filter(Boolean).join(" ");

        return (
          <div key={i} className={classes}>
            <div className="phase-dot" />
            <div className="phase-info">
              <div className="phase-name">{phase.name}</div>
              {phase.description && (
                <div className="phase-desc">{phase.description}</div>
              )}
            </div>
            {phase.actions}
          </div>
        );
      })}
    </div>
  );
}
