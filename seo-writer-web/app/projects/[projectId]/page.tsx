import { getProject, listPhaseRuns, listReviewComments } from "@/lib/db";
import { listOutputFiles, readPreviewForPhase } from "@/lib/fileStorage";
import { readImageGenerationRecoveryStatus } from "@/lib/imageGenerationStatus";
import { readImageReviewStatus } from "@/lib/imageReview";
import { readPhase6Status } from "@/lib/phase6Status";
import { readProjectState } from "@/lib/projectState";
import { decodeProjectId, encodeProjectId } from "@/lib/routeParams";
import { PhaseId } from "@/lib/types";
import { phases, phaseLabels, requiresManualReview } from "@/lib/validators";
import PhaseControlPanel from "@/components/PhaseControlPanel";
import MarkdownPreview from "@/components/MarkdownPreview";
import OutputFileList from "@/components/OutputFileList";
import ReviewCommentBox from "@/components/ReviewCommentBox";
import WorkflowAutoRunner from "@/components/WorkflowAutoRunner";
import ImageGenerationRecoveryPanel from "@/components/ImageGenerationRecoveryPanel";
import ImageReviewPanel from "@/components/ImageReviewPanel";
import Phase6StatusPanel from "@/components/Phase6StatusPanel";

interface ProjectDetailProps {
  params: Promise<{ projectId: string }>;
  searchParams?: Promise<{ phase?: string }>;
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function ProjectNotFound() {
  return (
    <main className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Project not found</h1>
          <p className="page-subtitle">请返回项目列表重新选择项目。</p>
        </div>
        <a className="button ghost" href="/projects">返回项目列表</a>
      </div>
    </main>
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

  return (
    <main className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{project.name}</h1>
          <p className="page-subtitle">{project.article_title || project.topic}</p>
        </div>
        <a className="button ghost" href="/projects">返回项目列表</a>
      </div>

      <section className="detail-layout">
        <aside className="grid">
          <div className="panel">
            <h2>项目信息</h2>
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
              <div className="notice">当前审查模型与写作/批改模型相同，审核独立性较弱。</div>
            ) : null}
            <div className="meta-row"><span>Checklist</span><span className={`status ${state.phases.phase4.status}`}>{state.phases.phase4.status}</span></div>
            <div className="meta-row"><span>状态</span><span>{project.status}</span></div>
          </div>

          <OutputFileList projectId={project.id} files={outputFiles} />

          <div className="panel">
            <h2>最近运行</h2>
            {phaseRuns.slice(0, 5).length === 0 ? (
              <p className="page-subtitle">暂无运行记录。</p>
            ) : (
              <div className="grid">
                {phaseRuns.slice(0, 5).map((run) => (
                  <div className="meta-row" key={run.id}>
                    <span>{run.phase}</span>
                    <span className={`status ${run.status}`}>{run.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        <section className="grid">
          <WorkflowAutoRunner projectId={project.id} state={state} projectStatus={project.status} />

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
              <div className="panel">
                <div className="phase-row">
                  <h2>输出预览：{phaseLabels[selectedPhase]}</h2>
                  <a className="button ghost" href={`/projects/${encodeProjectId(project.id)}?phase=${selectedPhase}`}>刷新</a>
                </div>
                <MarkdownPreview content={output} />
              </div>

              <ReviewCommentBox projectId={project.id} phase={selectedPhase} disabled={!output} />
            </>
          ) : (
            <div className="panel">
              <h2>阶段状态：{phaseLabels[selectedPhase]}</h2>
              <p className="page-subtitle">该阶段运行成功后自动通过，不展示中间输出。请查看 Phase 1 大纲或 Phase 5 最终文件预览。</p>
            </div>
          )}

          <div className="panel">
            <h2>人工修改记录</h2>
            {reviewComments.length === 0 ? (
              <p className="page-subtitle">暂无修改意见。</p>
            ) : (
              <div className="grid">
                {reviewComments.slice(0, 6).map((comment) => (
                  <div className="notice" key={comment.id}>
                    <strong>{comment.phase}</strong>
                    <p>{comment.comment}</p>
                    <small>{new Date(comment.created_at).toLocaleString()}</small>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
