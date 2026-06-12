# Multiple Essay Writing — P0-P11 修改报告

> 分支: `feature/multiple-essay-writing`
> 基准: `main` (a4cc10c)
> 总计: 5 次提交, 26 个文件变更, +4588 / -25 行

---

## 一、变更文件清单

### 新增文件（18 个）

| 文件 | 用途 |
|---|---|
| `docs/multi-essay-writing-design.md` | 方案 B 完整设计文档（871 行） |
| `seo-writer-web/lib/types.ts` (+118) | 集群类型：ClusterArticle, CrossLinkRule, ParsedCluster, ClusterState, WORD_COUNT_BY_TYPE |
| `seo-writer-web/lib/clusterParser.ts` | Brief 解析器：两层解析（正则 + LLM），支持 .md/.docx/.xlsx |
| `seo-writer-web/lib/clusterParser_prompts.md` | LLM 解析 prompt |
| `seo-writer-web/lib/clusterRunner.ts` | 集群编排：Phase 0/1b/批量审查/互链验证/进度查询 |
| `seo-writer-web/lib/clusterState.ts` | 集群状态管理：读写 JSON + DB 同步 |
| `seo-writer-web/app/api/clusters/route.ts` | POST /api/clusters — 创建集群 |
| `seo-writer-web/app/api/clusters/parse/route.ts` | POST /api/clusters/parse — 解析 brief |
| `seo-writer-web/app/api/clusters/[clusterId]/phase/route.ts` | 集群 Phase API：run/approve 所有阶段 |
| `seo-writer-web/app/clusters/new/page.tsx` | 集群创建页面 |
| `seo-writer-web/app/clusters/[clusterId]/page.tsx` | 集群详情页：dashboard/outlines/crosslink/articles/batch |
| `seo-writer-web/components/ClusterForm.tsx` | 集群创建表单：上传 → 解析 → 预览 → 创建 |
| `seo-writer-web/components/ClusterDashboard.tsx` | 集群总览面板：phase 进度 + 文章状态 + 运行按钮 |
| `seo-writer-web/components/OutlineReviewPanel.tsx` | 批量大纲审阅：4 篇大纲 tab 切换 + 全局/单篇意见 |
| `seo-writer-web/components/CrossLinkApprovalView.tsx` | 互链审阅：展示互链规划 + 批准按钮 |
| `seo-writer-web/components/ClusterArticleReview.tsx` | 文章审阅：逐篇查看最终文章 + 批量批准 |
| `seo-writer-web/components/BatchReviewView.tsx` | 批量确认：展示集群审查报告 + 确认按钮 |
| `skills/seo-article-writer/prompts/phase0_cluster_brief.md` | 集群级 Phase 0 prompt |
| `skills/seo-article-writer/prompts/phase1b_cross_link_refine.md` | Phase 1b 互链细化 prompt |

### 修改文件（7 个）

| 文件 | 变更 |
|---|---|
| `seo-writer-web/lib/db.ts` (+113) | 新增 clusters + cluster_articles 表 + CRUD 函数 |
| `seo-writer-web/lib/fileStorage.ts` (+43) | 新增集群存储：getClusterDir, ensureClusterDirs, saveClusterBrief |
| `seo-writer-web/lib/phaseRunner.ts` (+41/-14) | 字数动态化：getWordCountRange() 从 extraNotes 提取，替换硬编码 1200-1600 |
| `skills/seo-article-writer/scripts/generate_docx.py` (+121/-10) | 超链接支持：add_hyperlink(), --base-url, INTERNAL_LINK:slug 占位符 |

---

## 二、功能变更摘要

### 2.1 集群创建流程

- 用户上传 brief 文件（.md/.xlsx/.docx/.txt）+ 写作规范 + 示例文章
- 系统自动解析出文章列表、关键词、互链规则、品牌要求
- 预览解析结果后一键创建集群项目
- 为每篇文章创建独立的 project（复用现有单篇结构）
- 共享写作规范和示例文章通过 product template 机制复用

### 2.2 集群 Phase 流程

| 集群阶段 | 执行内容 | 审批类型 |
|---|---|---|
| cluster_phase0 | 共享材料阅读 + checklist + 互链规划草案 | 自动 |
| cluster_phase1 | 4 篇大纲生成 | **批量审阅（硬停）** |
| cluster_phase1b | 互链规划细化 | **互链审阅（硬停）** |
| cluster_phase2 | 4 篇各自前两节 | 自动 |
| cluster_phase3 | 4 篇各自全文 | 自动 |
| cluster_phase4 | 4 篇各自 checklist 审计 + 互链验证 | 自动 |
| cluster_phase5 | 4 篇各自 docx 生成 | **逐篇审阅（硬停）** |
| cluster_batch_confirm | 批量审查报告 | **批量确认（硬停）** |

