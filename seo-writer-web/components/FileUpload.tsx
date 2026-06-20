"use client";

import { useRef, useState } from "react";
import Button from "@/components/ui/Button";

interface FileUploadProps {
  name: string;
  label: string;
  multiple?: boolean;
  required?: boolean;
  accept?: string;
  help?: string;
  currentFiles?: string[];
}

export default function FileUpload({ name, label, multiple, required, accept, help, currentFiles }: FileUploadProps) {
  const hasCurrentFiles = currentFiles && currentFiles.length > 0;
  const [showUpload, setShowUpload] = useState(!hasCurrentFiles);
  const [selectedName, setSelectedName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedName(Array.from(files).map(f => f.name).join(", "));
    } else {
      setSelectedName("");
    }
  }

  function handleReplace() {
    setShowUpload(true);
    setSelectedName("");
    setTimeout(() => inputRef.current?.click(), 50);
  }

  function handleCancel() {
    setShowUpload(false);
    setSelectedName("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>

      {hasCurrentFiles && !showUpload && (
        <div className="current-file-display">
          <div className="current-file-info">
            <span className="current-file-icon">📄</span>
            <span className="current-file-name">{currentFiles.join(", ")}</span>
            <span className="current-file-badge">已保存</span>
          </div>
          <div className="current-file-actions">
            <Button size="sm" type="button" onClick={handleReplace}>
              更换文件
            </Button>
          </div>
          <input type="hidden" name={name} value="" />
        </div>
      )}

      {(!hasCurrentFiles || showUpload) && (
        <div className="upload-input-row">
          <input
            ref={inputRef}
            id={name}
            name={name}
            type="file"
            multiple={multiple}
            required={required && !hasCurrentFiles}
            accept={accept}
            onChange={handleChange}
          />
          {hasCurrentFiles && showUpload && (
            <Button size="sm" variant="ghost" type="button" onClick={handleCancel}>
              取消更换
            </Button>
          )}
          {selectedName && (
            <span className="help">已选择：{selectedName}</span>
          )}
        </div>
      )}

      {help ? <span className="help">{help}</span> : null}
    </div>
  );
}
