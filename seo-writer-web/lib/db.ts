import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { ArticleRole, ArticleType, Cluster, ClusterArticleRecord, ClusterPhaseId, ImageProvider, PhaseId, PhaseRun, PhaseStatus, Project, ProjectStatus, Provider, ReviewComment } from "@/lib/types";
import { decodeProjectId } from "@/lib/routeParams";

let db: DatabaseSync | null = null;

function resolveDbPath(): string {
  const configured = process.env.DATABASE_URL || "file:./data/sqlite.db";
  const rawPath = configured.startsWith("file:") ? configured.slice(5) : configured;
  return path.isAbsolute(rawPath) ? rawPath : path.join(/* turbopackIgnore: true */ process.cwd(), rawPath);
}

export function getDb(): DatabaseSync {
  if (db) {
    return db;
  }
  const dbPath = resolveDbPath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  db = new DatabaseSync(dbPath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      article_title TEXT NOT NULL,
      topic TEXT NOT NULL,
      primary_keyword TEXT NOT NULL,
      secondary_keywords TEXT NOT NULL DEFAULT '',
      article_focus TEXT NOT NULL DEFAULT '',
      recommendation_reason TEXT NOT NULL DEFAULT '',
      target_audience TEXT NOT NULL DEFAULT '',
      search_intent TEXT NOT NULL DEFAULT '',
      language TEXT NOT NULL DEFAULT 'English',
      brand_name TEXT NOT NULL DEFAULT '',
      writing_provider TEXT NOT NULL DEFAULT 'openai',
      writing_model_name TEXT NOT NULL DEFAULT '',
      writing_base_url TEXT NOT NULL DEFAULT '',
      writing_temperature REAL NOT NULL DEFAULT 0.7,
      writing_max_tokens INTEGER NOT NULL DEFAULT 0,
      auditor_provider TEXT NOT NULL DEFAULT 'openai',
      auditor_model_name TEXT NOT NULL DEFAULT '',
      auditor_base_url TEXT NOT NULL DEFAULT '',
      auditor_temperature REAL NOT NULL DEFAULT 0.2,
      auditor_max_tokens INTEGER NOT NULL DEFAULT 0,
      enable_image_generation INTEGER NOT NULL DEFAULT 1,
      image_provider TEXT NOT NULL DEFAULT 'volcengine_ark',
      image_model_display_name TEXT NOT NULL DEFAULT '',
      image_model_name TEXT NOT NULL DEFAULT '',
      image_model_id TEXT NOT NULL DEFAULT '',
      image_endpoint_id TEXT NOT NULL DEFAULT '',
      image_use_endpoint_id INTEGER NOT NULL DEFAULT 0,
      image_base_url TEXT NOT NULL DEFAULT '',
      image_temperature REAL NOT NULL DEFAULT 0.2,
      image_skill_path TEXT NOT NULL DEFAULT '../skills/hellotalk-blog-image-planner-v2.skill',
      image_output_format TEXT NOT NULL DEFAULT 'png',
      image_aspect_ratio_default TEXT NOT NULL DEFAULT '16:9',
      image_retry_count INTEGER NOT NULL DEFAULT 2,
      image_insert_mode TEXT NOT NULL DEFAULT 'placeholder',
      image_count_default INTEGER NOT NULL DEFAULT 3,
      image_allow_non_compliant_images INTEGER NOT NULL DEFAULT 0,
      image_planning_mode TEXT NOT NULL DEFAULT 'auto',
      provider TEXT NOT NULL DEFAULT 'openai',
      model_name TEXT NOT NULL DEFAULT '',
      base_url TEXT NOT NULL DEFAULT '',
      temperature REAL NOT NULL DEFAULT 0.7,
      max_tokens INTEGER NOT NULL DEFAULT 0,
      current_phase TEXT NOT NULL DEFAULT 'phase0',
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS phase_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id TEXT NOT NULL,
      phase TEXT NOT NULL,
      status TEXT NOT NULL,
      input_prompt TEXT NOT NULL DEFAULT '',
      output_file_path TEXT NOT NULL DEFAULT '',
      error_message TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS review_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id TEXT NOT NULL,
      phase TEXT NOT NULL,
      comment TEXT NOT NULL,
      response_file_path TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      FOREIGN KEY(project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS clusters (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      brand_name TEXT NOT NULL DEFAULT '',
      language TEXT NOT NULL DEFAULT 'English',
      brief_source_path TEXT NOT NULL DEFAULT '',
      shared_summary_path TEXT NOT NULL DEFAULT '',
      shared_checklist_path TEXT NOT NULL DEFAULT '',
      cross_link_plan_path TEXT NOT NULL DEFAULT '',
      current_phase TEXT NOT NULL DEFAULT 'cluster_phase0',
      status TEXT NOT NULL DEFAULT 'active',
      blog_base_url TEXT NOT NULL DEFAULT 'https://www.hellotalk.com/en/blog',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cluster_articles (
      id TEXT PRIMARY KEY,
      cluster_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      article_role TEXT NOT NULL,
      article_slug TEXT NOT NULL,
      article_type TEXT NOT NULL DEFAULT 'guide',
      target_word_min INTEGER NOT NULL DEFAULT 2000,
      target_word_max INTEGER NOT NULL DEFAULT 3500,
      sort_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(cluster_id) REFERENCES clusters(id),
      FOREIGN KEY(project_id) REFERENCES projects(id)
    );
  `);
  ensureProjectColumns(db);
  return db;
}

function ensureProjectColumns(database: DatabaseSync): void {
  const existingColumns = new Set(
    (database.prepare("PRAGMA table_info(projects)").all() as Array<{ name: string }>).map((column) => column.name)
  );
  const columns: Array<[string, string]> = [
    ["writing_provider", "TEXT NOT NULL DEFAULT 'openai'"],
    ["writing_model_name", "TEXT NOT NULL DEFAULT ''"],
    ["writing_base_url", "TEXT NOT NULL DEFAULT ''"],
    ["writing_temperature", "REAL NOT NULL DEFAULT 0.7"],
    ["writing_max_tokens", "INTEGER NOT NULL DEFAULT 0"],
    ["auditor_provider", "TEXT NOT NULL DEFAULT 'openai'"],
    ["auditor_model_name", "TEXT NOT NULL DEFAULT ''"],
    ["auditor_base_url", "TEXT NOT NULL DEFAULT ''"],
    ["auditor_temperature", "REAL NOT NULL DEFAULT 0.2"],
    ["auditor_max_tokens", "INTEGER NOT NULL DEFAULT 0"],
    ["enable_image_generation", "INTEGER NOT NULL DEFAULT 1"],
    ["image_provider", "TEXT NOT NULL DEFAULT 'volcengine_ark'"],
    ["image_model_display_name", "TEXT NOT NULL DEFAULT ''"],
    ["image_model_name", "TEXT NOT NULL DEFAULT ''"],
    ["image_model_id", "TEXT NOT NULL DEFAULT ''"],
    ["image_endpoint_id", "TEXT NOT NULL DEFAULT ''"],
    ["image_use_endpoint_id", "INTEGER NOT NULL DEFAULT 0"],
    ["image_base_url", "TEXT NOT NULL DEFAULT ''"],
    ["image_temperature", "REAL NOT NULL DEFAULT 0.2"],
    ["image_skill_path", "TEXT NOT NULL DEFAULT '../skills/hellotalk-blog-image-planner-v2.skill'"],
    ["image_output_format", "TEXT NOT NULL DEFAULT 'png'"],
    ["image_aspect_ratio_default", "TEXT NOT NULL DEFAULT '16:9'"],
    ["image_retry_count", "INTEGER NOT NULL DEFAULT 2"],
    ["image_insert_mode", "TEXT NOT NULL DEFAULT 'placeholder'"],
    ["image_count_default", "INTEGER NOT NULL DEFAULT 3"],
    ["image_allow_non_compliant_images", "INTEGER NOT NULL DEFAULT 0"],
    ["image_planning_mode", "TEXT NOT NULL DEFAULT 'auto'"]
  ];
  for (const [name, definition] of columns) {
    if (!existingColumns.has(name)) {
      database.exec(`ALTER TABLE projects ADD COLUMN ${name} ${definition}`);
    }
  }
  database.exec(`
    UPDATE projects
    SET
      writing_provider = CASE WHEN writing_model_name = '' THEN provider ELSE writing_provider END,
      writing_model_name = CASE WHEN writing_model_name = '' THEN model_name ELSE writing_model_name END,
      writing_base_url = CASE WHEN writing_base_url = '' THEN base_url ELSE writing_base_url END,
      writing_temperature = COALESCE(writing_temperature, temperature, 0.7),
      writing_max_tokens = COALESCE(writing_max_tokens, max_tokens, 0),
      auditor_provider = CASE WHEN auditor_model_name = '' THEN COALESCE(NULLIF(writing_provider, ''), provider) ELSE auditor_provider END,
      auditor_model_name = CASE WHEN auditor_model_name = '' THEN COALESCE(NULLIF(writing_model_name, ''), model_name) ELSE auditor_model_name END,
      auditor_base_url = CASE WHEN auditor_base_url = '' THEN COALESCE(NULLIF(writing_base_url, ''), base_url) ELSE auditor_base_url END,
      auditor_temperature = COALESCE(auditor_temperature, 0.2),
      auditor_max_tokens = COALESCE(auditor_max_tokens, 0),
      image_provider = COALESCE(NULLIF(image_provider, ''), 'volcengine_ark'),
      image_model_display_name = COALESCE(NULLIF(image_model_display_name, ''), image_model_name, ''),
      image_model_name = COALESCE(image_model_name, ''),
      image_model_id = CASE
        WHEN image_provider IN ('doubao', 'volcengine_ark')
          AND COALESCE(NULLIF(image_model_display_name, ''), NULLIF(image_model_id, ''), image_model_name, '') = 'Doubao-Seedream-5.0-lite'
          THEN 'doubao-seedream-5-0-lite-260128'
        WHEN image_provider IN ('doubao', 'volcengine_ark')
          AND COALESCE(NULLIF(image_model_display_name, ''), NULLIF(image_model_id, ''), image_model_name, '') = 'Doubao-Seedream-5.0'
          THEN 'doubao-seedream-5-0-260128'
        WHEN image_provider IN ('doubao', 'volcengine_ark')
          AND COALESCE(NULLIF(image_model_display_name, ''), NULLIF(image_model_id, ''), image_model_name, '') = 'Doubao-Seedream-4.5'
          THEN 'doubao-seedream-4-5-251128'
        WHEN image_provider IN ('doubao', 'volcengine_ark')
          AND COALESCE(NULLIF(image_model_display_name, ''), NULLIF(image_model_id, ''), image_model_name, '') = 'Doubao-Seedream-4.0'
          THEN 'doubao-seedream-4-0-250828'
        ELSE COALESCE(NULLIF(image_model_id, ''), image_model_name, '')
      END,
      image_endpoint_id = COALESCE(image_endpoint_id, ''),
      image_use_endpoint_id = COALESCE(image_use_endpoint_id, 0),
      image_base_url = COALESCE(image_base_url, ''),
      image_temperature = COALESCE(image_temperature, 0.2),
      image_skill_path = COALESCE(NULLIF(image_skill_path, ''), '../skills/hellotalk-blog-image-planner-v2.skill'),
      image_output_format = COALESCE(NULLIF(image_output_format, ''), 'png'),
      image_aspect_ratio_default = COALESCE(NULLIF(image_aspect_ratio_default, ''), '16:9'),
      image_retry_count = COALESCE(image_retry_count, 2),
      image_insert_mode = COALESCE(NULLIF(image_insert_mode, ''), 'placeholder'),
      image_count_default = COALESCE(image_count_default, 3),
      image_allow_non_compliant_images = COALESCE(image_allow_non_compliant_images, 0),
      image_planning_mode = COALESCE(NULLIF(image_planning_mode, ''), 'auto')
  `);
  database.exec(`
    UPDATE projects
    SET
      writing_model_name = CASE
        WHEN writing_model_name = 'deepseek-v4-Pro' THEN 'deepseek-v4-pro'
        WHEN writing_model_name = 'deepseek-v4-Flash' THEN 'deepseek-v4-flash'
        ELSE writing_model_name
      END,
      auditor_model_name = CASE
        WHEN auditor_model_name = 'deepseek-v4-Pro' THEN 'deepseek-v4-pro'
        WHEN auditor_model_name = 'deepseek-v4-Flash' THEN 'deepseek-v4-flash'
        ELSE auditor_model_name
      END,
      model_name = CASE
        WHEN model_name = 'deepseek-v4-Pro' THEN 'deepseek-v4-pro'
        WHEN model_name = 'deepseek-v4-Flash' THEN 'deepseek-v4-flash'
        ELSE model_name
      END
  `);
}

export function createProject(project: Project): void {
  getDb()
    .prepare(`
      INSERT INTO projects (
        id, name, article_title, topic, primary_keyword, secondary_keywords,
        article_focus, recommendation_reason, target_audience, search_intent,
        language, brand_name,
        writing_provider, writing_model_name, writing_base_url, writing_temperature, writing_max_tokens,
        auditor_provider, auditor_model_name, auditor_base_url, auditor_temperature, auditor_max_tokens,
        enable_image_generation, image_provider, image_model_display_name, image_model_name, image_model_id, image_endpoint_id, image_use_endpoint_id, image_base_url, image_temperature,
        image_skill_path, image_output_format, image_aspect_ratio_default, image_retry_count, image_insert_mode, image_count_default, image_allow_non_compliant_images,
        image_planning_mode,
        provider, model_name, base_url, temperature,
        max_tokens, current_phase, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      project.id,
      project.name,
      project.article_title,
      project.topic,
      project.primary_keyword,
      project.secondary_keywords,
      project.article_focus,
      project.recommendation_reason,
      project.target_audience,
      project.search_intent,
      project.language,
      project.brand_name,
      project.writing_provider,
      project.writing_model_name,
      project.writing_base_url,
      project.writing_temperature,
      project.writing_max_tokens,
      project.auditor_provider,
      project.auditor_model_name,
      project.auditor_base_url,
      project.auditor_temperature,
      project.auditor_max_tokens,
      project.enable_image_generation ? 1 : 0,
      project.image_provider,
      project.image_model_display_name,
      project.image_model_name,
      project.image_model_id,
      project.image_endpoint_id,
      project.image_use_endpoint_id ? 1 : 0,
      project.image_base_url,
      project.image_temperature,
      project.image_skill_path,
      project.image_output_format,
      project.image_aspect_ratio_default,
      project.image_retry_count,
      project.image_insert_mode,
      project.image_count_default,
      project.image_allow_non_compliant_images ? 1 : 0,
      project.image_planning_mode || "auto",
      project.provider,
      project.model_name,
      project.base_url,
      project.temperature,
      project.max_tokens,
      project.current_phase,
      project.status,
      project.created_at,
      project.updated_at
    );
}

export function listProjects(): Project[] {
  return getDb()
    .prepare("SELECT * FROM projects ORDER BY updated_at DESC")
    .all() as unknown as Project[];
}

export function getProject(projectId: string): Project | null {
  if (!projectId || typeof projectId !== "string") {
    return null;
  }
  const id = decodeProjectId(projectId).trim();
  if (!id) {
    return null;
  }
  return (getDb().prepare("SELECT * FROM projects WHERE id = ?").get(id) as Project | undefined) || null;
}

export function deleteProjectRecords(projectId: string): boolean {
  const id = decodeProjectId(projectId).trim();
  if (!id) {
    return false;
  }
  const database = getDb();
  const existing = database.prepare("SELECT id FROM projects WHERE id = ?").get(id) as { id: string } | undefined;
  if (!existing) {
    return false;
  }
  database.exec("BEGIN");
  try {
    database.prepare("DELETE FROM review_comments WHERE project_id = ?").run(id);
    database.prepare("DELETE FROM phase_runs WHERE project_id = ?").run(id);
    database.prepare("DELETE FROM cluster_articles WHERE project_id = ?").run(id);
    database.prepare("DELETE FROM projects WHERE id = ?").run(id);
    database.exec("COMMIT");
    return true;
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

export function updateProjectPhase(projectId: string, currentPhase: PhaseId, status: ProjectStatus = "active"): void {
  getDb()
    .prepare("UPDATE projects SET current_phase = ?, status = ?, updated_at = ? WHERE id = ?")
    .run(currentPhase, status, new Date().toISOString(), projectId);
}

export function updateProjectImageModelConfig(projectId: string, config: {
  provider: ImageProvider;
  modelDisplayName: string;
  modelId: string;
  endpointId: string;
  useEndpointId: boolean;
}): void {
  getDb()
    .prepare(
      `UPDATE projects
       SET image_provider = ?,
           image_model_display_name = ?,
           image_model_name = ?,
           image_model_id = ?,
           image_endpoint_id = ?,
           image_use_endpoint_id = ?,
           updated_at = ?
       WHERE id = ?`
    )
    .run(
      config.provider,
      config.modelDisplayName,
      config.modelDisplayName,
      config.modelId,
      config.endpointId,
      config.useEndpointId ? 1 : 0,
      new Date().toISOString(),
      projectId
    );
}

export function updateProjectImageGenerationEnabled(projectId: string, enabled: boolean): void {
  getDb()
    .prepare("UPDATE projects SET enable_image_generation = ?, updated_at = ? WHERE id = ?")
    .run(enabled ? 1 : 0, new Date().toISOString(), projectId);
}

export function updateProjectAuditorModelConfig(projectId: string, config: {
  provider: Provider;
  modelName: string;
  baseUrl: string;
  temperature: number;
}): void {
  getDb()
    .prepare(
      `UPDATE projects
       SET auditor_provider = ?,
           auditor_model_name = ?,
           auditor_base_url = ?,
           auditor_temperature = ?,
           auditor_max_tokens = 0,
           updated_at = ?
       WHERE id = ?`
    )
    .run(
      config.provider,
      config.modelName,
      config.baseUrl,
      config.temperature,
      new Date().toISOString(),
      projectId
    );
}

export function createPhaseRun(projectId: string, phase: PhaseId, status: PhaseStatus, inputPrompt: string): number {
  const now = new Date().toISOString();
  const result = getDb()
    .prepare(
      "INSERT INTO phase_runs (project_id, phase, status, input_prompt, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .run(projectId, phase, status, inputPrompt, now, now);
  return Number(result.lastInsertRowid);
}

export function updatePhaseRun(
  runId: number,
  status: PhaseStatus,
  outputFilePath = "",
  errorMessage = ""
): void {
  getDb()
    .prepare("UPDATE phase_runs SET status = ?, output_file_path = ?, error_message = ?, updated_at = ? WHERE id = ?")
    .run(status, outputFilePath, errorMessage, new Date().toISOString(), runId);
}

export function listPhaseRuns(projectId: string): PhaseRun[] {
  return getDb()
    .prepare("SELECT * FROM phase_runs WHERE project_id = ? ORDER BY created_at DESC")
    .all(projectId) as unknown as PhaseRun[];
}

export function createReviewComment(
  projectId: string,
  phase: PhaseId,
  comment: string,
  responseFilePath: string
): void {
  getDb()
    .prepare("INSERT INTO review_comments (project_id, phase, comment, response_file_path, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(projectId, phase, comment, responseFilePath, new Date().toISOString());
}

export function listReviewComments(projectId: string): ReviewComment[] {
  return getDb()
    .prepare("SELECT * FROM review_comments WHERE project_id = ? ORDER BY created_at DESC")
    .all(projectId) as unknown as ReviewComment[];
}

// ============ Cluster CRUD ============

export function createCluster(cluster: Cluster): void {
  getDb()
    .prepare(`
      INSERT INTO clusters (
        id, name, brand_name, language, brief_source_path,
        shared_summary_path, shared_checklist_path, cross_link_plan_path,
        current_phase, status, blog_base_url, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      cluster.id, cluster.name, cluster.brand_name, cluster.language,
      cluster.brief_source_path, cluster.shared_summary_path,
      cluster.shared_checklist_path, cluster.cross_link_plan_path,
      cluster.current_phase, cluster.status, cluster.blog_base_url,
      cluster.created_at, cluster.updated_at
    );
}

export function getCluster(clusterId: string): Cluster | null {
  if (!clusterId) return null;
  return (getDb().prepare("SELECT * FROM clusters WHERE id = ?").get(clusterId) as Cluster | undefined) || null;
}

export function listClusters(): Cluster[] {
  return getDb()
    .prepare("SELECT * FROM clusters ORDER BY updated_at DESC")
    .all() as unknown as Cluster[];
}

export function updateClusterPhase(clusterId: string, phase: ClusterPhaseId, status: ProjectStatus = "active"): void {
  getDb()
    .prepare("UPDATE clusters SET current_phase = ?, status = ?, updated_at = ? WHERE id = ?")
    .run(phase, status, new Date().toISOString(), clusterId);
}

export function deleteClusterRecords(clusterId: string): boolean {
  const database = getDb();
  const existing = database.prepare("SELECT id FROM clusters WHERE id = ?").get(clusterId) as { id: string } | undefined;
  if (!existing) return false;
  database.exec("BEGIN");
  try {
    database.prepare("DELETE FROM cluster_articles WHERE cluster_id = ?").run(clusterId);
    database.prepare("DELETE FROM clusters WHERE id = ?").run(clusterId);
    database.exec("COMMIT");
    return true;
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

// ============ Cluster Article CRUD ============

export function createClusterArticle(record: ClusterArticleRecord): void {
  getDb()
    .prepare(`
      INSERT INTO cluster_articles (id, cluster_id, project_id, article_role, article_slug, article_type, target_word_min, target_word_max, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      record.id, record.cluster_id, record.project_id,
      record.article_role, record.article_slug, record.article_type,
      record.target_word_min, record.target_word_max, record.sort_order
    );
}

export function listClusterArticles(clusterId: string): ClusterArticleRecord[] {
  return getDb()
    .prepare("SELECT * FROM cluster_articles WHERE cluster_id = ? ORDER BY sort_order")
    .all(clusterId) as unknown as ClusterArticleRecord[];
}

export function getClusterForProject(projectId: string): Cluster | null {
  const record = getDb()
    .prepare(`SELECT c.* FROM clusters c JOIN cluster_articles ca ON c.id = ca.cluster_id WHERE ca.project_id = ?`)
    .get(projectId) as Cluster | undefined;
  return record || null;
}
