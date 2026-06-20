import { ArrowLeft } from "lucide-react";
import { listProjects } from "@/lib/db";
import ProjectBulkManager from "@/components/ProjectBulkManager";
import PageShell from "@/components/ui/PageShell";
import PageTitle from "@/components/ui/PageTitle";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function ProjectManagePage() {
  const projects = listProjects().map((project) => ({ ...project }));

  return (
    <PageShell>
      <PageTitle
        title="项目管理"
        subtitle="批量选择、删除文章项目。共享写作规范和示例文件不会被删除。"
        actions={
          <a className="btn btn-ghost" href="/projects">
            <ArrowLeft size={16} />
            返回项目
          </a>
        }
      />

      <ProjectBulkManager projects={projects} />
    </PageShell>
  );
}
