"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { groupCatalogSections } from "@/lib/web-store/catalog-groups";
import type {
  WebStoreCategory,
  WebStoreProduct,
} from "@/lib/web-store/types";

import { TiendaEditorialGrid } from "./tienda-editorial-grid";
import { TiendaProductSheet } from "./tienda-product-sheet";

/** Fade del stage al filtrar. */
const FILTER_FADE_MS = 280;
/** Delay entre tarjetas al cambiar grilla ↔ carrusel. */
const LAYOUT_STAGGER_MS = 58;
/** Duración de la animación de cada tarjeta. */
const LAYOUT_CARD_MS = 420;
/** Tope de delays (listas largas no tardan eternamente). */
const LAYOUT_STAGGER_CAP = 12;

type ProductLayout = "grid" | "carousel";

type Props = {
  categories: WebStoreCategory[];
};

function layoutEnterDuration(productCount: number) {
  const steps = Math.min(Math.max(productCount, 1), LAYOUT_STAGGER_CAP);
  return (steps - 1) * LAYOUT_STAGGER_MS + LAYOUT_CARD_MS;
}

export function TiendaCatalog({ categories }: Props) {
  const sections = useMemo(
    () => groupCatalogSections(categories),
    [categories],
  );
  const defaultLayout: ProductLayout =
    sections.length === 1 ? "grid" : "carousel";
  const [pickerProduct, setPickerProduct] = useState<WebStoreProduct | null>(
    null,
  );

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
          defaultLayout={defaultLayout}
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
  defaultLayout,
  sectionIndex,
  onSelectProduct,
}: {
  sectionId: string;
  name: string;
  parentName: string | null;
  allProducts: WebStoreProduct[];
  filters: { id: string; name: string; products: WebStoreProduct[] }[];
  defaultLayout: ProductLayout;
  sectionIndex: number;
  onSelectProduct: (product: WebStoreProduct) => void;
}) {
  const showFilters = filters.length > 0;
  const [activeFilterId, setActiveFilterId] = useState("all");
  const [displayProducts, setDisplayProducts] = useState(allProducts);
  const [productLayout, setProductLayout] =
    useState<ProductLayout>(defaultLayout);
  const [layoutBusy, setLayoutBusy] = useState(false);
  const [staggerEnter, setStaggerEnter] = useState(false);
  const [stageKey, setStageKey] = useState("all");
  const [phase, setPhase] = useState<"in" | "out">("in");
  const pendingFilterRef = useRef("all");
  const pendingProductsRef = useRef(allProducts);
  const reducedMotionRef = useRef(false);
  const fadeTimerRef = useRef<number | null>(null);
  const layoutBusyTimerRef = useRef<number | null>(null);

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
    setProductLayout(defaultLayout);
    setStaggerEnter(false);
  }, [defaultLayout]);

  useEffect(() => {
    return () => {
      if (fadeTimerRef.current != null) {
        window.clearTimeout(fadeTimerRef.current);
      }
      if (layoutBusyTimerRef.current != null) {
        window.clearTimeout(layoutBusyTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!staggerEnter) return;
    const timer = window.setTimeout(() => {
      setStaggerEnter(false);
    }, layoutEnterDuration(displayProducts.length));
    return () => window.clearTimeout(timer);
  }, [staggerEnter, productLayout, displayProducts.length]);

  const requestLayoutChange = (next: ProductLayout) => {
    if (next === productLayout || layoutBusy) return;
    setLayoutBusy(true);
    setProductLayout(next);
    setStaggerEnter(!reducedMotionRef.current);
    setPhase("in");
    if (layoutBusyTimerRef.current != null) {
      window.clearTimeout(layoutBusyTimerRef.current);
    }
    layoutBusyTimerRef.current = window.setTimeout(() => {
      layoutBusyTimerRef.current = null;
      setLayoutBusy(false);
    }, layoutEnterDuration(displayProducts.length));
  };

  const applyFilter = (filterId: string) => {
    if (filterId === activeFilterId && phase === "in") return;
    if (layoutBusy) return;
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
      setStaggerEnter(false);
      return;
    }

    if (fadeTimerRef.current != null) {
      window.clearTimeout(fadeTimerRef.current);
    }
    setPhase("out");
    fadeTimerRef.current = window.setTimeout(() => {
      fadeTimerRef.current = null;
      setStaggerEnter(false);
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
          aria-busy={layoutBusy}
          disabled={layoutBusy}
          onClick={() => requestLayoutChange(nextLayout)}
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
          staggerEnter={staggerEnter}
          onSelectProduct={onSelectProduct}
        />
      </div>
    </section>
  );
}
