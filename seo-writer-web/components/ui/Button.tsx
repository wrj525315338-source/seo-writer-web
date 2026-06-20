"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "default" | "sm";
  children: ReactNode;
}

export default function Button({
  variant = "secondary",
  size = "default",
  className,
  children,
  ...props
}: ButtonProps) {
  const variantClass = `btn-${variant}`;
  const sizeClass = size === "sm" ? "btn-sm" : "";
  const classes = ["btn", variantClass, sizeClass, className]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
