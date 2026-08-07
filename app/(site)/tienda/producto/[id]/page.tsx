import { notFound } from "next/navigation";

import { fetchWebStoreCatalog } from "@/lib/web-store/api";
import type { WebStoreProduct } from "@/lib/web-store/types";

import { ProductBuyPanel } from "./product-buy-panel";

export const dynamic = "force-dynamic";

async function findProduct(id: string): Promise<WebStoreProduct | null> {
  const catalog = await fetchWebStoreCatalog();
  for (const category of catalog.categories ?? []) {
    const hit = category.products.find((p) => p.id === id);
    if (hit) return hit;
  }
  return null;
}

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function TiendaProductPage({ params }: PageProps) {
  const { id } = await params;
  let product: WebStoreProduct | null = null;
  try {
    product = await findProduct(id);
  } catch {
    product = null;
  }
  if (!product) notFound();

  return (
    <>
      <p className="tienda-eyebrow">Producto</p>
      <h1 className="tienda-title">{product.name}</h1>
      <ProductBuyPanel product={product} />
    </>
  );
}