### 2.3 超时应对

- Phase 3 长文（2500-3500 词）：设计文档建议分段写入（待 P6+ 实施）
- Phase 4：默认 chunked 模式，每个 chunk 独立超时（10 分钟），支持增量续跑
- Phase 1b：先本地提取链接建议段落，再调用 LLM（输入量 ~1000 词）
- 批量确认：摘要化处理，不读取 4 篇全文

### 2.4 docx 超链接

- `generate_docx.py` 新增 `add_hyperlink()` 函数，创建可点击的 Word 超链接
- 支持 `--base-url` 参数，将相对路径 `/slug` 拼接为完整 URL
- 支持 `[text](INTERNAL_LINK:slug)` 占位符格式
- 所有 markdown 链接（包括常规链接）都会转为 Word 超链接

### 2.5 字数动态化

- `phaseRunner.ts` 新增 `getWordCountRange(projectId)` 函数
- 从项目的 `extraNotes` 字段中提取 `Target Words: min-max`
- Phase 4 字数校验使用动态范围，不再硬编码 1200-1600

---

## 三、Codex 审阅修复记录

### 第一轮（P0-P3 后）— 9 个问题

| # | 级别 | 问题 | 修复 |
|---|---|---|---|
| P1-1 | P1 | 表单数据丢失 | parse 时保存 model config 到 state |
| P1-2 | P1 | 404 重定向 | 改为跳转 /projects（后修正为 /clusters/{id}） |
| P1-3 | P1 | 共享文件未保存 | parse API 处理 guideline/example 上传 |
| P1-4 | P1 | 路径错误 | scripts/run_prompt.py + prompt 复制到正确目录 |
| P1-5 | P1 | Phase 0 未标记完成 | 调用 approvePhaseInState |
| P1-6 | P1 | 字数范围未传递 | getWordCountRange + 动态范围 |
| P1-7 | P1 | 互链解析错误 | 解析 From → To 格式 |
| P2-8 | P2 | 二进制格式乱码 | extractTextFromBinary() |
| P2-9 | P2 | 临时文件泄漏 | parse 完成后清理 |

### 第二轮（P4-P5 后）— 10 个问题

| # | 级别 | 问题 | 修复 |
|---|---|---|---|
| P1-1 | P1 | Shell 注入 | execSync → execFileSync |
| P1-2 | P1 | Phase 1 输入缺失 | 写入 article_brief.md |
| P1-3 | P1 | 二进制格式解析 | 无 LLM 时抛出明确错误 + parse API 返回提取文本 |
| P1-4 | P1 | 二进制规范乱码 | extract_materials.py 提取后再构建 prompt |
| P1-5 | P1 | 无运行按钮 | Dashboard 新增运行按钮 |
| P1-6 | P1 | 互链审批 400 | CrossLinkApprovalView 用 fetch+JSON |
| P1-7 | P1 | 跳转错误 | 改为 /clusters/{id} |
| P2-8 | P2 | 二进制 brief 损坏 | 跳过 File.text()，用服务器端提取 |
| P2-9 | P2 | DB 状态不同步 | approveClusterPhase 同时更新 DB |
| P2-10 | P2 | 路径假设错误 | 用 getProjectDir/getOutputsDir |

---

## 四、未实施项目（设计文档中规划但未编码）

| 项目 | 原因 |
|---|---|
| Phase 3 分段写入 | 需要修改 phaseRunner.ts 的 Phase 3 逻辑，影响单篇模式。建议作为独立 PR |
| Phase 1/1b 审阅意见的"返回修改"功能 | OutlineReviewPanel 的 handleRevise 调用单篇 revise API，但集群级修订需要更复杂的协调 |
| 前端进度条细化 | 设计文档建议显示"第 N 篇文章，第 M 个 chunk"，但需要前端轮询机制改造 |
| Cluster list 页面 | 当前无 /clusters 列表页，只有 /clusters/new 和 /clusters/[id] |

---

## 五、构建验证

- `npm run build`: ✅ 通过
- TypeScript 类型检查: ✅ 通过
- 路由注册: ✅ /api/clusters, /api/clusters/parse, /api/clusters/[clusterId]/phase, /clusters/[clusterId], /clusters/new

---

## 六、建议后续步骤

1. **人工审阅**：确认集群创建 → Phase 0 → Phase 1 → Phase 1b 的端到端流程
2. **Phase 3 分段写入**：作为独立 PR 实施，避免影响单篇模式
3. **端到端测试**：用 seo文章.md 作为输入，跑完整集群流程
4. **Codex 审阅**：人工确认后调用第三轮审阅
