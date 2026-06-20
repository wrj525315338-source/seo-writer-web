"use client";

import { Upload } from "lucide-react";
import type { ReactNode } from "react";

interface UploadZoneProps {
  text?: string;
  hint?: string;
  hasFile?: boolean;
  fileName?: string;
  children?: ReactNode;
  onClick?: () => void;
  className?: string;
}

export default function UploadZone({
  text = "点击或拖拽文件到此处上传",
  hint,
  hasFile,
  fileName,
  children,
  onClick,
  className,
}: UploadZoneProps) {
  const classes = [
    "upload-zone",
    hasFile ? "has-file" : "",
    className,
  ].filter(Boolean).join(" ");

  return (
    <div className={classes} onClick={onClick} role="button" tabIndex={0}>
      {hasFile && fileName ? (
        <>
          <div className="upload-zone-icon">
            <Upload size={24} />
          </div>
          <div className="upload-zone-text">{fileName}</div>
          {hint && <div className="upload-zone-hint">{hint}</div>}
        </>
      ) : (
        <>
          <div className="upload-zone-icon">
            <Upload size={24} />
          </div>
          <div className="upload-zone-text">{text}</div>
          {hint && <div className="upload-zone-hint">{hint}</div>}
        </>
      )}
      {children}
    </div>
  );
}
