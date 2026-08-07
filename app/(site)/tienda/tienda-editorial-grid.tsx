"use client";

import { useEffect, useRef } from "react";

import type { WebStoreProduct } from "@/lib/web-store/types";
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
              key={product.id}
              product={product}
              onSelect={onSelectProduct}
            />
          ))}
        </ul>
        <ul ref={col2Ref} className="tienda-editorial__col tienda-editorial__col--2">
          {col2.map((product) => (
            <EditorialCard
              key={product.id}
              product={product}
              onSelect={onSelectProduct}
            />
          ))}
        </ul>
      </div>
    </div>
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
            {formatEuroFromCents(product.salePriceCents)}
          </span>
        </span>
      </button>
    </li>
  );
}
