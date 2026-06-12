import fs from "node:fs";
import path from "node:path";
import {
  ArticleRole,
  ArticleType,
  ClusterArticle,
  CrossLinkRule,
  ParsedCluster,
  SpecialRequirements,
  WORD_COUNT_BY_TYPE,
} from "@/lib/types";

// ============ Layer 1: Local regex extraction ============

interface RawArticleRow {
  role: string;
  title: string;
  mainKeyword: string;
  secondaryKeyword: string;
  slug: string;
  structureType: string;
}

interface RawCrossLinkRow {
  from: string;
  to: string;
  where: string;
  anchorExample: string;
}

/** Parse the article planning table from section 二 */
function extractArticleTable(text: string): RawArticleRow[] {
  const rows: RawArticleRow[] = [];
  // Match markdown table rows (skip header/separator)
  const tableMatch = text.match(/##\s*二[^\n]*\n([\s\S]*?)(?=\n##|$)/);
  if (!tableMatch) return rows;

  const tableBlock = tableMatch[1];
  const lines = tableBlock.split("\n").filter((l) => l.trim().startsWith("|"));

  for (const line of lines) {
    // Skip header row and separator row
    if (line.includes("---") || line.includes("角色") || line.includes("建议标题")) continue;

    const cells = line
      .split("|")
      .map((c) => c.trim())
      .filter(Boolean);
    if (cells.length >= 6) {
      rows.push({
        role: cells[0].replace(/\*\*/g, ""),
        title: cells[1].replace(/\*\*/g, ""),
        mainKeyword: cells[2].replace(/\*\*/g, ""),
        secondaryKeyword: cells[3].replace(/\*\*/g, "").replace("—", ""),
        slug: cells[4].replace(/\*\*/g, ""),
        structureType: cells[5].replace(/\*\*/g, ""),
      });
    }
  }
  return rows;
}

/** Parse the cross-link table from section 三 */
function extractCrossLinkTable(text: string): RawCrossLinkRow[] {
  const rows: RawCrossLinkRow[] = [];
  const tableMatch = text.match(/##\s*三[^\n]*\n[\s\S]*?\| 从 → 到[^\n]*\n\|[-\s|]*\n([\s\S]*?)(?=\n\n|\n\*\*|$)/);
  if (!tableMatch) return rows;

  const lines = tableMatch[1].split("\n").filter((l) => l.trim().startsWith("|"));
  for (const line of lines) {
    if (line.includes("---")) continue;
    const cells = line
      .split("|")
      .map((c) => c.trim())
      .filter(Boolean);
    if (cells.length >= 3) {
      rows.push({
        from: cells[0],
        to: cells[1],
        where: cells[2],
        anchorExample: cells[3] || "",
      });
    }
  }
  return rows;
}

/** Extract slug from raw text like "Pillar → A" or "/how-to-meet-international-friends-online" */
function resolveSlug(raw: string, articles: RawArticleRow[]): string {
  const trimmed = raw.trim().replace(/\*\*/g, "");
  // If it's already a slug
  if (trimmed.startsWith("/")) return trimmed;
  // Map role names to slugs
  const roleMap: Record<string, string> = {};
  for (const a of articles) {
    const roleKey = a.role.replace(/\s/g, "").toLowerCase();
    roleMap[roleKey] = a.slug;
    // Also map "Pillar", "A", "B", "C"
    if (roleKey.includes("pillar")) roleMap["pillar"] = a.slug;
    if (roleKey.includes("支撑a") || roleKey.includes("supporta")) roleMap["支撑a"] = a.slug;
    if (roleKey.includes("支撑b") || roleKey.includes("supportb")) roleMap["支撑b"] = a.slug;
    if (roleKey.includes("支撑c") || roleKey.includes("supportc")) roleMap["支撑c"] = a.slug;
  }
  // Try to match "Pillar", "A", "B", "C" from the raw text
  const upper = trimmed.toUpperCase();
  if (upper.includes("PILLAR")) return roleMap["pillar"] || "";
  if (/\bA\b/.test(upper) && !/\bAND\b/.test(upper)) return roleMap["支撑a"] || "";
  if (/\bB\b/.test(upper)) return roleMap["支撑b"] || "";
  if (/\bC\b/.test(upper)) return roleMap["支撑c"] || "";
  return "";
}

/** Map raw role string to ArticleRole */
function mapRole(raw: string): ArticleRole {
  const lower = raw.toLowerCase();
  if (lower.includes("pillar")) return "pillar";
  if (lower.includes("a") && !lower.includes("b") && !lower.includes("c")) return "support_a";
  if (lower.includes("b")) return "support_b";
  if (lower.includes("c")) return "support_c";
  return "support_a";
}

/** Map raw structure type to ArticleType */
function mapArticleType(raw: string): ArticleType {
  const lower = raw.toLowerCase();
  if (lower.includes("清单") || lower.includes("list") || lower.includes("app")) return "app_list";
  if (lower.includes("how") || lower.includes("方法")) return "how_to";
  return "guide";
}

/** Extract brand requirements from section 四 */
function extractBrandRequirements(text: string): Partial<SpecialRequirements> {
  const result: Partial<SpecialRequirements> = {};

  // Banned competitors
  const banMatch = text.match(/绝对禁止[：:]\s*([^\n]+)/);
  if (banMatch) {
    result.bannedCompetitors = banMatch[1]
      .split(/[,、]/)
      .map((s) => s.trim().replace(/\*\*/g, ""))
      .filter(Boolean);
  }

  // Brand data points
  const brandData: string[] = [];
  const dataPatterns = [
    /(\d+[MmKk]\+?\s*(?:registered\s+)?users)/gi,
    /(\d+\+?\s*countries)/gi,
    /(\d+\+?\s*languages)/gi,
    /(90%\s*(?:of\s+)?core\s+features?\s+free)/gi,
    /(over\s+\d+\s*(?:billion|million)\s+messages?\s+daily)/gi,
    /(Google\s+Play\s+Best\s+Social\s+App)/gi,
    /(Google\s+Play\s+homepage\s+feature)/gi,
  ];
  for (const pat of dataPatterns) {
    let m;
    while ((m = pat.exec(text)) !== null) {
      brandData.push(m[1]);
    }
  }
  if (brandData.length > 0) result.brandData = brandData;

  // Required modules
  const modules: string[] = [];
  const modulePatterns = [
    /Chat-based learning/i,
    /Moments/i,
    /Voicerooms?\s*&?\s*Livestreams?/i,
    /AI\s+learning\s+tools/i,
  ];
  for (const pat of modulePatterns) {
    if (pat.test(text)) modules.push(pat.source.replace(/[\\\/^$|]/g, "").replace(/\(\?:.*?\)/g, ""));
  }
  if (modules.length > 0) result.requiredModules = ["Chat-based learning", "Moments", "Voicerooms & Livestreams", "AI learning tools"];

  // Anti-AI rules
  const antiAi: string[] = [];
  const bannedSymbols = text.match(/禁止符号[：:]([^\n]+)/);
  if (bannedSymbols) antiAi.push(`禁止符号: ${bannedSymbols[1].trim()}`);
  const bannedWords = text.match(/禁用词[：:]([^\n]+)/);
  if (bannedWords) antiAi.push(`禁用词: ${bannedWords[1].trim()}`);
  const bannedSentences = text.match(/禁止句式[：:]([^\n]+)/);
  if (bannedSentences) antiAi.push(`禁止句式: ${bannedSentences[1].trim()}`);
  if (antiAi.length > 0) result.antiAiRules = antiAi;

  return result;
}

/** Extract collision warnings from section 二 */
function extractCollisionWarnings(text: string): string[] {
  const warnings: string[] = [];
  const section = text.match(/###\s*⚠️[^\n]*\n([\s\S]*?)(?=\n##|$)/);
  if (!section) return warnings;

  const lines = section[1].split("\n").filter((l) => l.trim().startsWith("-"));
  for (const line of lines) {
    const clean = line.replace(/^-\s*/, "").replace(/\*\*/g, "").trim();
    if (clean) warnings.push(clean);
  }
  return warnings;
}

// ============ Layer 2: LLM semantic extraction ============

function buildLlmPrompt(briefText: string): string {
  return `You are a structured data extractor for SEO article cluster briefs.

Analyze the following brief text and extract the following information as JSON:

1. **clusterName**: A short name for this article cluster (e.g., "D6 Cross-Cultural Friendships")
2. **brandName**: The brand name mentioned (e.g., "HelloTalk")
3. **language**: The article language (e.g., "English")
4. **articles**: Array of article definitions, each with:
   - slug (URL path starting with /)
   - title (full article title)
   - role: "pillar" | "support_a" | "support_b" | "support_c"
   - primaryKeyword (main keyword)
   - secondaryKeywords (array, may be empty)
   - articleType: "guide" | "app_list" | "how_to"
   - searchIntent (inferred from context)
5. **crossLinkRules**: Array of cross-link rules, each with:
   - sourceSlug (the article that contains the link)
   - targetSlug (the article being linked to)
   - anchorText (suggested anchor text)
   - placementHint (where in the article to place it)
   - direction: "bidirectional" | "unidirectional"
6. **specialRequirements**: Object with:
   - bannedCompetitors (array of banned competitor names)
   - brandData (array of required brand data points to mention)
   - requiredModules (array of required feature modules)
   - collisionWarnings (array of warnings about existing articles)
   - antiAiRules (array of anti-AI detection rules)

Brief text:
---
${briefText}
---

Output ONLY valid JSON, no markdown fences.`;
}

// ============ Main parser entry point ============

export async function parseClusterBrief(
  briefFilePath: string,
  runLlm?: (prompt: string) => Promise<string>
): Promise<ParsedCluster> {
  const briefText = fs.readFileSync(briefFilePath, "utf-8");

  // Layer 1: Local extraction
  const rawArticles = extractArticleTable(briefText);
  const rawCrossLinks = extractCrossLinkTable(briefText);
  const brandReqs = extractBrandRequirements(briefText);
  const collisionWarnings = extractCollisionWarnings(briefText);

  // Build articles from local extraction
  const localArticles: ClusterArticle[] = rawArticles.map((raw) => {
    const articleType = mapArticleType(raw.structureType);
    const wordCount = WORD_COUNT_BY_TYPE[articleType];
    return {
      slug: raw.slug,
      title: raw.title,
      role: mapRole(raw.role),
      primaryKeyword: raw.mainKeyword,
      secondaryKeywords: raw.secondaryKeyword ? [raw.secondaryKeyword] : [],
      targetWordCount: wordCount,
      articleType,
    };
  });

  // Build cross-link rules from local extraction
  const localCrossLinks: CrossLinkRule[] = rawCrossLinks.map((raw) => ({
    sourceSlug: resolveSlug(raw.from, rawArticles),
    targetSlug: resolveSlug(raw.to, rawArticles),
    anchorText: raw.anchorExample.replace(/\*\*/g, "").trim(),
    placementHint: raw.where.replace(/\*\*/g, "").trim(),
    direction: "unidirectional" as const,
  }));

  // Detect bidirectional links
  for (let i = 0; i < localCrossLinks.length; i++) {
    for (let j = i + 1; j < localCrossLinks.length; j++) {
      if (
        localCrossLinks[i].sourceSlug === localCrossLinks[j].targetSlug &&
        localCrossLinks[i].targetSlug === localCrossLinks[j].sourceSlug
      ) {
        localCrossLinks[i].direction = "bidirectional";
        localCrossLinks[j].direction = "bidirectional";
      }
    }
  }

  // If no LLM function provided, return local results only
  if (!runLlm) {
    return {
      clusterName: extractClusterName(briefText),
      brandName: extractBrandName(briefText),
      language: extractLanguage(briefText),
      articles: localArticles,
      crossLinkRules: localCrossLinks.filter((r) => r.sourceSlug && r.targetSlug),
      specialRequirements: {
        bannedCompetitors: brandReqs.bannedCompetitors || [],
        brandData: brandReqs.brandData || [],
        requiredModules: brandReqs.requiredModules || [],
        collisionWarnings,
        antiAiRules: brandReqs.antiAiRules || [],
      },
      sourceType: detectSourceType(briefFilePath),
    };
  }

  // Layer 2: LLM semantic extraction
  const prompt = buildLlmPrompt(briefText);
  const llmResponse = await runLlm(prompt);

  try {
    const parsed = JSON.parse(llmResponse);
    // Merge LLM results with local extraction (local takes precedence for structured data)
    return {
      clusterName: parsed.clusterName || extractClusterName(briefText),
      brandName: parsed.brandName || extractBrandName(briefText),
      language: parsed.language || extractLanguage(briefText),
      articles: localArticles.length > 0 ? localArticles : (parsed.articles || []),
      crossLinkRules: localCrossLinks.length > 0
        ? localCrossLinks.filter((r) => r.sourceSlug && r.targetSlug)
        : (parsed.crossLinkRules || []),
      specialRequirements: {
        bannedCompetitors: brandReqs.bannedCompetitors || parsed.specialRequirements?.bannedCompetitors || [],
        brandData: brandReqs.brandData || parsed.specialRequirements?.brandData || [],
        requiredModules: brandReqs.requiredModules || parsed.specialRequirements?.requiredModules || [],
        collisionWarnings: collisionWarnings.length > 0 ? collisionWarnings : (parsed.specialRequirements?.collisionWarnings || []),
        antiAiRules: brandReqs.antiAiRules || parsed.specialRequirements?.antiAiRules || [],
      },
      sourceType: detectSourceType(briefFilePath),
    };
  } catch {
    // If LLM response is not valid JSON, fall back to local results
    return {
      clusterName: extractClusterName(briefText),
      brandName: extractBrandName(briefText),
      language: extractLanguage(briefText),
      articles: localArticles,
      crossLinkRules: localCrossLinks.filter((r) => r.sourceSlug && r.targetSlug),
      specialRequirements: {
        bannedCompetitors: brandReqs.bannedCompetitors || [],
        brandData: brandReqs.brandData || [],
        requiredModules: brandReqs.requiredModules || [],
        collisionWarnings,
        antiAiRules: brandReqs.antiAiRules || [],
      },
      sourceType: detectSourceType(briefFilePath),
    };
  }
}

// ============ Utility functions ============

function extractClusterName(text: string): string {
  const match = text.match(/^#\s*[^\n]*[｜|]\s*(.+)$/m);
  return match ? match[1].trim() : "Untitled Cluster";
}

function extractBrandName(text: string): string {
  const match = text.match(/(?:HelloTalk|Duolingo|Speaky|Busuu)/i);
  return match ? match[0] : "";
}

function extractLanguage(text: string): string {
  const match = text.match(/文章语言[：:]\s*(\S+)/);
  if (match) {
    const lang = match[1].toLowerCase();
    if (lang.includes("英文") || lang.includes("english")) return "English";
    if (lang.includes("中文") || lang.includes("chinese")) return "Chinese";
    return match[1];
  }
  return "English";
}

function detectSourceType(filePath: string): ParsedCluster["sourceType"] {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".md" || ext === ".markdown") return "markdown";
  if (ext === ".xlsx" || ext === ".xlsm") return "excel";
  if (ext === ".docx" || ext === ".doc") return "docx";
  return "text";
}
