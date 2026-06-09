import ProjectForm from "@/components/ProjectForm";
import { getSharedFilesStatus } from "@/lib/sharedFiles";

export default function NewProjectPage() {
  const sharedFiles = getSharedFilesStatus();

  return (
    <main className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">新建文章项目</h1>
          <p className="page-subtitle">复用长期参考文件，填写本次选题要求，再进入分阶段写作流程。</p>
        </div>
      </div>
      <ProjectForm sharedFiles={sharedFiles} />
    </main>
  );
}
