# Multiple Essay Writing — 方案 B 完整设计文档

> 分支: `feature/multiple-essay-writing`
> 创建日期: 2026-06-12
> 状态: 设计阶段

---

## 一、背景与目标

### 1.1 问题

当前 SEO 写作流水线是**单篇文章**模式：一个 project 对应一篇文章，独立跑 Phase 0-5。但新的写作需求（如 D6 Cross-Cultural Friendships）要求**一次写 4 篇互相关联的文章**，需要：

- 共享品牌材料和写作规范
- 文章之间按 hub-and-spoke 模型互链（每篇 3-5 条内链，至少 1 条指向 Pillar）
- 按文章类型使用不同的字数范围（Pillar 2500-3500 词，Support 2000-2800 词）
- 批量审阅和互链验证

### 1.2 目标

在现有单篇 pipeline 之上增加一层**集群编排层**，实现：

1. 上传 brief 文件后自动解析出文章列表、关键词、互链规则
2. 共享 Phase 0 材料，每篇文章独立跑 Phase 1-5
3. 新增 Phase 1b 专门处理互链规划
4. 人工审阅支持批量大纲审阅 + 逐篇正文审阅 + 批量确认
5. 最终 Word 文档中包含可点击的互链
6. 超时风险可控

### 1.3 设计原则

- **不修改现有单篇 pipeline**：集群模式是包在外面的一层，单篇文章创建和运行完全保留
- **共享可共享的**：Phase 0 材料、checklist、品牌模板跨文章复用
- **独立跑各篇文章**：Phase 2-5 每篇文章独立执行，互不阻塞
- **在关键节点增加集群级协调**：Phase 0（共享材料）、Phase 1b（互链规划）、Phase 5 后（批量确认）

---

## 二、整体流程

```
上传 brief + 写作规范 + 示例文章
        │
        ▼
┌─────────────────────┐
│  智能解析 Brief      │  ← clusterParser.ts（本地提取 + LLM 语义理解）
│  预览解析结果         │
│  用户确认 → 创建集群  │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Phase 0 (集群级)    │  ← 共享材料阅读 + 共享 checklist + 互链规划草案
│  自动生成，无需审批   │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Phase 1 (per-article)│  ← 4 篇大纲并行生成
│  人工审阅: 批量看 4 篇 │  ← 【硬停】同时展示 4 篇大纲 + 互链规划草案
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Phase 1b (集群级)   │  ← 基于已批准大纲细化互链方案
│  人工审阅: 互链规划表  │  ← 【硬停】审阅互链表（5 分钟可完成）
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Phase 2 (per-article)│  ← 4 篇各自：写作模型草稿 + 审计模型润色
│  自动审批              │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Phase 3 (per-article)│  ← 4 篇各自写全文（长文分段写入）
│  自动审批              │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Phase 4 (per-article)│  ← 4 篇各自 checklist 审计（默认 chunked 模式）
│  + 互链验证            │  ← 验证每篇文章是否包含规定的互链
│  自动审批              │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Phase 5 (per-article)│  ← 逐篇生成 docx，逐篇人工审阅
│  人工审阅: 逐篇审阅    │  ← 【硬停】每次看 1 篇（2000-3500 词）
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  批量确认             │  ← 4 篇全部批准后：互链验证 + 内容去重检查
│  人工审阅: 批量确认    │  ← 【硬停】展示集群级审查报告
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Phase 5.5 + 6       │  ← 4 篇各自：图片规划 + 图片生成
│  (per-article)       │
└─────────────────────┘
```

---

## 三、目录结构

### 3.1 存储目录

```
storage/
├── clusters/
│   └── <cluster_slug>/
│       ├── cluster_state.json                  # 集群级状态
│       ├── cluster_brief.md                    # 上传的原始 brief
│       ├── 00_shared_material_summary.md       # 共享材料摘要
│       ├── 00_shared_writing_checklist.md      # 共享 checklist
│       ├── 00_cross_link_plan.md               # 互链规划表
│       └── articles/
│           ├── article-1-meet-friends-online/  # 文章 1 独立目录
│           │   ├── project_state.json
│           │   ├── inputs/
│           │   └── outputs/
│           │       ├── 01_outline.md
│           │       ├── 02_first_two_sections.md
│           │       ├── 03_full_article.md
│           │       ├── 04_checklist_report.md
│           │       └── final_article_for_google_docs.docx
│           ├── article-2-best-apps-international/
│           ├── article-3-talk-to-native-speakers/
│           └── article-4-talk-like-native-speaker/
├── shared/                  # 已有：共享写作规范和示例文章
├── projects/                # 已有：单篇文章项目
└── products/                # 已有：品牌模板缓存
```

