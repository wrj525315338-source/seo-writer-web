"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface Phase5PollingProps {
  isProcessing: boolean;
}

/**
 * Phase 5 轮询组件：当 Phase 5 处于 processing 状态时，自动刷新页面
 */
export default function Phase5Polling({ isProcessing }: Phase5PollingProps) {
  const router = useRouter();

  useEffect(() => {
    if (!isProcessing) {
      return;
    }

    // 每 5 秒刷新一次页面
    const interval = setInterval(() => {
      router.refresh();
    }, 5000);

    // 组件卸载时清除定时器
    return () => {
      clearInterval(interval);
    };
  }, [isProcessing, router]);

  // 不渲染任何内容
  return null;
}
