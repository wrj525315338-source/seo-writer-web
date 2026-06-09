# SEO Writer Web

本地 SEO/GEO/AIO 文章撰写网站，用于可视化调度已经创建好的 `SEO Article Writer Skill`。

网站本身不重新实现文章生成逻辑。后端 Phase Runner 会调用：

- `../skills/seo-article-writer/prompts/*.md`
- `../skills/seo-article-writer/scripts/extract_materials.py`
- `../skills/seo-article-writer/scripts/run_prompt.py`
- `../skills/seo-article-writer/scripts/generate_docx.py`

## 1. 安装依赖

进入网站目录：

```bash
cd seo-writer-web
npm install
```

## 2. 配置 `.env`

复制环境变量模板：

```bash
copy .env.example .env
```

至少配置：

```env
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
QWEN_API_KEY=
QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
DOUBAO_API_KEY=
DOUBAO_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
XIAOMI_API_KEY=
XIAOMI_BASE_URL=https://api.xiaomimimo.com/v1
CUSTOM_API_KEY=
CUSTOM_BASE_URL=
DEFAULT_PROVIDER=openai
DEFAULT_MODEL=
MODEL_API_TIMEOUT=300
MODEL_API_RETRIES=3
DATABASE_URL=file:./data/sqlite.db
STORAGE_DIR=./storage/projects
SHARED_STORAGE_DIR=./storage/shared
SEO_SKILL_DIR=../skills/seo-article-writer
PYTHON_PATH=
```

说明：

- API Key 只在后端读取，不会返回给前端。
- `MODEL_NAME` 来自新建项目表单，也可以用 `DEFAULT_MODEL` 作为默认参考。
- `SHARED_STORAGE_DIR` 保存长期复用的写作规范和示例文章。
- Qwen/千问只使用 `QWEN_API_KEY` 和 `QWEN_BASE_URL`。
- Doubao/豆包只使用 `DOUBAO_API_KEY` 和 `DOUBAO_BASE_URL`。
- Xiaomi/小米使用 `XIAOMI_API_KEY`。
- 各 provider 的 `*_BASE_URL` 可覆盖默认 OpenAI-compatible endpoint。
- `MODEL_API_TIMEOUT` 控制单次模型 HTTP 请求读取超时时间，单位秒。Phase 4 checklist 输入较长时可适当调大。
- `MODEL_API_RETRIES` 控制模型接口遇到超时、断连、连接失败时的重试次数。
- `PYTHON_PATH` 建议指向带有 `python-docx` 和 `openpyxl` 的 Python。Codex bundled Python 通常位于用户目录的 `.cache/codex-runtimes/.../python.exe`，留空时后端会自动尝试查找。

## 3. 启动网站

```bash
npm run dev
```

打开：

```text
http://localhost:3000
```

## 4. 创建文章项目

在 `/projects/new` 填写：

- 基础信息：项目名、语言、品牌名。文章标题、目标读者和搜索意图由 SEO Article Writer Skill 在 Phase 0 / Phase 1 自动生成。
- 模型配置：
  - Writing Model（写作/批改模型）：`writingProvider`、`writingModelName`、`writingBaseUrl`、`writingTemperature`
  - Auditor Model（审查模型）：`auditorProvider`、`auditorModelName`、`auditorBaseUrl`、`auditorTemperature`
- 文章要求：选题、主关键词、副关键词（可选，不填则在 Phase 1 大纲阶段自动生成）、文章重点、推荐理由、图片要求、额外注意事项。
- 长期参考文件：写作规范和示例文章只需要上传一次。后续新项目会自动复用；如果在新建项目页重新选择文件，就会更新共享默认文件。
- 本次项目文件：选题要求文件可选，只作用于当前项目。

提交后会创建：

```text
storage/projects/{projectId}/inputs/
storage/projects/{projectId}/outputs/
storage/projects/{projectId}/project_state.json
storage/shared/
```

同时写入 SQLite：

```text
data/sqlite.db
```

## 5. 运行 Phase 0–5

进入项目详情页后，流程会自动按顺序运行：