### 3.2 代码目录

```
seo-writer-web/
├── lib/
│   ├── clusterParser.ts          # 【新增】Brief 解析核心逻辑
│   ├── clusterParser_prompts.md  # 【新增】LLM 解析 prompt
│   ├── clusterRunner.ts          # 【新增】集群编排逻辑
│   ├── crossLinkValidator.ts     # 【新增】互链验证逻辑
│   ├── types.ts                  # 【修改】新增集群相关类型
│   ├── db.ts                     # 【修改】新增 clusters / cluster_articles 表
│   ├── phaseRunner.ts            # 【修改】字数动态化、Phase 3 分段、Phase 4 默认 chunked
│   └── codexClient.ts            # 【修改】超时动态化
├── app/
│   ├── clusters/
│   │   ├── new/page.tsx          # 【新增】集群创建页面
│   │   └── [clusterId]/
│   │       └── page.tsx          # 【新增】集群详情页面
│   └── api/
│       └── clusters/
│           ├── route.ts          # 【新增】集群创建 API
│           ├── parse/route.ts    # 【新增】Brief 解析 API
│           └── [clusterId]/
│               └── phase/route.ts # 【新增】集群 Phase 执行 API
├── components/
│   ├── ClusterForm.tsx           # 【新增】集群创建表单
│   ├── ClusterPreview.tsx        # 【新增】解析结果预览
│   ├── ClusterDashboard.tsx      # 【新增】集群总览面板
│   ├── OutlineReviewPanel.tsx    # 【新增】批量大纲审阅
│   ├── CrossLinkReviewPanel.tsx  # 【新增】互链审阅
│   └── BatchConfirmPanel.tsx     # 【新增】批量确认面板
└── skills/
    └── seo-article-writer/
        ├── scripts/
        │   └── generate_docx.py  # 【修改】支持超链接 + base_url
        └── prompts/
            ├── phase0_cluster_brief.md        # 【新增】集群级 Phase 0 prompt
            ├── phase1b_cross_link_refine.md   # 【新增】互链细化 prompt
            ├── phase1_outline.md              # 【修改】增加互链约束输入
            ├── phase3_full_article.md         # 【修改】增加互链插入指令
            └── phase4_checklist.md            # 【修改】增加互链检查项
```

---

## 四、类型定义（types.ts 新增）

