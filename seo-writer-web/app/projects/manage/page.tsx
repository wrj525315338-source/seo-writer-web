import { ArrowLeft } from "lucide-react";
import { listProjects } from "@/lib/db";
import ProjectBulkManager from "@/components/ProjectBulkManager";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function ProjectManagePage() {
  const projects = listProjects().map((project) => ({ ...project }));

  return (
    <main className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">项目管理</h1>
          <p className="page-subtitle">批量选择、删除文章项目。共享写作规范和示例文件不会被删除。</p>
        </div>
        <a className="button ghost" href="/projects">
          <ArrowLeft size={16} />
          返回项目
        </a>
      </div>

      <ProjectBulkManager projects={projects} />
    </main>
  );
}
