import { ListChecks, Plus, Settings } from "lucide-react";
import { listProjects } from "@/lib/db";
import { encodeProjectId } from "@/lib/routeParams";
import { phaseLabels } from "@/lib/validators";
import PageShell from "@/components/ui/PageShell";
import PageTitle from "@/components/ui/PageTitle";
import Badge, { getStatusVariant } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function DashboardPage() {
  const projects = listProjects();

  return (
    <PageShell>
      <PageTitle
        title="文章项目"
        subtitle="按阶段调度 SEO Article Writer Skill，保留人工审查和输出文件。"
        actions={
          <>
            <a className="btn btn-ghost" href="/projects/manage">
              <ListChecks size={16} />
              管理
            </a>
            <a className="btn btn-ghost" href="/clusters/new">
              <Plus size={16} />
              新建集群项目
            </a>
            <a className="btn btn-primary" href="/projects/new">
              <Plus size={16} />
              新建文章项目
            </a>
          </>
        }
      />

      {projects.length === 0 ? (
        <div className="empty">
          <Settings size={28} />
          <p>还没有项目。先创建一个文章项目，再从 Phase 0 开始。</p>
        </div>
      ) : (
        <section className="grid projects">
          {projects.map((project) => (
            <a className="project-card" href={`/projects/${encodeProjectId(project.id)}`} key={project.id}>
              <div className="phase-row">
                <h2>{project.name}</h2>
                <Badge variant={getStatusVariant(project.status === "completed" ? "approved" : "waiting_review")}>
                  {project.status}
                </Badge>
              </div>
              <p className="page-subtitle">{project.article_title || project.topic}</p>
              <div className="meta-row">
                <span>当前阶段</span>
                <strong>{phaseLabels[project.current_phase]}</strong>
              </div>
              <div className="meta-row">
                <span>写作/批改模型</span>
                <span>{project.writing_provider || project.provider} / {project.writing_model_name || project.model_name}</span>
              </div>
              <div className="meta-row">
                <span>审查模型</span>
                <span>{project.auditor_provider || project.writing_provider || project.provider} / {project.auditor_model_name || project.writing_model_name || project.model_name}</span>
              </div>
              <div className="meta-row">
                <span>创建</span>
                <span>{new Date(project.created_at).toLocaleString("zh-CN", { hour12: false })}</span>
              </div>
              <div className="meta-row">
                <span>更新</span>
                <span>{new Date(project.updated_at).toLocaleString("zh-CN", { hour12: false })}</span>
              </div>
            </a>
          ))}
        </section>
      )}
    </PageShell>
  );
}