```typescript
// ============ 集群相关类型 ============

/** 文章角色 */
type ArticleRole = "pillar" | "support_a" | "support_b" | "support_c";

/** 文章类型（决定字数范围） */
type ArticleType = "guide" | "app_list" | "how_to";

/** 集群文章定义 */
interface ClusterArticle {
  slug: string;                    // URL slug
  title: string;                   // 文章标题
  role: ArticleRole;
  primaryKeyword: string;
  secondaryKeywords: string[];
  targetWordCount: { min: number; max: number };
  articleType: ArticleType;
  searchIntent?: string;
}

/** 互链规则 */
interface CrossLinkRule {
  sourceSlug: string;              // 链接来源文章
  targetSlug: string;              // 链接目标文章
  anchorText: string;              // 锚文本
  placementHint: string;           // 放置位置建议
  direction: "bidirectional" | "unidirectional";
}

/** 集群解析结果 */
interface ParsedCluster {
  clusterName: string;
  brandName: string;
  language: string;
  articles: ClusterArticle[];
  crossLinkRules: CrossLinkRule[];
  specialRequirements: SpecialRequirements;
  sourceType: "markdown" | "excel" | "docx" | "text";
}

/** 特殊要求 */
interface SpecialRequirements {
  bannedCompetitors: string[];
  brandData: string[];
  requiredModules: string[];
  collisionWarnings: string[];
  antiAiRules: string[];
}

/** 集群状态 */
interface ClusterState {
  clusterId: string;
  clusterName: string;
  clusterSlug: string;
  articles: ClusterArticle[];
  crossLinkRules: CrossLinkRule[];
  sharedChecklistPath: string;
  sharedSummaryPath: string;
  crossLinkPlanPath: string;
  currentPhase: ClusterPhaseId;
  articleStates: Record<string, ProjectState>; // slug -> 单篇状态
  crossLinkReviewStatus: "pending" | "approved" | "needs_revision";
  batchReviewStatus: "pending" | "approved" | "needs_revision";
  phases: Record<ClusterPhaseId, PhaseState>;
}

/** 集群阶段 ID */
type ClusterPhaseId =
  | "cluster_phase0"     // 共享材料 + checklist
  | "cluster_phase1"     // per-article 大纲
  | "cluster_phase1b"    // 互链规划
  | "cluster_phase2"     // per-article 前两节
  | "cluster_phase3"     // per-article 全文
  | "cluster_phase4"     // per-article checklist + 互链验证
  | "cluster_phase5"     // per-article docx
  | "cluster_batch_confirm"; // 批量确认

/** 文章类型对应的字数范围 */
const WORD_COUNT_BY_TYPE: Record<ArticleType, { min: number; max: number }> = {
  guide: { min: 2500, max: 3500 },
  app_list: { min: 2000, max: 2500 },
  how_to: { min: 2000, max: 2800 },
};
```

---

## 五、数据库新增表（db.ts）

```sql
CREATE TABLE IF NOT EXISTS clusters (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand_name TEXT DEFAULT '',
  language TEXT DEFAULT 'English',
  brief_source_path TEXT DEFAULT '',
  shared_summary_path TEXT DEFAULT '',
  shared_checklist_path TEXT DEFAULT '',
  cross_link_plan_path TEXT DEFAULT '',
  current_phase TEXT DEFAULT 'cluster_phase0',
  status TEXT DEFAULT 'active',
  blog_base_url TEXT DEFAULT 'https://www.hellotalk.com/en/blog',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cluster_articles (
  id TEXT PRIMARY KEY,
  cluster_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  article_role TEXT NOT NULL,
  article_slug TEXT NOT NULL,
  article_type TEXT DEFAULT 'guide',
  target_word_min INTEGER DEFAULT 2000,
  target_word_max INTEGER DEFAULT 3500,
  sort_order INTEGER DEFAULT 0,
  FOREIGN KEY (cluster_id) REFERENCES clusters(id),
  FOREIGN KEY (project_id) REFERENCES projects(id)
);
```

---

## 六、项目创建流程

### 6.1 智能解析 Brief

用户上传 brief 文件（.md / .xlsx / .docx / .txt）后，系统调用 `clusterParser.ts` 进行两层解析：

#### 第一层：本地格式提取（不调用模型）

```
输入: brief 文件文本
处理:
  - markdown: 正则提取表格中的文章定义、互链表格、品牌数据
  - excel: xlsx 库读取行列结构
  - docx/txt: 提取纯文本后走 markdown 类似逻辑
输出: 部分结构化数据（文章列表、关键词、slug）
```

#### 第二层：LLM 语义理解（一次调用，超时风险极低）

```
输入: brief 全文（~2000 字）+ clusterParser_prompts.md
输出: JSON 结构化数据
  - 文章类型推断（guide / app_list / how_to）
  - 特殊要求提取（竞品禁令、品牌数据、必须模块）
  - 搜索意图推断
  - 互链规则提取（如果第一层未完全提取）
```

### 6.2 预览确认

解析结果以表格形式展示：

| 列 | 内容 |
|---|---|
| 文章列表 | 角色、标题、关键词、slug、类型、字数范围 |
| 互链规则 | 源→目标、锚文本、方向 |
| 特殊要求 | 竞品禁令、品牌数据、必须模块、冲突警告 |
| 材料状态 | 写作规范（复用/新上传）、示例文章（复用/新上传） |

