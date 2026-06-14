import ClusterForm from "@/components/ClusterForm";
import { getSharedFilesStatus } from "@/lib/sharedFiles";

export default function NewClusterPage() {
  const sharedFiles = getSharedFilesStatus();

  return (
    <main className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">创建集群项目</h1>
          <p className="page-subtitle">
            上传多篇文章 brief，系统自动解析文章列表、关键词和互链规则，一键创建集群写作项目。
          </p>
        </div>
      </div>
      <ClusterForm sharedFiles={sharedFiles} />
    </main>
  );
}