1. Phase 0：读取材料与规范提取，并根据写作标准生成固定 checklist（`00_material_reading_summary.md`、`00_writing_checklist.md`），运行完成后自动通过并进入 Phase 1。
2. Phase 1：生成中文可读版文章大纲，输出 `01_outline.md`，关键词、标题候选、术语和示例等必要内容保留英文，并标注正文中需要使用表格的位置；需要预览并确认，确认后自动进入 Phase 2。
3. Phase 2：Writing Model 先撰写前两个 H2 的内部草稿，Auditor Model 再根据写作规范、固定 checklist 和语言/内容关键词进行润色修改，输出 `02_first_two_sections.md`；运行完成后自动通过并进入 Phase 3。
4. Phase 3：完成全文，运行完成后自动通过并进入 Phase 4。
5. Phase 4：调用 Phase 0 生成的 `00_writing_checklist.md` 对全文进行查验。长文章会自动拆成较小片段逐段审查，再合并为 `04_checklist_report.md`，降低审查模型长请求断连概率；运行完成后自动通过并进入 Phase 5。
6. Phase 5：生成最终正文 Word，输出 `final_article_for_google_docs.docx`，需要预览并确认。若提交人工修改意见，系统只覆盖更新 `03_full_article.md` 并重新生成 `final_article_for_google_docs.docx`；确认后自动进入 Phase 5.5 图片规划和 Phase 6 生图插图。

后端会强制执行阶段门禁：

- Phase 0 未完成，不能运行 Phase 1。
- Phase 1 未确认，不能运行 Phase 2。
- Phase 2 未完成，不能运行 Phase 3。
- Phase 4 checklist 调用审查未完成，不能运行 Phase 5。

## 6. 修改意见和确认

Phase 1 和 Phase 5 输出后状态会变为 `waiting_review`，需要人工预览并确认。Phase 0、Phase 2、Phase 3 和 Phase 4 运行成功后会自动标记为 `approved`。
除非某个阶段运行失败，用户不需要手动点击“运行”。失败时，项目详情页会在对应阶段显示“重新运行”按钮。
Phase 2 的润色结果会作为 Phase 3 的风格样本，后续全文需要保持修改后的语言风格、信息密度和产品植入方式。

Phase 4 不会重新生成 checklist；它只调用 Phase 0 已固定的 checklist 来审查 `03_full_article.md`。系统会生成隐藏的 Phase4 分块审查中间文件，但下载区保留大纲、最终 Word、图片规划和带图 Word。
如果 Phase 4 使用 Auditor Model 审查失败，系统不会自动退回 Writing Model。页面会让用户选择“重试审查模型”或“使用写作模型审查”。

用户可以：

- 对 Phase 1 和 Phase 5 输入修改意见，后端会调用 Skill 的 revise 流程重新生成当前阶段输出。
- Phase 5 修改意见只覆盖最终正文和 Word 文件；确认通过时会再从最新正文生成一次 Word 文件，然后自动进入 Phase 5.5 图片规划。
- 对 Phase 1 和 Phase 5 点击“确认通过”，将当前阶段标记为 `approved` 并解锁下一阶段。

如果修改意见和写作规范冲突，Skill 会按既定冲突格式提示并给出替代方案。

## 7. 下载最终文件

项目详情页的“输出文件列表”支持下载：

- `01_outline.md`
- `final_article_for_google_docs.docx`
- `image_plan.json`
- `final_article_with_image_slots.md`
- `image_metadata.json`
- `image_compliance_report.json`
- `phase6.log`
- `final_article_with_images.docx`

## 8. Writing Model 和 Auditor Model

Writing Model 用于材料阅读、大纲生成、正文写作、用户修改意见处理和最终文件生成。

Auditor Model 用于审查和润色类任务。当前工作流中，Phase 2 会使用 Auditor Model 润色前两个 H2，Phase 4 checklist 调用也会使用 Auditor Model。

Auditor Model 可以和 Writing Model 使用不同 provider。如果两者选择相同模型，系统仍可运行，但页面会提示“审核独立性较弱”。

API Key 仍然只从 `.env` 读取，不会显示或保存到前端。

## 9. 扩展模型供应商

当前支持：

- `openai`
- `anthropic`
- `deepseek`
- `qwen` / 千问
- `doubao` / 豆包
- `xiaomi` / 小米
- `custom`

如果要扩展供应商：

1. 在 `components/ModelConfigForm.tsx` 增加 provider 选项和模型选项。
2. 在 `lib/types.ts` 扩展 `Provider` 类型。
3. 在 `lib/codexClient.ts` 的 `apiEnvForProvider` 和 `buildModelEnv` 中映射对应 API Key 与 Base URL。
4. 如果 Skill 的 `scripts/model_provider.py` 不支持该供应商，同步扩展 provider 调用逻辑。

## 10. 如何确认已调用 SEO Article Writer Skill

检查以下位置：

- `lib/phaseRunner.ts`：所有 Phase 都通过 `getSkillDir()` 定位 `SEO_SKILL_DIR`。
- `lib/phaseRunner.ts`：每个 Phase 都读取 `skills/seo-article-writer/prompts/*.md`。
- `lib/codexClient.ts`：后端调用 Python 脚本执行 Skill。
- `storage/projects/{projectId}/outputs/`：输出文件名与 Skill 工作流一致。
- `data/sqlite.db` 的 `phase_runs.input_prompt`：每次运行都会写入“请使用 SEO Article Writer Skill 执行...”的调用提示。