用户可以：
- 修改解析结果（调整文章角色、关键词、字数范围）
- 删除/添加互链规则
- 确认后一键创建集群项目

### 6.3 创建集群

`POST /api/clusters` 执行：

1. 在 `clusters` 表插入集群记录
2. 为每篇文章在 `projects` 表插入记录（复用现有的 project 结构）
3. 在 `cluster_articles` 表建立关联
4. 创建集群目录结构（`storage/clusters/<slug>/`）
5. 复制共享文件（写作规范、示例文章）到集群 inputs 目录
6. 写入 `cluster_state.json`
7. 写入 `00_cross_link_plan.md`（初始版本）

---

## 七、各 Phase 详细设计

### 7.1 Cluster Phase 0 — 共享材料阅读 + Checklist

**输入：**
- 集群 brief（`cluster_brief.md`）
- 写作规范（共享）
- 示例文章（共享）
- `language_content_requirements.md`

**处理：**
1. 提取共享的写作规范规则（和单篇 Phase 0 相同）
2. 生成 `00_shared_material_summary.md`（包含品牌信息、规则、示例模式）
3. 生成 `00_shared_writing_checklist.md`（字数项标记为"按文章类型"而非固定值）
4. 生成 `00_cross_link_plan.md`（初始版本，基于 brief 中的互链表格）

**Checklist 修改点：**
- `C05-02` 字数项改为：`"最终可见正文符合该文章类型的字数范围（见 cross_link_plan.md 中的 targetWordCount）"`
- 新增 `C06 Cross-Link Requirements` 分类：
  - `C06-01`: 每篇文章包含 3-5 条内部链接
  - `C06-02`: 每篇文章至少 1 条链接指向 Pillar
  - `C06-03`: 锚文本符合互链规划
  - `C06-04`: 互链自然融入正文，不破坏阅读体验

**输出：**
- `00_shared_material_summary.md`
- `00_shared_writing_checklist.md`
- `00_cross_link_plan.md`

**超时风险：** 低。和单篇 Phase 0 相同。

---

### 7.2 Cluster Phase 1 — Per-Article 大纲

**对每篇文章独立调用 Phase 1（修改后的 prompt）：**

**输入变更：**
- 新增 `00_cross_link_plan.md` 作为输入
- 字数范围从文章配置读取（非硬编码 1200-1600）

**Prompt 修改（phase1_outline.md）：**
- 增加要求：outline 的"链接建议"部分必须列出该文章需要包含的所有互链
- 每条互链标注目标 slug、锚文本、建议放置章节
- 字数预算按文章类型设定

**输出：**
- 每篇文章的 `01_outline.md`

**超时风险：** 低。每篇 outline 独立调用，输入输出量和现在差不多。

**人工审阅：【硬停】批量看 4 篇大纲**

```
┌─────────────────────────────────────────────────────────┐
│  Cluster: D6 Cross-Cultural Friendships                 │
├───────────┬───────────┬───────────┬─────────────────────┤
│  Pillar   │ Support A │ Support B │ Support C           │
│  大纲内容  │ 大纲内容   │ 大纲内容   │ 大纲内容            │
├───────────┴───────────┴───────────┴─────────────────────┤
│  Cross-Link Plan (互链规划草案)                           │
│  [Pillar → A] anchor text, 位置: H2-2                   │
│  [A → Pillar] anchor text, 位置: H2-4                   │
│  ...                                                    │
├─────────────────────────────────────────────────────────┤
│  意见输入框                                              │
│  ○ 全局意见（影响所有文章）                                │
│  ○ 单篇意见 → 选择文章: [Pillar ▾]                       │
└─────────────────────────────────────────────────────────┘
```

用户提意见时可选：
- **全局意见**：如"所有文章的 FAQ 不要超过 4 题"→ 系统同时更新 4 篇大纲
- **单篇意见**：如"Pillar 的 H2-2 太宽泛"→ 只修改这一篇

---

### 7.3 Cluster Phase 1b — 互链细化（新增阶段）

**输入：**
- 4 篇已批准的 `01_outline.md`
- `00_cross_link_plan.md`（初始版本）

**处理：**

为降低超时风险，分两步执行：

