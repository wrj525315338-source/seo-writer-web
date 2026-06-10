import { NextResponse } from "next/server";
import { listProducts } from "@/lib/productTemplates";

export const runtime = "nodejs";

export async function GET() {
  const products = listProducts();
  return NextResponse.json({ products });
}
