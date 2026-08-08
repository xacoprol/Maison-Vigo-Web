"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";

import type { WebStoreProduct } from "@/lib/web-store/types";
import {
  minPersonalizationExtraCents,
  productHasPricedPersonalization,
} from "@/lib/web-store/personalization";
import {
  formatEuroFromCents,
  kibbleCardDisplayName,
  storeProductSalePriceRange,
  webStoreFileUrl,
} from "@/lib/web-store/utils";

const DESKTOP_MIN = 900;
/** Amplitud de parallax por columna (vh) — categorías impares. */
const DESKTOP_PARALLAX_VH = [36, 58, 82] as const;
/** Categorías pares: parallax suave; col 1 no sube tanto hacia el título. */
const DESKTOP_PARALLAX_VH_FLIP = [22, 48, 32] as const;
/** Amplitud de parallax por columna (vh), móvil en layout grilla. */
const MOBILE_PARALLAX_VH = [18, 30] as const;
const MOBILE_PARALLAX_VH_FLIP = [12, 24] as const;

function subscribeDesktopMq(onChange: () => void) {
  const mq = window.matchMedia(`(min-width: ${DESKTOP_MIN}px)`);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getDesktopColumnCount() {
  return window.matchMedia(`(min-width: ${DESKTOP_MIN}px)`).matches ? 3 : 2;
}

function getIsDesktop() {
  return window.matchMedia(`(min-width: ${DESKTOP_MIN}px)`).matches;
}

function useEditorialColumnCount() {
  return useSyncExternalStore(
    subscribeDesktopMq,
    getDesktopColumnCount,
    () => 3,
  );
}

function useIsDesktop() {
  return useSyncExternalStore(subscribeDesktopMq, getIsDesktop, () => true);
}

type Props = {
  products: WebStoreProduct[];
  onSelectProduct: (product: WebStoreProduct) => void;
  /** Con una sola categoría visible: grilla editorial también en móvil. */
  layout?: "grid" | "carousel";
  /** Índice 0-based de la sección; pares (2.ª, 4.ª…) invierten el desfase. */
  sectionIndex?: number;
  /** Entrada escalonada (cambio grilla ↔ carrusel). */
  staggerEnter?: boolean;
};

export function TiendaEditorialGrid({
  products,
  onSelectProduct,
  layout = "carousel",
  sectionIndex = 0,
  staggerEnter = false,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const colRefs = useRef<(HTMLUListElement | null)[]>([]);
  const asGrid = layout === "grid";
  const staggerFlip = sectionIndex % 2 === 1;
  const columnCount = useEditorialColumnCount();
  const isDesktop = useIsDesktop();
  /** En móvil + carrusel no montamos columnas: hinchaban la altura de la sección. */
  const showColumns = asGrid || isDesktop;
  const showCarousel = !asGrid && !isDesktop;

  const columns = Array.from({ length: columnCount }, (_, col) =>
    products
      .map((product, index) => ({ product, index }))
      .filter(({ index }) => index % columnCount === col),
  );

  useEffect(() => {
    if (!showColumns) return;
    const wrap = wrapRef.current;
    const cols = colRefs.current
      .slice(0, columnCount)
      .filter((el): el is HTMLUListElement => el != null);
    if (!wrap || cols.length !== columnCount) return;

    const desktopMq = window.matchMedia(`(min-width: ${DESKTOP_MIN}px)`);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const clear = () => {
      for (const col of cols) col.style.transform = "";
      wrap.style.marginTop = "";
      wrap.style.marginBottom = "";
    };

    // Carrusel móvil: sin parallax. Grilla editorial (móvil o escritorio): sí.
    const parallaxEnabled = () =>
      !reduced && (desktopMq.matches || asGrid);

    if (!parallaxEnabled()) {
      clear();
      return;
    }

    const update = () => {
      if (!parallaxEnabled()) {
        clear();
        return;
      }
      const desktop = desktopMq.matches;
      const amplitudes = desktop
        ? staggerFlip
          ? DESKTOP_PARALLAX_VH_FLIP
          : DESKTOP_PARALLAX_VH
        : staggerFlip
          ? MOBILE_PARALLAX_VH_FLIP
          : MOBILE_PARALLAX_VH;
      const vh = window.innerHeight;
      const rect = wrap.getBoundingClientRect();
      const range = wrap.offsetHeight + vh;
      const progress =
        range > 0 ? Math.min(Math.max((vh - rect.top) / range, 0), 1) : 0;
      const parallaxY = (sizeVh: number) =>
        ((0.5 - progress) * 2 * sizeVh * vh) / 100;

      let minY = 0;
      let maxY = 0;
      let firstY = 0;
      cols.forEach((col, index) => {
        const sizeVh = amplitudes[Math.min(index, amplitudes.length - 1)] ?? 0;
        const y = parallaxY(sizeVh);
        col.style.transform = `translate3d(0, ${y}px, 0)`;
        if (index === 0) firstY = y;
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      });
      if (maxY > 0) {
        // Móvil: compensar solo el empujón de la col 1 (quita el negro bajo el H2)
        // sin subirla encima del título. Escritorio: pull completo / parcial en pares.
        const pull = !desktop
          ? Math.max(0, firstY)
          : staggerFlip
            ? maxY * 0.35
            : maxY;
        wrap.style.marginTop = `${-pull}px`;
      } else {
        wrap.style.marginTop = "";
      }
      wrap.style.marginBottom = minY < 0 ? `${minY}px` : "";
    };

    const onMqChange = () => {
      if (!parallaxEnabled()) {
        clear();
        return;
      }
      update();
    };

    window.addEventListener("mv-scroll", update, { passive: true });
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    desktopMq.addEventListener("change", onMqChange);
    update();

    return () => {
      window.removeEventListener("mv-scroll", update);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      desktopMq.removeEventListener("change", onMqChange);
      clear();
    };
  }, [asGrid, columnCount, products.length, staggerFlip, showColumns]);

  return (
    <div
      ref={wrapRef}
      className={
        "tienda-editorial" +
        (asGrid ? " tienda-editorial--grid" : " tienda-editorial--carousel") +
        (staggerFlip ? " tienda-editorial--stagger-flip" : "") +
        (staggerEnter ? " tienda-editorial--enter" : "") +
        ` tienda-editorial--cols-${columnCount}`
      }
    >
      {showColumns ? (
        <div className="tienda-editorial__columns">
          {columns.map((columnProducts, colIndex) => (
            <ul
              key={`col-${columnCount}-${colIndex}`}
              ref={(node) => {
                colRefs.current[colIndex] = node;
              }}
              className={
                "tienda-editorial__col" +
                ` tienda-editorial__col--${colIndex + 1}`
              }
            >
              {columnProducts.map(({ product, index }) => (
                <EditorialCard
                  key={`desk-${product.id}`}
                  product={product}
                  staggerIndex={index}
                  onSelect={onSelectProduct}
                />
              ))}
            </ul>
          ))}
        </div>
      ) : null}

      {showCarousel ? (
        <EditorialMobileCarousel
          products={products}
          onSelectProduct={onSelectProduct}
        />
      ) : null}
    </div>
  );
}

function EditorialMobileCarousel({
  products,
  onSelectProduct,
}: {
  products: WebStoreProduct[];
  onSelectProduct: (product: WebStoreProduct) => void;
}) {
  const shellRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLUListElement>(null);
  const dragMovedRef = useRef(false);
  const lenisPausedRef = useRef(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);

  const pauseLenis = useCallback(() => {
    if (lenisPausedRef.current) return;
    window.__mvLenis?.stop();
    lenisPausedRef.current = true;
  }, []);

  const resumeLenis = useCallback(() => {
    if (!lenisPausedRef.current) return;
    window.__mvLenis?.start();
    lenisPausedRef.current = false;
  }, []);

  const updateScrollState = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const overflow = scrollWidth > clientWidth + 2;
    setHasOverflow(overflow);
    setCanScrollLeft(overflow && scrollLeft > 4);
    setCanScrollRight(overflow && scrollLeft < scrollWidth - clientWidth - 4);
  }, []);

  useLayoutEffect(() => {
    updateScrollState();
    const id = requestAnimationFrame(updateScrollState);
    return () => cancelAnimationFrame(id);
  }, [products.length, updateScrollState]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      ro.disconnect();
    };
  }, [updateScrollState]);

  useEffect(() => {
    const el = scrollerRef.current;
    const shell = shellRef.current;
    if (!el || !shell) return;

    let startX = 0;
    let startY = 0;
    let horizontal = false;

    const setDragging = (on: boolean) => {
      shell.closest(".tienda-editorial")?.classList.toggle("is-dragging", on);
      el.classList.toggle("is-dragging", on);
    };

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      const touch = event.touches[0]!;
      startX = touch.clientX;
      startY = touch.clientY;
      horizontal = false;
      dragMovedRef.current = false;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      const touch = event.touches[0]!;
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      if (!horizontal) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        if (Math.abs(dy) >= Math.abs(dx)) return;
        horizontal = true;
        dragMovedRef.current = true;
        setDragging(true);
        pauseLenis();
      }
    };

    const onTouchEnd = () => {
      setDragging(false);
      resumeLenis();
      horizontal = false;
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
      setDragging(false);
      resumeLenis();
    };
  }, [pauseLenis, resumeLenis, products.length]);

  const scrollBySlide = (direction: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const slides = Array.from(el.children).filter(
      (node): node is HTMLElement => node instanceof HTMLElement,
    );
    if (!slides.length) return;
    const scrollLeft = el.scrollLeft;
    let currentIndex = 0;
    for (let i = 0; i < slides.length; i++) {
      if (slides[i]!.offsetLeft <= scrollLeft + 8) currentIndex = i;
    }
    const targetIndex = Math.max(
      0,
      Math.min(slides.length - 1, currentIndex + direction),
    );
    slides[targetIndex]!.scrollIntoView({
      behavior: "smooth",
      inline: "start",
      block: "nearest",
    });
  };

  const selectProduct = (product: WebStoreProduct) => {
    if (dragMovedRef.current) {
      dragMovedRef.current = false;
      return;
    }
    onSelectProduct(product);
  };

  const showSwipeHint = products.length > 2 && hasOverflow;

  return (
    <div ref={shellRef} className="tienda-editorial__carousel-shell">
      <div className="tienda-editorial__carousel-frame">
        {hasOverflow ? (
          <div className="tienda-editorial__carousel-nav" aria-hidden={false}>
            <CarouselArrow
              direction="prev"
              disabled={!canScrollLeft}
              onClick={() => scrollBySlide(-1)}
            />
            <CarouselArrow
              direction="next"
              disabled={!canScrollRight}
              onClick={() => scrollBySlide(1)}
            />
          </div>
        ) : null}

        <ul
          ref={scrollerRef}
          className="tienda-editorial__carousel"
          aria-label="Productos"
        >
          {products.map((product, index) => (
            <EditorialCard
              key={`mob-${product.id}`}
              product={product}
              staggerIndex={index}
              onSelect={selectProduct}
            />
          ))}
        </ul>
      </div>

      {showSwipeHint ? (
        <div
          className="tienda-editorial__carousel-hint"
          role="img"
          aria-label="Desliza para ver más"
        >
          <span className="tienda-editorial__carousel-hint-inner">
            <span
              className="tienda-editorial__carousel-hint-line tienda-editorial__carousel-hint-line--left"
              aria-hidden={true}
            />
            <span className="tienda-editorial__carousel-hint-pill">
              Desliza
              <svg
                viewBox="0 0 24 24"
                className="tienda-editorial__carousel-hint-chevron"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden={true}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </span>
            <span
              className="tienda-editorial__carousel-hint-line tienda-editorial__carousel-hint-line--right"
              aria-hidden={true}
            />
          </span>
        </div>
      ) : null}
    </div>
  );
}