**Step 1（本地，不调用模型）：**
- 从每篇 outline 中提取"链接建议"段落
- 拼接为一个精简输入（~1000 词），而非 4 篇全文

**Step 2（调用 LLM）：**
- 输入：4 篇 outline 的链接建议段落 + 互链规则表 + `phase1b_cross_link_refine.md`
- 输出：更新后的 `00_cross_link_plan.md`，包含：
  - 每条互链的精确插入位置（哪个 H2 下、哪段之后）
  - 确定的锚文本（使用关键词变体，避免相同锚文本）
  - 每篇文章的互链数量统计

**输出：**
- 更新后的 `00_cross_link_plan.md`

**超时风险：** 低。输入量约 1000 词，远低于当前 Phase 3 的输入量。

**人工审阅：【硬停】互链规划表**

```
┌─────────────────────────────────────────────────────────┐
│  Cross-Link Plan — 互链规划                              │
│                                                         │
│  文章                │ 互链数 │ 链接详情                  │
│  Pillar              │ 4     │ → A (H2-2), → B (H2-3),  │
│                      │       │ → C (H2-4), A→ 回链(H2-1)│
│  Support A           │ 3     │ → Pillar (H2-1),         │
│                      │       │ → C (FAQ), Pillar回链    │
│  Support B           │ 3     │ → Pillar (H2-2),         │
│                      │       │ → A (H2-3), Pillar回链   │
│  Support C           │ 3     │ → Pillar (H2-1),         │
│                      │       │ → A (H2-2), Pillar回链   │
│                                                         │
│  [删除互链] [调整锚文本] [批准全部 →]                      │
└─────────────────────────────────────────────────────────┘
```

---

### 7.4 Cluster Phase 2 — Per-Article 前两节

**每篇文章独立执行，和单篇 Phase 2 完全相同：**
- 写作模型草稿 → 审计模型润色
- 输出 `02_first_two_sections.md`

**超时风险：** 无变化。每篇独立调用，输入输出量和现在一样。

**人工审阅：** 自动审批。

---

### 7.5 Cluster Phase 3 — Per-Article 全文

**关键修改：长文分段写入**

当前 Phase 3 一次生成全文（1200-1600 词）。对于 2500-3500 词的长文章，改为分两段写入：

**Step 1：写前半部分**
- 输入：outline + 互链规划 + style sample
- 输出：H1 + 前 2-3 个 H2（约 1200-1800 词）
- 超时：10 分钟，足够

**Step 2：写后半部分**
- 输入：outline + 互链规划 + 前半部分
- 输出：剩余 H2 + FAQ + 结尾（约 1000-1700 词）
- 超时：10 分钟，足够

**合并：** 将两段拼接为 `03_full_article.md`

**Prompt 修改（phase3_full_article.md）：**
- 增加互链插入指令：在规定位置插入 `[INTERNAL_LINK:target-slug]` 占位符
- 占位符格式：`[anchor text](INTERNAL_LINK:target-slug)`
- 字数范围从项目配置读取

**超时风险：** 中→低。分段后每次输出量约 1500-1800 词，可控。

**人工审阅：** 自动审批。

---

### 7.6 Cluster Phase 4 — Per-Article Checklist + 互链验证

**关键修改：默认 chunked 模式 + 互链验证**

**Phase 4 审计：**
- 默认使用 `runPhase4Chunked`（不提供非 chunked 选项）
- 2000-3500 词文章 → 4-5 个 chunk
- 每个 chunk 独立审计，10 分钟超时
- 支持增量续跑（`canReusePhase4ChunkReport`）

**互链验证（新增）：**
在 Phase 4 审计完成后，调用 `crossLinkValidator.ts`：
- 检查每条规定的互链是否出现在文章中
- 检查锚文本是否符合规划
- 检查互链数量是否满足 3-5 条
- 检查是否至少 1 条指向 Pillar
- 将验证结果写入 `04_checklist_report.md` 的 `C06` 部分

**Prompt 修改（phase4_checklist.md）：**
- 新增 C06 检查项（来自 7.1 的 checklist 修改）
- 审计模型在 chunk 审计时同步检查该 chunk 内的互链

