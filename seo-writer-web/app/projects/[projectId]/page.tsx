import { getProject, getClusterForProject, listPhaseRuns, listReviewComments } from "@/lib/db";
import { listOutputFiles, readPreviewForPhase } from "@/lib/fileStorage";
import Link from "next/link";
import { readImageGenerationRecoveryStatus } from "@/lib/imageGenerationStatus";
import { readImageReviewStatus } from "@/lib/imageReview";
import { readPhase6Status } from "@/lib/phase6Status";
import { readProjectState } from "@/lib/projectState";
import { decodeProjectId, encodeProjectId } from "@/lib/routeParams";
import { PhaseId } from "@/lib/types";
import { phases, phaseLabels, requiresManualReview } from "@/lib/validators";
import PageShell from "@/components/ui/PageShell";
import PageTitle from "@/components/ui/PageTitle";
import Card from "@/components/ui/Card";
import Badge, { getStatusVariant } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import PhaseControlPanel from "@/components/PhaseControlPanel";
import MarkdownPreview from "@/components/MarkdownPreview";
import OutputFileList from "@/components/OutputFileList";
import ReviewCommentBox from "@/components/ReviewCommentBox";
import WorkflowAutoRunner from "@/components/WorkflowAutoRunner";
import AuditorModelEditor from "@/components/AuditorModelEditor";
import ImageGenerationRecoveryPanel from "@/components/ImageGenerationRecoveryPanel";
import ImageReviewPanel from "@/components/ImageReviewPanel";
import Phase6StatusPanel from "@/components/Phase6StatusPanel";
import Phase55StatusPanel from "@/components/Phase55StatusPanel";
import Phase5Polling from "@/components/Phase5Polling";

