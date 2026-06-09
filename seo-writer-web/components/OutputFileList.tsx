import { Download } from "lucide-react";
import { encodeProjectId } from "@/lib/routeParams";
import type { OutputFileInfo } from "@/lib/fileStorage";

function formatSize(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export default function OutputFileList({ projectId, files }: { projectId: string; files: OutputFileInfo[] }) {
  return (
    <div className="panel">
      <h2>输出文件列表</h2>
      {files.length === 0 ? (
        <p className="page-subtitle">暂无输出文件。</p>
      ) : (
        <div className="grid">
          {files.map((file) => (
            <div className="file-row" key={file.name}>
              <span>
                <strong>{file.name}</strong>
                <small>{new Date(file.updatedAt).toLocaleString()} · {formatSize(file.size)}</small>
              </span>
              <a className="button ghost" href={`/api/files/${encodeProjectId(projectId)}/outputs/${encodeURIComponent(file.name)}`}>
                <Download size={15} />
                下载
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
