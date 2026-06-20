import ClusterForm from "@/components/ClusterForm";
import { getSharedFilesStatus } from "@/lib/sharedFiles";
import PageShell from "@/components/ui/PageShell";
import PageTitle from "@/components/ui/PageTitle";

export default function NewClusterPage() {
  const sharedFiles = getSharedFilesStatus();

  return (
    <PageShell>
      <PageTitle
        title="创建集群项目"
        subtitle="上传多篇文章 brief，系统自动解析文章列表、关键词和互链规则，一键创建集群写作项目。"
      />
      <ClusterForm sharedFiles={sharedFiles} />
    </PageShell>
  );
}
