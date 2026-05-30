/** Extrae un único id de sección desde href o location.hash (evita #a#b). */
export function sectionIdFromHash(hrefOrHash: string): string | null {
  const raw = hrefOrHash.trim();
  if (!raw) return null;

  let fragment = raw;
  if (raw.includes("://") || raw.startsWith("/")) {
    try {
      fragment = new URL(raw, window.location.origin).hash;
    } catch {
      return null;
    }
  } else if (!fragment.startsWith("#")) {
    fragment = `#${fragment}`;
  }

  const parts = fragment.replace(/^#/, "").split("#").filter(Boolean);
  const id = parts[parts.length - 1];
  return id || null;
}

export function parseHomeSectionLink(
  href: string,
): { pathname: string; sectionId: string } | null {
  try {
    const url = new URL(href, window.location.origin);
    const sectionId = sectionIdFromHash(url.hash);
    if (!sectionId) return null;
    return { pathname: url.pathname, sectionId };
  } catch {
    return null;
  }
}

export function isHomePathname(pathname: string) {
  return pathname === "/" || pathname === "";
}

/** URL con un solo hash: /#servicios */
export function buildSectionUrl(sectionId: string, pathname = "/") {
  const base = pathname === "/" ? "/" : pathname;
  return `${base}#${sectionId}`;
}

/** Corrige #concepto#servicios → #servicios */
export function sanitizeUrlHash() {
  if (typeof window === "undefined") return;
  const id = sectionIdFromHash(window.location.hash);
  if (!id) return;

  const parts = window.location.hash.replace(/^#/, "").split("#").filter(Boolean);
  if (parts.length <= 1 && window.location.hash === `#${id}`) return;

  const next = buildSectionUrl(id, window.location.pathname);
  history.replaceState(history.state, "", next);
}
