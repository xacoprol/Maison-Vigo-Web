"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import {
  descriptionHasMoreContent,
  sanitizeProductDescriptionHtml,
} from "@/lib/web-store/description";

/** ~2–3 frases a 14px / line-height 1.6 */
const COLLAPSED_MAX_PX = 110;

type Props = {
  html: string | null;
};

export function TiendaProductDescription({ html }: Props) {
  const [expanded, setExpanded] = useState(false);
  const innerRef = useRef<HTMLDivElement>(null);
  const [heights, setHeights] = useState({ collapsed: 0, full: 0 });

  const fullHtml = useMemo(
    () => sanitizeProductDescriptionHtml(html),
    [html],
  );
  const likelyMore = useMemo(
    () => descriptionHasMoreContent(fullHtml),
    [fullHtml],
  );

  useEffect(() => {
    setExpanded(false);
  }, [fullHtml]);

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el || !fullHtml) {
      setHeights({ collapsed: 0, full: 0 });
      return;
    }
    const full = el.scrollHeight;
    const collapsed = Math.min(full, COLLAPSED_MAX_PX);
    setHeights({ collapsed, full });
  }, [fullHtml]);

  if (!fullHtml) return null;

  const canExpand = likelyMore && heights.full > heights.collapsed + 4;
  const maxHeight = expanded
    ? Math.max(heights.full, heights.collapsed) + 8
    : heights.collapsed || COLLAPSED_MAX_PX;

  return (
    <div className="tienda-sheet__desc">
      <div
        className={
          "tienda-sheet__desc-clip" +
          (expanded ? " is-expanded" : "") +
          (canExpand && !expanded ? " is-collapsed" : "")
        }
        style={{ maxHeight: maxHeight > 0 ? maxHeight : undefined }}
      >
        <div
          ref={innerRef}
          className="tienda-sheet__desc-prose"
          dangerouslySetInnerHTML={{ __html: fullHtml }}
        />
        {canExpand && !expanded ? (
          <div className="tienda-sheet__desc-fade">
            <button
              type="button"
              className="tienda-sheet__desc-more"
              aria-expanded={false}
              onClick={() => setExpanded(true)}
            >
              Ver más
            </button>
          </div>
        ) : null}
      </div>

      {canExpand && expanded ? (
        <button
          type="button"
          className="tienda-sheet__desc-more"
          aria-expanded={true}
          onClick={() => setExpanded(false)}
        >
          Ver menos
        </button>
      ) : null}
    </div>
  );
}
