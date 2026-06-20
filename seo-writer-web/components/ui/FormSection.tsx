import type { ReactNode } from "react";

interface FormSectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export default function FormSection({
  title,
  description,
  children,
  className,
}: FormSectionProps) {
  return (
    <div className={`form-section-card${className ? ` ${className}` : ""}`}>
      {title && <h2 className="form-section-title">{title}</h2>}
      {description && <p className="form-section-desc">{description}</p>}
      <div className="form-section-fields">{children}</div>
    </div>
  );
}
