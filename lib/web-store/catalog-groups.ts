import type { WebStoreCategory, WebStoreProduct } from "./types";

export type CatalogSubcategoryFilter = {
  id: string;
  name: string;
  products: WebStoreProduct[];
};

export type CatalogSection = {
  id: string;
  name: string;
  slug: string;
  /** Todos los productos de la sección (filtro «Todos»). */
  products: WebStoreProduct[];
  /** Subcategorías reales o inferidas; vacío si no hay filtro útil. */
  filters: CatalogSubcategoryFilter[];
};

function childLabel(category: WebStoreCategory): string {
  if (category.parentId && category.name.includes(" · ")) {
    return category.name.split(" · ").slice(1).join(" · ").trim() || category.name;
  }
  return category.name;
}

function parentLabel(category: WebStoreCategory): string {
  if (category.parentId && category.name.includes(" · ")) {
    return category.name.split(" · ")[0]!.trim() || category.name;
  }
  return category.name;
}

/** Colgante ≡ Collar (misma familia de pieza). */
function normalizeFilterLabel(raw: string): string {
  const name = raw.trim();
  if (!name) return name;
  if (/^colgantes?$/i.test(name) || /^collares?$/i.test(name)) {
    return "Collar";
  }
  return name;
}

function mergeFiltersByLabel(
  filters: CatalogSubcategoryFilter[],
): CatalogSubcategoryFilter[] {
  const buckets = new Map<string, CatalogSubcategoryFilter>();
  for (const filter of filters) {
    const name = normalizeFilterLabel(filter.name);
    const key = name.toLowerCase();
    const existing = buckets.get(key);
    if (!existing) {
      buckets.set(key, {
        id: filter.id.startsWith("infer:")
          ? `infer:${key}`
          : filter.id,
        name,
        products: [...filter.products],
      });
      continue;
    }
    const seen = new Set(existing.products.map((p) => p.id));
    for (const product of filter.products) {
      if (!seen.has(product.id)) {
        existing.products.push(product);
        seen.add(product.id);
      }
    }
  }
  return Array.from(buckets.values()).sort((a, b) =>
    a.name.localeCompare(b.name, "es"),
  );
}

/** Agrupa por tipo a partir de la primera palabra del nombre (p. ej. Collar / Pulsera). */
function inferFiltersFromNames(
  products: WebStoreProduct[],
): CatalogSubcategoryFilter[] {
  const buckets = new Map<string, WebStoreProduct[]>();
  for (const product of products) {
    const token = product.name.trim().split(/\s+/)[0] ?? "";
    if (!token) continue;
    const label = normalizeFilterLabel(token);
    const list = buckets.get(label) ?? [];
    list.push(product);
    buckets.set(label, list);
  }
  if (buckets.size < 2) return [];
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b, "es"))
    .map(([name, items]) => ({
      id: `infer:${name.toLowerCase()}`,
      name,
      products: items,
    }));
}

/**
 * Agrupa el catálogo plano del API en secciones padre + filtros de subcategoría.
 * Si no hay subcategorías reales, infiere filtros por prefijo del nombre del producto.
 */
export function groupCatalogSections(
  categories: WebStoreCategory[],
): CatalogSection[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const childrenOf = new Map<string, WebStoreCategory[]>();
  const roots: WebStoreCategory[] = [];
  const orphans: WebStoreCategory[] = [];

  for (const category of categories) {
    if (!category.parentId) {
      roots.push(category);
      continue;
    }
    if (byId.has(category.parentId)) {
      const list = childrenOf.get(category.parentId) ?? [];
      list.push(category);
      childrenOf.set(category.parentId, list);
      continue;
    }
    orphans.push(category);
  }

  const sections: CatalogSection[] = [];

  for (const root of roots) {
    const children = childrenOf.get(root.id) ?? [];
    if (children.length > 0) {
      const filters = mergeFiltersByLabel(
        children.map((child) => ({
          id: child.id,
          name: childLabel(child),
          products: child.products,
        })),
      );
      const childProducts = filters.flatMap((f) => f.products);
      const seen = new Set(childProducts.map((p) => p.id));
      const own = root.products.filter((p) => !seen.has(p.id));
      const products = [...own, ...childProducts];
      if (!products.length) continue;
      sections.push({
        id: root.id,
        name: root.name,
        slug: root.slug,
        products,
        filters,
      });
      continue;
    }

    if (!root.products.length) continue;
    sections.push({
      id: root.id,
      name: root.name,
      slug: root.slug,
      products: root.products,
      filters: inferFiltersFromNames(root.products),
    });
  }

  // Subcategorías cuyo padre no es público: una sección por grupo de padre.
  const orphanGroups = new Map<string, WebStoreCategory[]>();
  for (const orphan of orphans) {
    const key = orphan.parentId ?? orphan.id;
    const list = orphanGroups.get(key) ?? [];
    list.push(orphan);
    orphanGroups.set(key, list);
  }

  for (const group of orphanGroups.values()) {
    if (group.length === 1) {
      const only = group[0]!;
      if (!only.products.length) continue;
      sections.push({
        id: only.id,
        name: parentLabel(only),
        slug: only.slug,
        products: only.products,
        filters:
          only.parentId != null
            ? mergeFiltersByLabel([
                {
                  id: only.id,
                  name: childLabel(only),
                  products: only.products,
                },
              ])
            : inferFiltersFromNames(only.products),
      });
      continue;
    }

    const filters = mergeFiltersByLabel(
      group.map((child) => ({
        id: child.id,
        name: childLabel(child),
        products: child.products,
      })),
    );
    const products = filters.flatMap((f) => f.products);
    if (!products.length) continue;
    const head = group[0]!;
    sections.push({
      id: head.parentId ?? head.id,
      name: parentLabel(head),
      slug: head.slug,
      products,
      filters,
    });
  }

  return sections;
}