**超时风险：** 中。每篇文章 4-5 个 chunk，4 篇文章 = 16-20 次串行调用。但每个 chunk 独立超时（10 分钟），失败只影响单个 chunk，可单独重跑。

**人工审阅：** 自动审批。但 Phase 4 完成后在 UI 上显示互链验证结果。

---

### 7.7 Cluster Phase 5 — Per-Article 最终交付

**每篇文章独立执行：**
- 生成 `final_article_for_google_docs.docx`
- **关键修改：docx 中的链接变为可点击超链接**（见第八章）

**超时风险：** 无变化。

**人工审阅：【硬停】逐篇审阅**

每次展示 1 篇文章（2000-3500 词），用户逐篇审阅：

```
文章 1/4: Pillar — How to Meet International Friends Online
[文章内容预览]
[修改意见输入框]
[批准] [修改]

文章 2/4: Support A — Best Apps for Meeting International Friends
...
```

---

### 7.8 批量确认（新增阶段）

**4 篇文章全部批准后，进入批量确认：**

**处理：**
1. 本地提取每篇的 checklist 报告摘要（不调用模型）
2. 本地运行互链验证（检查所有互链是否到位）
3. 本地运行内容去重检查（检查 4 篇文章是否有大段重复）
4. 调用 LLM 生成集群级审查报告（输入：摘要 + 互链结果 + 去重结果，~1500 词）

**输出：**
- `cluster_batch_review.md`

**超时风险：** 低。输入量被摘要化处理。

**人工审阅：【硬停】批量确认**

```
┌─────────────────────────────────────────────────────────┐
│  集群批量确认 — D6 Cross-Cultural Friendships            │
│                                                         │
│  文章状态:                                               │
│  ✓ Pillar     — Phase 5 已批准                           │
│  ✓ Support A  — Phase 5 已批准                           │
│  ✓ Support B  — Phase 5 已批准                           │
│  ✓ Support C  — Phase 5 已批准                           │
│                                                         │
│  互链验证:                                               │
│  ✓ Pillar: 4/4 条互链到位                                │
│  ✓ Support A: 3/3 条互链到位                             │
│  ✓ Support B: 3/3 条互链到位                             │
│  ✗ Support C: 2/3 条互链到位（缺少 → A 的链接）           │
│                                                         │
│  内容去重:                                               │
│  ✓ 无大段重复内容                                        │
│  ⚠ Pillar H2-3 和 Support A H2-1 有 30% 重叠度           │
│    建议: Pillar H2-3 侧重"为什么"，Support A 侧重"怎么做"  │
│                                                         │
│  [返回修改]              [确认集群完成 →]                  │
└─────────────────────────────────────────────────────────┘
```

---

## 八、docx 超链接支持

### 8.1 修改 generate_docx.py

**新增 `add_hyperlink()` 函数：**

```python
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

def add_hyperlink(paragraph, text, url):
    """在段落中插入一个可点击的 Word 超链接"""
    part = paragraph.part
    r_id = part.relate_to(
        url,
        'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink',
        is_external=True
    )

    hyperlink = OxmlElement('w:hyperlink')
    hyperlink.set(qn('r:id'), r_id)

    new_run = OxmlElement('w:r')
    rPr = OxmlElement('w:rPr')
    color = OxmlElement('w:color')
    color.set(qn('w:val'), '0563C1')
    rPr.append(color)
    u = OxmlElement('w:u')
    u.set(qn('w:val'), 'single')
    rPr.append(u)
    new_run.append(rPr)

    t = OxmlElement('w:t')
    t.text = text
    new_run.append(t)
    hyperlink.append(new_run)
    paragraph._p.append(hyperlink)
    return hyperlink
```

**修改链接处理逻辑：**

```python
# 当前：text = LINK_RE.sub(r"\1", text)  # 丢弃 URL
# 改为：逐个匹配链接，调用 add_hyperlink() 插入

def process_links_in_paragraph(paragraph, text, base_url):
    """处理段落中的 markdown 链接，转为 Word 超链接"""
    last_end = 0
    for match in LINK_RE.finditer(text):
        # 链接前的纯文本
        before = text[last_end:match.start()]
        if before:
            paragraph.add_run(before)

        link_text = match.group(1)
        link_url = match.group(2)

        # 相对路径拼接 base_url
        if link_url.startswith('/'):
            link_url = base_url.rstrip('/') + link_url

        # 插入可点击超链接
        add_hyperlink(paragraph, link_text, link_url)
        last_end = match.end()

    # 链接后的纯文本
    after = text[last_end:]
    if after:
        paragraph.add_run(after)
```

