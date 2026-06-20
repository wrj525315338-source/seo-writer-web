import { FileText, Download } from "lucide-react";

interface FileItem {
  name: string;
  size?: string;
  url?: string;
}

interface FileListCardProps {
  files: FileItem[];
  emptyText?: string;
}

export default function FileListCard({
  files,
  emptyText = "暂无输出文件",
}: FileListCardProps) {
  if (files.length === 0) {
    return <div className="empty">{emptyText}</div>;
  }

  return (
    <div className="file-list">
      {files.map((file, i) => (
        <div key={i} className="file-list-item">
          <div className="file-list-info">
            <FileText size={16} className="file-list-icon" />
            <span className="file-list-name">{file.name}</span>
            {file.size && <span className="file-list-size">{file.size}</span>}
          </div>
          {file.url && (
            <a
              href={file.url}
              download
              className="btn btn-ghost btn-sm"
              title="下载"
            >
              <Download size={14} />
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
