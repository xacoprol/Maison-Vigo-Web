"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import type { WebStoreProduct } from "@/lib/web-store/types";
import {
  minPersonalizationExtraCents,
  productHasPricedPersonalization,
} from "@/lib/web-store/personalization";
import { formatEuroFromCents, webStoreFileUrl } from "@/lib/web-store/utils";

const DESKTOP_MIN = 900;
const COL1_PARALLAX_VH = 18;
const COL2_PARALLAX_VH = 28;

type Props = {
  products: WebStoreProduct[];
  onSelectProduct: (product: WebStoreProduct) => void;
};

export function TiendaEditorialGrid({ products, onSelectProduct }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const col1Ref = useRef<HTMLUListElement>(null);
  const col2Ref = useRef<HTMLUListElement>(null);

  const col1 = products.filter((_, index) => index % 2 === 0);
  const col2 = products.filter((_, index) => index % 2 === 1);

  useEffect(() => {
    const wrap = wrapRef.current;
    const c1 = col1Ref.current;
    const c2 = col2Ref.current;
    if (!wrap || !c1 || !c2) return;

    const desktopMq = window.matchMedia(`(min-width: ${DESKTOP_MIN}px)`);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const clear = () => {
      c1.style.transform = "";
      c2.style.transform = "";
    };

    if (!desktopMq.matches || reduced) {
      clear();
      return;
    }

    const update = () => {
      const vh = window.innerHeight;
      const rect = wrap.getBoundingClientRect();
      const range = wrap.offsetHeight + vh;
      const progress =
        range > 0 ? Math.min(Math.max((vh - rect.top) / range, 0), 1) : 0;
      const parallaxY = (sizeVh: number) =>
        ((0.5 - progress) * 2 * sizeVh * vh) / 100;
      c1.style.transform = `translate3d(0, ${parallaxY(COL1_PARALLAX_VH)}px, 0)`;
      c2.style.transform = `translate3d(0, ${parallaxY(COL2_PARALLAX_VH)}px, 0)`;
    };

    window.addEventListener("mv-scroll", update, { passive: true });
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    desktopMq.addEventListener("change", update);
    update();

    return () => {
      window.removeEventListener("mv-scroll", update);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      desktopMq.removeEventListener("change", update);
      clear();
    };
  }, [products.length]);

  return (
    <div ref={wrapRef} className="tienda-editorial">
      <div className="tienda-editorial__columns">
        <ul ref={col1Ref} className="tienda-editorial__col tienda-editorial__col--1">
          {col1.map((product) => (
            <EditorialCard
              key={`desk-${product.id}`}
              product={product}
              onSelect={onSelectProduct}
            />
          ))}
        </ul>
        <ul ref={col2Ref} className="tienda-editorial__col tienda-editorial__col--2">
          {col2.map((product) => (
            <EditorialCard
              key={`desk-${product.id}`}
              product={product}
              onSelect={onSelectProduct}
            />
          ))}
        </ul>
      </div>

      <EditorialMobileCarousel
        products={products}
        onSelectProduct={onSelectProduct}
      />
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

  const scrollByColumn = (direction: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const columns = Array.from(el.children).filter(
      (node, index): node is HTMLElement =>
        node instanceof HTMLElement && index % 2 === 0,
    );
    if (!columns.length) {
      el.scrollBy({
        left: direction * Math.max(el.clientWidth * 0.5, 120),
        behavior: "smooth",
      });
      return;
    }

    const scrollLeft = el.scrollLeft;
    let currentIndex = 0;
    for (let i = 0; i < columns.length; i++) {
      if (columns[i]!.offsetLeft <= scrollLeft + 8) currentIndex = i;
    }
    const targetIndex = Math.max(
      0,
      Math.min(columns.length - 1, currentIndex + direction),
    );
    columns[targetIndex]!.scrollIntoView({
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

  return (
    <div ref={shellRef} className="tienda-editorial__carousel-shell">
      {hasOverflow ? (
        <div className="tienda-editorial__carousel-nav" aria-hidden={false}>
          <CarouselArrow
            direction="prev"
            disabled={!canScrollLeft}
            onClick={() => scrollByColumn(-1)}
          />
          <CarouselArrow
            direction="next"
            disabled={!canScrollRight}
            onClick={() => scrollByColumn(1)}
          />
        </div>
      ) : null}

      <ul
        ref={scrollerRef}
        className="tienda-editorial__carousel"
        aria-label="Productos"
      >
        {products.map((product) => (
          <EditorialCard
            key={`mob-${product.id}`}
            product={product}
            onSelect={selectProduct}
          />
        ))}
      </ul>
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
  const src =
    direction === "prev"
      ? "/assets/images/iconos/arrow-left.svg"
      : "/assets/images/iconos/arrow-right.svg";
  const label =
    direction === "prev" ? "Productos anteriores" : "Productos siguientes";

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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        width={14}
        height={14}
        className="tienda-editorial__carousel-arrow-icon"
      />
    </button>
  );
}

function EditorialCard({
  product,
  onSelect,
}: {
  product: WebStoreProduct;
  onSelect: (product: WebStoreProduct) => void;
}) {
  const primary = webStoreFileUrl(product.photos[0]?.url);
  const secondary = webStoreFileUrl(product.photos[1]?.url);
  const hasHoverSwap = Boolean(primary && secondary && secondary !== primary);
  const priced = productHasPricedPersonalization(product.personalization);
  const fromCents =
    product.salePriceCents + minPersonalizationExtraCents(product.personalization);

  return (
    <li className="tienda-editorial__card">
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
          <span className="tienda-editorial__name">{product.name}</span>
          <span className="tienda-editorial__price">
            {priced ? "Desde " : ""}
            {formatEuroFromCents(fromCents)}
          </span>
        </span>
      </button>
    </li>
  );
}