function CarouselArrow({
  direction,
  disabled,
  onClick,
}: {
  direction: "prev" | "next";
  disabled?: boolean;
  onClick: () => void;
}) {
  const label =
    direction === "prev" ? "Ver anteriores" : "Ver siguientes";

  return (
    <button
      type="button"
      className={
        "tienda-editorial__carousel-arrow" +
        (direction === "prev"
          ? " tienda-editorial__carousel-arrow--prev"
          : " tienda-editorial__carousel-arrow--next")
      }
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      <svg
        viewBox="0 0 24 24"
        className="tienda-editorial__carousel-arrow-icon"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden={true}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d={direction === "prev" ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"}
        />
      </svg>
    </button>
  );
}

function EditorialCard({
  product,
  onSelect,
  staggerIndex = 0,
}: {
  product: WebStoreProduct;
  onSelect: (product: WebStoreProduct) => void;
  staggerIndex?: number;
}) {
  const primary = webStoreFileUrl(product.photos[0]?.url);
  const secondary = webStoreFileUrl(product.photos[1]?.url);
  const hasHoverSwap = Boolean(primary && secondary && secondary !== primary);
  const priced = productHasPricedPersonalization(product.personalization);
  const { min: priceMin, max: priceMax } = storeProductSalePriceRange(product);
  const fromCents = priceMin + minPersonalizationExtraCents(product.personalization);
  const showDesde =
    priced || (product.variants.length > 0 && priceMax !== priceMin);
  const priceLabel =
    fromCents > 0
      ? `${showDesde ? "Desde " : ""}${formatEuroFromCents(fromCents)}`
      : null;
  const stagger = Math.min(Math.max(staggerIndex, 0), 12);

  return (
    <li
      className="tienda-editorial__card"
      style={{ "--tienda-stagger": stagger } as CSSProperties}
    >
      <button
        type="button"
        className={
          "tienda-editorial__link" +
          (hasHoverSwap ? " tienda-editorial__link--swap" : "")
        }
        onClick={() => onSelect(product)}
      >
        <span className="tienda-editorial__media" aria-hidden={true}>
          {primary ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={primary}
              alt=""
              className="tienda-editorial__img tienda-editorial__img--primary"
            />
          ) : null}
          {hasHoverSwap ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={secondary!}
              alt=""
              className="tienda-editorial__img tienda-editorial__img--secondary"
            />
          ) : null}
        </span>
        <span className="tienda-editorial__copy">
          <span className="tienda-editorial__name">
            {kibbleCardDisplayName(product)}
          </span>
          {priceLabel ? (
            <span className="tienda-editorial__price">{priceLabel}</span>
          ) : null}
        </span>
      </button>
    </li>
  );
}
