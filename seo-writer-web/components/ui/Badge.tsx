import type { ReactNode } from "react";

type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantMap: Record<string, BadgeVariant> = {
  approved: "success",
  completed: "success",
  ready: "warning",
  waiting_review: "warning",
  running: "info",
  failed: "danger",
  not_started: "neutral",
  active: "info",
};

export function getStatusVariant(status: string): BadgeVariant {
  return variantMap[status] ?? "neutral";
}

export default function Badge({
  variant = "neutral",
  children,
  className,
}: BadgeProps) {
  const classes = ["badge", `badge-${variant}`, className]
    .filter(Boolean)
    .join(" ");

  return <span className={classes}>{children}</span>;
}
