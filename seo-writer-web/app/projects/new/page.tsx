import ProjectForm from "@/components/ProjectForm";
import { getSharedFilesStatus } from "@/lib/sharedFiles";
import PageShell from "@/components/ui/PageShell";
import PageTitle from "@/components/ui/PageTitle";

export default function NewProjectPage() {
  const sharedFiles = getSharedFilesStatus();

  return (
    <PageShell>
      <PageTitle
        title="新建文章项目"
        subtitle="复用长期参考文件，填写本次选题要求，再进入分阶段写作流程。"
      >
        <p className="help">需要一次写多篇互相关联的文章？<a href="/clusters/new">使用集群模式 →</a></p>
      </PageTitle>
      <ProjectForm sharedFiles={sharedFiles} />
    </PageShell>
  );
}
