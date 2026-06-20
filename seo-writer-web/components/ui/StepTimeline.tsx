import type { ReactNode } from "react";

interface StepItem {
  label: string;
  description?: string;
  status?: string;
  actions?: ReactNode;
}

interface StepTimelineProps {
  steps: StepItem[];
  activeIndex?: number;
  completedIndices?: number[];
}

export default function StepTimeline({
  steps,
  activeIndex = -1,
  completedIndices = [],
}: StepTimelineProps) {
  return (
    <div className="step-timeline">
      {steps.map((step, i) => {
        const isActive = i === activeIndex;
        const isCompleted = completedIndices.includes(i);
        const classes = [
          "step-item",
          isActive ? "active" : "",
          isCompleted ? "completed" : "",
        ].filter(Boolean).join(" ");

        return (
          <div key={i} className={classes}>
            <div className="step-number">{i + 1}</div>
            <div className="step-content">
              <div className="step-title">{step.label}</div>
              {step.description && (
                <div className="step-desc">{step.description}</div>
              )}
            </div>
            <div className="step-status">
              {step.actions}
            </div>
          </div>
        );
      })}
    </div>
  );
}
