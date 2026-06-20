"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckSquare, Square, Trash2 } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge, { getStatusVariant } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import type { Project } from "@/lib/types";
import { phaseLabels } from "@/lib/validators";

interface ProjectBulkManagerProps {
  projects: Project[];
}

export default function ProjectBulkManager({ projects }: ProjectBulkManagerProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const allSelected = projects.length > 0 && selectedIds.size === projects.length;
  const selectedProjects = useMemo(
    () => projects.filter((project) => selectedIds.has(project.id)),
    [projects, selectedIds]
  );

  function toggleProject(projectId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  }

  function toggleAll() {
    setSelectedIds(allSelected ? new Set() : new Set(projects.map((project) => project.id)));
  }

  async function deleteSelected() {
    if (selectedProjects.length === 0) {
      return;
    }
    const names = selectedProjects.map((project) => project.name).join("、");
    const confirmed = window.confirm(`确定删除 ${selectedProjects.length} 个文章项目吗？\n\n${names}\n\n该操作会删除项目记录和本地项目文件，无法撤销。`);
    if (!confirmed) {
      return;
    }

    setError("");
    setDeleting(true);
    try {
      const response = await fetch("/api/projects/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectIds: Array.from(selectedIds) })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "删除项目失败");
      }
      setSelectedIds(new Set());
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="grid">
      <Card>
        <div className="manage-toolbar">
          <Button type="button" onClick={toggleAll} disabled={projects.length === 0 || isDeleting}>
            {allSelected ? <CheckSquare size={16} /> : <Square size={16} />}
            {allSelected ? "取消全选" : "全选"}
          </Button>
          <span className="page-subtitle">已选择 {selectedIds.size} / {projects.length} 个项目</span>
          <Button variant="danger" type="button" onClick={deleteSelected} disabled={selectedIds.size === 0 || isDeleting}>
            <Trash2 size={16} />
            {isDeleting ? "删除中..." : "删除所选"}
          </Button>
        </div>
      </Card>

      {error ? <div className="error">{error}</div> : null}

      {projects.length === 0 ? (
        <div className="empty">暂无可管理的文章项目。</div>
      ) : (
        <section className="grid manage-list">
          {projects.map((project) => {
            const checked = selectedIds.has(project.id);
            return (
              <label className={`manage-card ${checked ? "selected" : ""}`} key={project.id}>
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={isDeleting}
                  onChange={() => toggleProject(project.id)}
                />
                <span className="manage-card-body">
                  <span className="phase-row">
                    <strong>{project.name}</strong>
                    <Badge variant={getStatusVariant(project.status === "completed" ? "approved" : "waiting_review")}>
                      {project.status}
                    </Badge>
                  </span>
                  <span className="page-subtitle">{project.article_title || project.topic}</span>
                  <span className="meta-row">
                    <span>当前阶段</span>
                    <span>{phaseLabels[project.current_phase]}</span>
                  </span>
                  <span className="meta-row">
                    <span>更新</span>
                    <span>{new Date(project.updated_at).toLocaleString("zh-CN", { hour12: false })}</span>
                  </span>
                </span>
              </label>
            );
          })}
        </section>
      )}
    </div>
  );
}
