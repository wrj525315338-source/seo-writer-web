import type { ReactNode } from "react";

interface PageTitleProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children?: ReactNode;
}

export default function PageTitle({ title, subtitle, actions, children }: PageTitleProps) {
  if (actions) {
    return (
      <div className="page-title-group">
        <div className="page-title-header">
          <div>
            <h1 className="page-title-main">{title}</h1>
            {subtitle && <p className="page-title-subtitle">{subtitle}</p>}
          </div>
          <div className="page-title-actions">{actions}</div>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="page-title-group">
      <h1 className="page-title-main">{title}</h1>
      {subtitle && <p className="page-title-subtitle">{subtitle}</p>}
      {children && <div className="page-title-actions">{children}</div>}
    </div>
  );
}
