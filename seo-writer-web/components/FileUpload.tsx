"use client";

import { useRef, useState } from "react";

interface FileUploadProps {
  name: string;
  label: string;
  multiple?: boolean;
  required?: boolean;
  accept?: string;
  help?: string;
  currentFiles?: string[];  // Currently saved file names
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
    // Focus the file input after render
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
            <button type="button" className="btn-sm" onClick={handleReplace}>
              更换文件
            </button>
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
            <button type="button" className="btn-sm ghost" onClick={handleCancel}>
              取消更换
            </button>
          )}
          {selectedName && (
            <span className="help">已选择：{selectedName}</span>
          )}
        </div>
      )}

      {help ? <span className="help">{help}</span> : null}

      <style jsx>{`
        .current-file-display {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 0.75rem;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 6px;
          margin-bottom: 0.25rem;
        }
        .current-file-info {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          flex: 1;
          min-width: 0;
        }
        .current-file-icon { font-size: 1.1rem; }
        .current-file-name {
          font-size: 0.85rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .current-file-badge {
          font-size: 0.7rem;
          padding: 0.1rem 0.4rem;
          background: #dcfce7;
          color: #166534;
          border-radius: 3px;
          white-space: nowrap;
        }
        .current-file-actions { white-space: nowrap; }
        .btn-sm {
          padding: 0.2rem 0.5rem;
          font-size: 0.8rem;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          background: white;
          cursor: pointer;
          color: #374151;
        }
        .btn-sm:hover { background: #f9fafb; }
        .btn-sm.ghost { border: none; color: #6b7280; }
        .btn-sm.ghost:hover { color: #1f2937; }
        .upload-input-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
      `}</style>
    </div>
  );
}