### 8.2 base_url 配置

- `clusters` 表新增 `blog_base_url` 字段（默认 `https://www.hellotalk.com/en/blog`）
- 集群创建时用户可配置
- `generate_docx.py` 接收 `--base-url` 命令行参数
- `phaseRunner.ts` 调用 docx 生成时传入 base_url

### 8.3 互链占位符替换

在 Phase 3 写入的 `[anchor text](INTERNAL_LINK:target-slug)` 占位符，在 Phase 5 生成 docx 前替换为实际 URL：

```typescript
// phaseRunner.ts 中
function resolveInternalLinks(article: string, clusterState: ClusterState, baseUrl: string): string {
  return article.replace(
    /\[([^\]]+)\]\(INTERNAL_LINK:([^)]+)\)/g,
    (match, anchor, slug) => {
      const url = baseUrl + '/' + slug;
      return `[${anchor}](${url})`;
    }
  );
}
```

---

## 九、超时应对策略

### 9.1 超时风险矩阵

| 阶段 | 风险级别 | 原因 | 应对策略 |
|---|---|---|---|
| Phase 0 | ✅ 低 | 和单篇相同 | 无需修改 |
| Phase 1 | ✅ 低 | 每篇独立，输入输出量不变 | 无需修改 |
| Phase 1b | ✅ 低 | 本地提取 + 精简输入 | 先本地提取链接建议段落 |
| Phase 2 | ✅ 低 | 每篇独立，输入输出量不变 | 无需修改 |
| Phase 3 | ⚠️ 中 | 3500 词输出接近超时 | **分段写入**（两步生成） |
| Phase 4 | ⚠️ 中 | 4-5 chunk × 4 篇 = 16-20 次调用 | **默认 chunked + 增量续跑** |
| Phase 5 | ✅ 低 | docx 生成是本地操作 | 无需修改 |
| Phase 1b 审阅 | ✅ 低 | 输入量约 1000 词 | 无需修改 |
| 批量确认 | ⚠️ 中 | 4 篇全文同时输入 | **摘要化处理** |

### 9.2 具体应对措施

#### Phase 3 分段写入

```
Step 1: H1 + 前 2-3 个 H2（~1500 词）→ 10 分钟超时
Step 2: 剩余 H2 + FAQ + 结尾（~1500 词）→ 10 分钟超时
合并: 拼接为 03_full_article.md
```

#### Phase 4 默认 chunked + 增量续跑

- 去掉非 chunked 选项
- 每个 chunk 独立超时（10 分钟）
- 已完成的 chunk 报告自动复用（`canReusePhase4ChunkReport`）
- UI 显示进度："第 2/4 篇文章，第 3/5 个 chunk"

#### 批量确认摘要化

- 不读取 4 篇全文
- 本地提取每篇的 checklist 报告摘要
- 本地运行互链验证和内容去重
- 只将摘要结果（~1500 词）传给 LLM 生成最终报告

#### 超时动态化

```typescript
// codexClient.ts 修改
const timeoutForPhase = (phase: string, articleType?: string) => {
  if (phase === 'phase3' && articleType === 'guide') return 900000;  // 15 分钟
  if (phase === 'phase4') return 600000;  // chunk 模式，每个 chunk 10 分钟
  return 600000;  // 默认 10 分钟
};
```

---

## 十、人工审阅流程

### 10.1 审阅时机汇总

| 阶段 | 审阅内容 | 看几篇 | 意见范围 | 类型 |
|---|---|---|---|---|
| Brief 解析后 | 解析结果预览 | 全局概览 | 全局 | 确认页 |
| Phase 1 | 4 篇中文大纲 | **4 篇同时** | 全局或单篇可选 | **硬停** |
| Phase 1b | 互链规划表 | **1 张表** | 增删改互链 | **硬停** |
| Phase 2-4 | 自动审批 | — | — | 自动 |
| Phase 5 | 最终文章 + docx | **逐篇** | 单篇 | **硬停** |
| 批量确认 | 互链验证 + 内容去重 | **4 篇概览** | 全局 | **硬停** |

