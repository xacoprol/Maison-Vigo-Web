"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { groupCatalogSections } from "@/lib/web-store/catalog-groups";
import type {
  WebStoreCategory,
  WebStoreProduct,
} from "@/lib/web-store/types";

import { TiendaEditorialGrid } from "./tienda-editorial-grid";
import { TiendaProductSheet } from "./tienda-product-sheet";

const FILTER_FADE_MS = 280;

type ProductLayout = "grid" | "carousel";

type Props = {
  categories: WebStoreCategory[];
};

export function TiendaCatalog({ categories }: Props) {
  const sections = useMemo(
    () => groupCatalogSections(categories),
    [categories],
  );
  const defaultLayout: ProductLayout =
    sections.length === 1 ? "grid" : "carousel";
  const [productLayout, setProductLayout] =
    useState<ProductLayout>(defaultLayout);
  const [pickerProduct, setPickerProduct] = useState<WebStoreProduct | null>(
    null,
  );

  useEffect(() => {
    setProductLayout(sections.length === 1 ? "grid" : "carousel");
  }, [sections.length]);

  return (
    <>
      {sections.map((section, sectionIndex) => (
        <CategorySection
          key={section.id}
          sectionId={section.id}
          name={section.name}
          parentName={section.parentName}
          allProducts={section.products}
          filters={section.filters}
          productLayout={productLayout}
          onProductLayoutChange={setProductLayout}
          sectionIndex={sectionIndex}
          onSelectProduct={setPickerProduct}
        />
      ))}

      <TiendaProductSheet
        product={pickerProduct}
        open={pickerProduct != null}
        onClose={() => setPickerProduct(null)}
      />
    </>
  );
}

function LayoutToggleIcon({ mode }: { mode: ProductLayout }) {
  if (mode === "carousel") {
    // Ir a cuadrícula
    return (
      <svg
        viewBox="0 0 24 24"
        className="tienda-category__layout-icon"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        aria-hidden={true}
      >
        <rect x="3.25" y="3.25" width="7.5" height="7.5" rx="1.25" />
        <rect x="13.25" y="3.25" width="7.5" height="7.5" rx="1.25" />
        <rect x="3.25" y="13.25" width="7.5" height="7.5" rx="1.25" />
        <rect x="13.25" y="13.25" width="7.5" height="7.5" rx="1.25" />
      </svg>
    );
  }
  // Ir a carrusel: tres tarjetas horizontales
  return (
    <svg
      viewBox="0 0 24 24"
      className="tienda-category__layout-icon"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinejoin="round"
      aria-hidden={true}
    >
      <rect x="2.75" y="5.5" width="5.5" height="13" rx="1.4" />
      <rect x="9.25" y="5.5" width="5.5" height="13" rx="1.4" />
      <rect x="15.75" y="5.5" width="5.5" height="13" rx="1.4" />
    </svg>
  );
}