interface ProjectDetailProps {
  params: Promise<{ projectId: string }>;
  searchParams?: Promise<{ phase?: string }>;
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function ProjectNotFound() {
  return (
    <PageShell>
      <PageTitle
        title="Project not found"
        subtitle="请返回项目列表重新选择项目。"
        actions={
          <a className="btn btn-ghost" href="/projects">返回项目列表</a>
        }
      />
    </PageShell>
  );
}

export default async function ProjectDetailPage({ params, searchParams }: ProjectDetailProps) {
  const { projectId: routeProjectId } = await params;
  const projectId = decodeProjectId(routeProjectId);
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const project = getProject(projectId);
  if (!project) {
    return <ProjectNotFound />;
  }

  const state = readProjectState(project.id);
  const cluster = getClusterForProject(project.id);
  const selectedPhase = phases.includes(resolvedSearchParams.phase as PhaseId)
    ? (resolvedSearchParams.phase as PhaseId)
    : state.currentPhase;
  const canPreviewPhase = requiresManualReview(selectedPhase);
  const output = canPreviewPhase ? readPreviewForPhase(project.id, selectedPhase) : "";
  const outputFiles = listOutputFiles(project.id);
  const phaseRuns = listPhaseRuns(project.id);
  const reviewComments = listReviewComments(project.id);
  const imageGenerationRecoveryStatus = readImageGenerationRecoveryStatus(project.id, Number(project.image_count_default || 0));
  const phase6Status = readPhase6Status(project, state);
  const imageReviewStatus = readImageReviewStatus(project.id);
  const imageGenerationProjectConfig = {
    image_provider: project.image_provider,
    image_model_display_name: project.image_model_display_name,
    image_model_name: project.image_model_name,
    image_model_id: project.image_model_id,
    image_endpoint_id: project.image_endpoint_id,
    image_use_endpoint_id: project.image_use_endpoint_id
  };
  const imageModelLabel = project.image_model_display_name || project.image_model_name || project.image_model_id || "未设置";
  const imageGenerationEnabled = Boolean(Number(project.enable_image_generation));
  const isPhase5Processing = state.phases.phase5?.status === "processing";

  return (
    <PageShell>
      <Phase5Polling isProcessing={isPhase5Processing} />
      <PageTitle
        title={project.name}
        subtitle={project.article_title || project.topic}
        actions={
          <a className="btn btn-ghost" href="/projects">返回项目列表</a>
        }
      />

      {cluster && (
        <div style={{
          marginBottom: "1rem",
          padding: "0.5rem 0.75rem",
          background: "var(--color-info-bg)",
          border: "1px solid var(--color-info-text)",
          borderRadius: "var(--radius-sm)",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          fontSize: "0.9rem",
        }}>
          <Link
            href={`/clusters/${cluster.id}`}
            style={{
              color: "var(--color-brand)",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            ← 返回集群: {cluster.name}
          </Link>
        </div>
      )}

      <section className="detail-layout">
        <aside className="grid">
          <Card title="项目信息">
            <div className="meta-row"><span>当前 Phase</span><strong>{phaseLabels[state.currentPhase]}</strong></div>
            <div className="meta-row">
              <span>写作/批改模型</span>
              <span>{project.writing_provider || project.provider} / {project.writing_model_name || project.model_name}</span>
            </div>
            <div className="meta-row">
              <span>审查模型</span>
              <span>{project.auditor_provider || project.writing_provider || project.provider} / {project.auditor_model_name || project.writing_model_name || project.model_name}</span>
            </div>
            <div className="meta-row">
              <span>生图模型</span>
              <span>
                {project.image_provider} / {imageModelLabel}
                {imageGenerationEnabled ? "" : "（已关闭）"}
              </span>
            </div>
            {(project.auditor_provider || project.writing_provider || project.provider) === (project.writing_provider || project.provider) &&
            (project.auditor_model_name || project.writing_model_name || project.model_name) === (project.writing_model_name || project.model_name) ? (
              <div className="notice">
                <span>当前审查模型与写作/批改模型相同，审核独立性较弱。</span>
                <AuditorModelEditor
                  projectId={project.id}
                  currentProvider={project.auditor_provider || project.writing_provider || project.provider}
                  currentModelName={project.auditor_model_name || project.writing_model_name || project.model_name}
                  currentBaseUrl={project.auditor_base_url || project.writing_base_url || project.base_url}
                  currentTemperature={project.auditor_temperature ?? 0.2}
                />
              </div>
            ) : null}
            <div className="meta-row">
              <span>Checklist</span>
              <Badge variant={getStatusVariant(state.phases.phase4.status)}>{state.phases.phase4.status}</Badge>
            </div>
            <div className="meta-row"><span>状态</span><span>{project.status}</span></div>
          </Card>

          <OutputFileList projectId={project.id} files={outputFiles} />

          <Card title="最近运行">
            {phaseRuns.slice(0, 5).length === 0 ? (
              <p className="page-subtitle">暂无运行记录。</p>
            ) : (
              <div className="grid">
                {phaseRuns.slice(0, 5).map((run) => (
                  <div className="meta-row" key={run.id}>
                    <span>{run.phase}</span>
                    <Badge variant={getStatusVariant(run.status)}>{run.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </aside>

        <section className="grid">
          <WorkflowAutoRunner projectId={project.id} state={state} projectStatus={project.status} />

          <Phase55StatusPanel
            projectId={project.id}
            imagePlanningMode={project.image_planning_mode ?? "auto"}
            imageCount={Number(project.image_count_default || 3)}
            isCompleted={state.phases.phase5?.status === "approved"}
            isProcessing={isPhase5Processing}
          />

          <Phase6StatusPanel projectId={project.id} status={phase6Status} />

          <ImageReviewPanel projectId={project.id} status={imageReviewStatus} />

          <ImageGenerationRecoveryPanel
            projectId={project.id}
            project={imageGenerationProjectConfig}
            status={imageGenerationRecoveryStatus}
          />

          <PhaseControlPanel projectId={project.id} state={state} selectedPhase={selectedPhase} />

          {canPreviewPhase ? (
            <>
              <Card>
                <div className="phase-row">
                  <h2>输出预览：{phaseLabels[selectedPhase]}</h2>
                  <a className="btn btn-ghost" href={`/projects/${encodeProjectId(project.id)}?phase=${selectedPhase}`}>刷新</a>
                </div>
                <MarkdownPreview content={output} />
              </Card>

              <ReviewCommentBox projectId={project.id} phase={selectedPhase} disabled={!output} />
            </>
          ) : (
            <Card title={`阶段状态：${phaseLabels[selectedPhase]}`}>
              <p className="page-subtitle">该阶段运行成功后自动通过，不展示中间输出。请查看 Phase 1 大纲或 Phase 5 最终文件预览。</p>
            </Card>
          )}

          <Card title="人工修改记录">
            {reviewComments.length === 0 ? (
              <p className="page-subtitle">暂无修改意见。</p>
            ) : (
              <div className="grid">
                {reviewComments.slice(0, 6).map((comment) => (
                  <div className="feedback-note" key={comment.id}>
                    <strong>{comment.phase}</strong>
                    <p style={{ margin: "4px 0" }}>{comment.comment}</p>
                    <small>{new Date(comment.created_at).toLocaleString()}</small>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </section>
      </section>
    </PageShell>
  );
}
