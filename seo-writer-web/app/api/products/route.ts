import { NextResponse } from "next/server";
import { listProducts } from "@/lib/productTemplates";
import { listProjects } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  // Products from template system (Phase 0 saved materials)
  const templateProducts = listProducts();

  // Brand names from existing projects in DB
  const projects = listProjects();
  const brandSet = new Set<string>();
  for (const p of projects) {
    if (p.brand_name && p.brand_name.trim()) {
      brandSet.add(p.brand_name.trim());
    }
  }

  // Merge: template products take precedence, add DB brands that aren't in templates
  const templateNames = new Set(templateProducts.map((p) => p.name));
  const dbBrands = Array.from(brandSet)
    .filter((name) => !templateNames.has(name))
    .map((name) => ({
      name,
      hasExtractedMaterials: false,
      sourceFiles: [],
      createdAt: "",
      updatedAt: "",
    }));

  const products = [...templateProducts, ...dbBrands].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return NextResponse.json({ products });
}
