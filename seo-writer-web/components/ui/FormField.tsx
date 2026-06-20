import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  helpText?: string;
  full?: boolean;
  children: ReactNode;
  className?: string;
}

export default function FormField({
  label,
  htmlFor,
  helpText,
  full,
  children,
  className,
}: FormFieldProps) {
  const classes = [
    "form-field",
    full ? "full" : "",
    className,
  ].filter(Boolean).join(" ");

  return (
    <div className={classes}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {helpText && <span className="help-text">{helpText}</span>}
    </div>
  );
}
