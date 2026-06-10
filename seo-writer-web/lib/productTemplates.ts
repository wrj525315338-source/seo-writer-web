import fs from "node:fs";
import path from "node:path";
import { getOutputsDir } from "@/lib/fileStorage";

export interface ProductTemplateInfo {
  name: string;
  hasExtractedMaterials: boolean;
  sourceFiles: string[];
  createdAt: string;
  updatedAt: string;
}

interface TemplateMetadata {
  sourceFiles: string[];
  sourceHash: string;
  createdAt: string;
  updatedAt: string;
}

function getProductsRoot(): string {
  const configured = process.env.PRODUCTS_STORAGE_DIR || "./storage/products";
  return path.isAbsolute(configured) ? configured : path.resolve(process.cwd(), configured);
}

function getProductDir(productName: string): string {
  return path.join(getProductsRoot(), productName);
}

function getTemplateMetadataPath(productName: string): string {
  return path.join(getProductDir(productName), "template.json");
}

function getExtractedMaterialsPath(productName: string): string {
  return path.join(getProductDir(productName), "extracted_materials.md");
}

function readJson<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
  } catch {
    return null;
  }
}

function writeJson(filePath: string, data: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export function listProducts(): ProductTemplateInfo[] {
  const root = getProductsRoot();
  if (!fs.existsSync(root)) {
    return [];
  }
  const products: ProductTemplateInfo[] = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }
    const name = entry.name;
    const metadata = readJson<TemplateMetadata>(getTemplateMetadataPath(name));
    const hasExtractedMaterials = fs.existsSync(getExtractedMaterialsPath(name));
    products.push({
      name,
      hasExtractedMaterials,
      sourceFiles: metadata?.sourceFiles || [],
      createdAt: metadata?.createdAt || "",
      updatedAt: metadata?.updatedAt || ""
    });
  }
  return products.sort((a, b) => a.name.localeCompare(b.name));
}

export function getProductTemplate(productName: string): ProductTemplateInfo | null {
  const products = listProducts();
  return products.find((p) => p.name === productName) || null;
}

export function getExtractedMaterialsForProduct(productName: string): string | null {
  const filePath = getExtractedMaterialsPath(productName);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return filePath;
}

export function saveProductTemplate(
  productName: string,
  extractedMaterialsPath: string,
  sourceFiles: string[]
): void {
  const productDir = getProductDir(productName);
  fs.mkdirSync(productDir, { recursive: true });

  const targetPath = getExtractedMaterialsPath(productName);
  if (extractedMaterialsPath !== targetPath) {
    fs.copyFileSync(extractedMaterialsPath, targetPath);
  }

  const now = new Date().toISOString();
  const existing = readJson<TemplateMetadata>(getTemplateMetadataPath(productName));
  const metadata: TemplateMetadata = {
    sourceFiles,
    sourceHash: "",
    createdAt: existing?.createdAt || now,
    updatedAt: now
  };
  writeJson(getTemplateMetadataPath(productName), metadata);
}

export function copyProductTemplateToProject(projectId: string, productName: string): string | null {
  const sourcePath = getExtractedMaterialsPath(productName);
  if (!fs.existsSync(sourcePath)) {
    return null;
  }
  const outputsDir = getOutputsDir(projectId);
  fs.mkdirSync(outputsDir, { recursive: true });
  const targetPath = path.join(outputsDir, "extracted_materials.md");
  fs.copyFileSync(sourcePath, targetPath);
  return targetPath;
}
