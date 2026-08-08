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

type Props = {
  categories: WebStoreCategory[];
};

export function TiendaCatalog({ categories }: Props) {
  const sections = useMemo(
    () => groupCatalogSections(categories),
    [categories],
  );
  /** Una sola sección visible → grilla editorial también en móvil; varias → carrusel. */
  const productLayout = sections.length === 1 ? "grid" : "carousel";
  const [pickerProduct, setPickerProduct] = useState<WebStoreProduct | null>(
    null,
  );

  return (
    <>
      {sections.map((section) => (
        <CategorySection
          key={section.id}
          sectionId={section.id}
          name={section.name}
          allProducts={section.products}
          filters={section.filters}
          productLayout={productLayout}
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

function CategorySection({
  sectionId,
  name,
  allProducts,
  filters,
  productLayout,
  onSelectProduct,
}: {
  sectionId: string;
  name: string;
  allProducts: WebStoreProduct[];
  filters: { id: string; name: string; products: WebStoreProduct[] }[];
  productLayout: "grid" | "carousel";
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

  return (
    <section
      className="tienda-category"
      aria-labelledby={`tienda-cat-${sectionId}`}
    >
      <div className="tienda-category__head">
        <h2 id={`tienda-cat-${sectionId}`} className="tienda-category__title">
          {name}
        </h2>

        {showFilters ? (
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
          key={stageKey}
          products={displayProducts}
          layout={productLayout}
          onSelectProduct={onSelectProduct}
        />
      </div>
    </section>
  );
}