如果 `SEO_SKILL_DIR` 配置错误，Phase 运行会失败并在页面显示错误。

## 11. Image Generation Output

Phase 5 人工确认通过后，后端会自动运行两个内部图片步骤：

1. `phase5_5_image_planning`：读取最终 `03_full_article.md`，调用 `hellotalk-blog-image-planner-v2`，输出 `image_plan.json`、`final_article_with_image_slots.md` 和 `image_planning.log`。
2. `phase6`：只读取 `image_plan.json`、`final_article_with_image_slots.md`、生图配置和输出目录。它不读取 `image_prompts.md`、`images.json` 或旧阶段里的图片说明。

Phase 5.5 会自动扫描 `IMAGE_EXAMPLES_DIR` 指向的图片示例目录，默认是 `../examples`。扫描到的图片会写入 `image_style_reference_examples.md`，并作为 image planner skill 的输入，用于参考整体风格、构图和信息表达方式；合规规则仍然优先于示例图。

```text
outputs/
  final_article_for_google_docs.docx
  image_style_reference_examples.md
  image_plan.json
  image_planning.log
  final_article_with_image_slots.md
  images/
    IMAGE_1.png
    IMAGE_2.png
  image_metadata.json
  image_compliance_report.json
  phase6.log
  final_article_with_images.docx
```

新建项目时，在 `Auditor Model` 后面的 `Image Generation Model` 区域配置：

- `Enable image generation`：关闭时会直接复制无图 Word 为最终成品。
- `Provider` / `Model name` / `Base URL` / `Temperature`：与写作、审查模型配置方式一致；API key 只从 `.env` 读取。
- `Model name` 下拉框保存展示名，同时自动保存真实 `image_model_id`；不要把 `Doubao-Seedream-5.0-lite` 这类 UI 展示名当 API `model`。
- 火山方舟 / 豆包生图映射：`Doubao-Seedream-5.0-lite` -> `doubao-seedream-5-0-lite-260128`，`Doubao-Seedream-5.0` -> `doubao-seedream-5-0-260128`，`Doubao-Seedream-4.5` -> `doubao-seedream-4-5-251128`，`Doubao-Seedream-4.0` -> `doubao-seedream-4-0-250828`。
- `Endpoint ID` / `Use endpoint ID`：仅在需要调用已部署 endpoint 时填写；`Use endpoint ID` 开启后请求中的 `model` 使用 `image_endpoint_id`，否则使用 `image_model_id`。
- `Image skill path`：默认 `../skills/hellotalk-blog-image-planner-v2.skill`。也可以填写解压后的 skill 目录，或 `.zip` / `.7z` 压缩包路径。
- `Output format`、`Aspect ratio`、`Retry count`、`Default image count`：控制图片产物和重试策略。
- `Allow non-compliant images`：默认关闭；关闭时合规检查失败的图片不会插入 Word。

图片 provider 的 API key 读取顺序：

```env
DOUBAO_IMAGE_API_KEY / DOUBAO_API_KEY / ARK_API_KEY
QWEN_IMAGE_API_KEY / DASHSCOPE_API_KEY / QWEN_API_KEY
OPENAI_IMAGE_API_KEY / OPENAI_API_KEY
CUSTOM_IMAGE_API_KEY / CUSTOM_API_KEY
```

图片 endpoint 建议通过项目里的 `Base URL` 或 `.env` 中的 `DOUBAO_IMAGE_BASE_URL`、`QWEN_IMAGE_BASE_URL`、`OPENAI_IMAGE_BASE_URL`、`CUSTOM_IMAGE_BASE_URL` 设置，不要写进代码。

火山方舟生图最小测试命令：

```powershell
python scripts\test_volcengine_ark_image.py --provider volcengine_ark --model doubao-seedream-5-0-lite-260128 --prompt "简单测试 prompt" --output .tmp\volcengine-ark-test.png
```

本地 smoke test 可使用 custom mock：

```powershell
$env:CUSTOM_IMAGE_MOCK='1'
python scripts\phase6_image_generation.py --config .tmp\phase6-smoke\image_generation_config.json --project-dir .tmp\phase6-smoke --final-docx .tmp\phase6-smoke\final_article_for_google_docs.docx --article-md .tmp\phase6-smoke\final_article_with_image_slots.md --image-plan .tmp\phase6-smoke\image_plan.json --output-dir .tmp\phase6-smoke
```
