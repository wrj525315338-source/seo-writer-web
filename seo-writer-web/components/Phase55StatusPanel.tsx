"use client";

import { useState } from "react";

interface Phase55StatusPanelProps {
  projectId: string;
  imagePlanningMode: string;
  imageCount: number;
  isCompleted: boolean;
  onViewSlotsArticle?: () => void;
  onRefresh?: () => void;
}

export default function Phase55StatusPanel({
  projectId,
  imagePlanningMode,
  imageCount,
  isCompleted,
  onViewSlotsArticle,
  onRefresh
}: Phase55StatusPanelProps) {
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPlaceholderOnly = imagePlanningMode === "placeholder_only";
  const isAuto = imagePlanningMode === "auto";

  const handleUpgrade = async () => {
    if (!confirm("确认要生成完整的图片规划吗？\n\n这将调用 AI 生成图片描述和 Prompt，预计消耗 2000-3000 Token。")) {
      return;
    }

    setIsUpgrading(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/upgrade-phase55`, {
        method: "POST"
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "升级失败");
      }

      // Refresh page or update state
      if (onRefresh) {
        onRefresh();
      } else {
        window.location.reload();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "升级失败，请重试");
    } finally {
      setIsUpgrading(false);
    }
  };

  if (!isCompleted) {
    return null;
  }

  return (
    <div className="phase55-status-panel">
      <h3 className="panel-title">Phase 5.5 图片规划</h3>

      <div className="status-grid">
        <div className="status-item">
          <span className="status-label">状态</span>
          <span className="status-value">
            <span className="badge badge-success">✅ 已完成</span>
          </span>
        </div>

        <div className="status-item">
          <span className="status-label">模式</span>
          <span className="status-value">
            {isAuto ? (
              <span className="badge badge-info">自动</span>
            ) : isPlaceholderOnly ? (
              <span className="badge badge-warning">仅占位符</span>
            ) : (
              <span className="badge badge-primary">完整规划</span>
            )}
          </span>
        </div>

        <div className="status-item">
          <span className="status-label">图片数量</span>
          <span className="status-value">{imageCount}</span>
        </div>
      </div>

      {isPlaceholderOnly && (
        <div className="info-box info-box-warning">
          <p>
            ⚠️ 当前为仅占位符模式，<code>image_plan.json</code> 中不包含图片描述和 Prompt。
            <br />
            如需生图，请先点击【补充完整规划】按钮。
          </p>
        </div>
      )}

      {error && (
        <div className="error-box">
          <p>❌ {error}</p>
        </div>
      )}

      <div className="action-buttons">
        {onViewSlotsArticle && (
          <button
            className="btn btn-secondary"
            onClick={onViewSlotsArticle}
          >
            📄 查看占位符文章
          </button>
        )}

        {isPlaceholderOnly && (
          <button
            className="btn btn-primary"
            onClick={handleUpgrade}
            disabled={isUpgrading}
          >
            {isUpgrading ? (
              <>
                <span className="spinner"></span>
                正在生成完整规划...
              </>
            ) : (
              <>🚀 补充完整规划</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