function CategorySection({
  sectionId,
  name,
  parentName,
  allProducts,
  filters,
  productLayout,
  onProductLayoutChange,
  sectionIndex,
  onSelectProduct,
}: {
  sectionId: string;
  name: string;
  parentName: string | null;
  allProducts: WebStoreProduct[];
  filters: { id: string; name: string; products: WebStoreProduct[] }[];
  productLayout: ProductLayout;
  onProductLayoutChange: (layout: ProductLayout) => void;
  sectionIndex: number;
  onSelectProduct: (product: WebStoreProduct) => void;
}) {
  const showFilters = filters.length > 0;
  const [activeFilterId, setActiveFilterId] = useState("all");
  const [displayProducts, setDisplayProducts] = useState(allProducts);
  const [stageKey, setStageKey] = useState("all");
  const [phase, setPhase] = useState<"in" | "out">("in");
  const pendingFilterRef = useRef("all");
  const pendingProductsRef = useRef(allProducts);
  const reducedMotionRef = useRef(false);
  const fadeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
  }, []);

  useEffect(() => {
    if (fadeTimerRef.current != null) {
      window.clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
    setDisplayProducts(allProducts);
    setActiveFilterId("all");
    setStageKey("all");
    setPhase("in");
    pendingFilterRef.current = "all";
    pendingProductsRef.current = allProducts;
  }, [allProducts]);

  useEffect(() => {
    return () => {
      if (fadeTimerRef.current != null) {
        window.clearTimeout(fadeTimerRef.current);
      }
    };
  }, []);

  const applyFilter = (filterId: string) => {
    if (filterId === activeFilterId && phase === "in") return;
    const next =
      filterId === "all"
        ? allProducts
        : (filters.find((f) => f.id === filterId)?.products ?? allProducts);
    setActiveFilterId(filterId);
    pendingFilterRef.current = filterId;
    pendingProductsRef.current = next;

    if (reducedMotionRef.current) {
      setDisplayProducts(next);
      setStageKey(filterId);
      setPhase("in");
      return;
    }

    if (fadeTimerRef.current != null) {
      window.clearTimeout(fadeTimerRef.current);
    }
    setPhase("out");
    fadeTimerRef.current = window.setTimeout(() => {
      fadeTimerRef.current = null;
      setDisplayProducts(pendingProductsRef.current);
      setStageKey(pendingFilterRef.current);
      requestAnimationFrame(() => setPhase("in"));
    }, FILTER_FADE_MS);
  };

  const activeFilter =
    activeFilterId !== "all"
      ? filters.find((f) => f.id === activeFilterId)
      : undefined;
  const title = (() => {
    if (!activeFilter) return name;
    const isSubcategory = !activeFilter.id.startsWith("infer:");
    if (!isSubcategory) return name;
    const parent = parentName?.trim() || name.split(" · ")[0]?.trim() || name;
    const child = activeFilter.name.trim();
    if (!child || parent.toLowerCase() === child.toLowerCase()) return parent;
    return `${parent} · ${child}`;
  })();
  const isOdd = sectionIndex % 2 === 0;
  const showFilterBar = showFilters && !isOdd;
  const nextLayout: ProductLayout =
    productLayout === "carousel" ? "grid" : "carousel";
  const layoutLabel =
    productLayout === "carousel" ? "Ver cuadrícula" : "Ver carrusel";

  return (
    <section
      className={
        "tienda-category" + (isOdd ? " tienda-category--odd" : "")
      }
      aria-labelledby={`tienda-cat-${sectionId}`}
    >
      <div className="tienda-category__head">
        <h2 id={`tienda-cat-${sectionId}`} className="tienda-category__title">
          {title}
        </h2>

        <button
          type="button"
          className="tienda-category__layout-toggle"
          aria-label={layoutLabel}
          title={layoutLabel}
          onClick={() => onProductLayoutChange(nextLayout)}
        >
          <LayoutToggleIcon mode={productLayout} />
        </button>

        {showFilterBar ? (
          <div
            className="tienda-category__filters"
            role="toolbar"
            aria-label={`Filtrar ${name}`}
          >
            <button
              type="button"
              className={
                "tienda-category__filter" +
                (activeFilterId === "all"
                  ? " tienda-category__filter--active"
                  : "")
              }
              aria-pressed={activeFilterId === "all"}
              onClick={() => applyFilter("all")}
            >
              Todos
            </button>
            {filters.map((filter) => {
              const active = activeFilterId === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  className={
                    "tienda-category__filter" +
                    (active ? " tienda-category__filter--active" : "")
                  }
                  aria-pressed={active}
                  onClick={() => applyFilter(filter.id)}
                >
                  {filter.name}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <div
        className={
          "tienda-category__stage" +
          (phase === "out" ? " tienda-category__stage--out" : "")
        }
      >
        <TiendaEditorialGrid
          key={`${stageKey}-${productLayout}`}
          products={displayProducts}
          layout={productLayout}
          sectionIndex={sectionIndex}
          onSelectProduct={onSelectProduct}
        />
      </div>
    </section>
  );
}