### 10.2 为什么大纲必须批量看

- 4 篇文章的主题分工、关键词覆盖、内容边界互相约束
- 单独审阅文章 A 大纲时，无法判断文章 B 是否和它内容重叠
- 互链规划天然依赖全部大纲同时可见
- 一次审阅即可锁定全局方案，后续不需要反复调整

### 10.3 为什么正文可以逐篇看

- 每篇 2000-3500 词，4 篇合计 10000-14000 词，一次看完不现实
- 互链已在 Phase 1b 锁定，正文审阅只需关注单篇质量
- 最后有批量确认步骤兜底

---

## 十一、实施计划

### 阶段划分

| 阶段 | 内容 | 优先级 | 预估工作量 |
|---|---|---|---|
| **P0** | 类型定义 + 数据库表 + 集群状态结构 | 高 | 1 天 |
| **P1** | Brief 解析器（clusterParser.ts + prompt） | 高 | 2 天 |
| **P2** | 集群创建 API + 页面 | 高 | 2 天 |
| **P3** | 集群 Phase 0 + 共享材料 | 高 | 1 天 |
| **P4** | 集群 Phase 1（per-article 大纲）+ 批量审阅 UI | 高 | 2 天 |
| **P5** | Phase 1b（互链细化）+ 互链审阅 UI | 中 | 2 天 |
| **P6** | Phase 2-3 per-article（含分段写入） | 中 | 2 天 |
| **P7** | Phase 4 per-article（默认 chunked + 互链验证） | 中 | 2 天 |
| **P8** | Phase 5 per-article + docx 超链接 | 中 | 2 天 |
| **P9** | 批量确认逻辑 + UI | 中 | 1 天 |
| **P10** | 集群总览 Dashboard UI | 低 | 2 天 |
| **P11** | 端到端测试 + 文档 | 高 | 2 天 |

**总计：约 19 天**

### CodeX 代码审阅计划

在实施过程中分 3 次进行 Codex 代码审阅，每次在关键集成点暂停：

| 审阅时机 | 审阅范围 | 关注点 |
|---|---|---|
| **P0-P3 完成后** | 类型定义 + DB schema + Brief 解析器 + 集群创建 API | 基础架构层：schema 设计、类型一致性、解析器逻辑 |
| **P5 完成后** | Phase 0/1/1b + 集群编排逻辑 + 批量审阅 UI | 核心流程层：集群模式能否跑通到互链规划 |
| **P11 完成后** | 全量代码端到端审阅 | 集成层：per-article Phase 2-5 + docx 超链接 + 批量确认 |

每次审阅后暂停，向用户展示审阅结果，确认无重大问题后继续下一阶段。

### 实施顺序建议

```
P0 → P1 → P2 → P3  （基础框架 + 项目创建）
        ↓
P4 → P5              （大纲 + 互链规划）
        ↓
P6 → P7 → P8        （正文写作 + 审计 + 交付）
        ↓
P9 → P10 → P11      （批量确认 + UI + 测试）
```

---

## 十二、与单篇模式的关系

| 方面 | 单篇模式 | 集群模式 |
|---|---|---|
| 创建入口 | `/projects/new` | `/clusters/new` |
| Phase 0 | 独立执行 | 共享执行 |
| Phase 1-5 | 独立执行 | per-article 独立执行 |
| 数据库 | `projects` 表 | `clusters` + `cluster_articles` + `projects` 表 |
| 存储 | `storage/projects/<id>/` | `storage/clusters/<slug>/articles/<article-slug>/` |
| phaseRunner.ts | 直接调用 | 通过 clusterRunner.ts 调用 |
| Prompt 文件 | 共享 | 共享（集群版 prompt 包含互链指令） |
| Checklist | 独立生成 | 共享生成 |

**单篇模式完全保留，不受影响。** 集群模式是在其上面的一层包装。
