import { Download, FileText } from "lucide-react";
import { encodeProjectId } from "@/lib/routeParams";
import type { OutputFileInfo } from "@/lib/fileStorage";
import Card from "@/components/ui/Card";

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
    <Card title="输出文件列表">
      {files.length === 0 ? (
        <p className="page-subtitle">暂无输出文件。</p>
      ) : (
        <div className="file-list">
          {files.map((file) => (
            <div className="file-list-item" key={file.name}>
              <div className="file-list-info">
                <FileText size={16} className="file-list-icon" />
                <span className="file-list-name">{file.name}</span>
                <span className="file-list-size">{formatSize(file.size)}</span>
              </div>
              <a
                className="btn btn-ghost btn-sm"
                href={`/api/files/${encodeProjectId(projectId)}/outputs/${encodeURIComponent(file.name)}`}
                download
              >
                <Download size={14} />
              </a>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
