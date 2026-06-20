import type { ReactNode } from "react";

interface PageShellProps {
  children: ReactNode;
  className?: string;
}

export default function PageShell({ children, className }: PageShellProps) {
  return (
    <main className={`page-shell${className ? ` ${className}` : ""}`}>
      {children}
    </main>
  );
}
