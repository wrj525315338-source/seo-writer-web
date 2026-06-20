import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";

interface WarningCardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export default function WarningCard({
  title,
  children,
  className,
}: WarningCardProps) {
  return (
    <div className={`warning-card${className ? ` ${className}` : ""}`}>
      <div className="warning-card-icon">
        <AlertTriangle size={20} />
      </div>
      <div className="warning-card-body">
        {title && <div className="warning-card-title">{title}</div>}
        <div className="warning-card-text">{children}</div>
      </div>
    </div>
  );
}
