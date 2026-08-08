/**
 * Bloqueo de scroll compartido entre componentes (intro, menú móvil,
 * panel de reserva). Mantiene un contador para que un bloqueo no se libere
 * por culpa de otro mientras siga activo.
 */
type LockState = {
  count: number;
  scrollY: number;
  prevBodyPosition: string;
  prevBodyTop: string;
  prevBodyLeft: string;
  prevBodyRight: string;
  prevBodyWidth: string;
  prevBodyOverflow: string;
  prevHtmlPaddingRight: string;
  prevNavbarPaddingRight: string;
};

const state: LockState = {
  count: 0,
  scrollY: 0,
  prevBodyPosition: "",
  prevBodyTop: "",
  prevBodyLeft: "",
  prevBodyRight: "",
  prevBodyWidth: "",
  prevBodyOverflow: "",
  prevHtmlPaddingRight: "",
  prevNavbarPaddingRight: "",
};

function applyLockStyles() {
  const html = document.documentElement;
  const body = document.body;
  const navbar = document.getElementById("navbar");
  const scrollbarWidth = Math.max(
    window.innerWidth - html.clientWidth,
    0,
  );

  state.scrollY = window.scrollY;
  state.prevBodyPosition = body.style.position;
  state.prevBodyTop = body.style.top;
  state.prevBodyLeft = body.style.left;
  state.prevBodyRight = body.style.right;
  state.prevBodyWidth = body.style.width;
  state.prevBodyOverflow = body.style.overflow;
  state.prevHtmlPaddingRight = html.style.paddingRight;
  state.prevNavbarPaddingRight = navbar?.style.paddingRight ?? "";

  html.classList.add("mv-scroll-locked");
  body.style.position = "fixed";
  body.style.top = `-${state.scrollY}px`;
  body.style.left = "0";
  body.style.right = "0";
  body.style.width = "100%";
  body.style.overflow = "hidden";

  if (scrollbarWidth > 0) {
    html.style.paddingRight = `${scrollbarWidth}px`;
    if (navbar) navbar.style.paddingRight = `${scrollbarWidth}px`;
  }
}

function releaseLockStyles(options?: { restoreScroll?: boolean }) {
  const html = document.documentElement;
  const body = document.body;
  const navbar = document.getElementById("navbar");
  const restoreScroll = options?.restoreScroll !== false;

  html.classList.remove("mv-scroll-locked");
  html.style.paddingRight = state.prevHtmlPaddingRight;
  if (navbar) navbar.style.paddingRight = state.prevNavbarPaddingRight;

  body.style.position = state.prevBodyPosition;
  body.style.top = state.prevBodyTop;
  body.style.left = state.prevBodyLeft;
  body.style.right = state.prevBodyRight;
  body.style.width = state.prevBodyWidth;
  body.style.overflow = state.prevBodyOverflow;
  if (restoreScroll) {
    window.scrollTo(0, state.scrollY);
  }
}

export function lockScroll() {
  if (typeof window === "undefined") return;
  if (state.count === 0) applyLockStyles();
  state.count += 1;
}

export function unlockScroll() {
  if (typeof window === "undefined") return;
  if (state.count === 0) return;
  state.count -= 1;
  if (state.count === 0) releaseLockStyles({ restoreScroll: true });
}

export function resetScrollLock() {
  if (typeof window === "undefined") return;
  if (state.count === 0) return;
  state.count = 0;
  releaseLockStyles({ restoreScroll: true });
}

/** Libera bloqueos y deja el scroll arriba (navegación SPA). */
export function resetScrollLockToTop() {
  if (typeof window === "undefined") return;
  if (state.count > 0) {
    state.count = 0;
    releaseLockStyles({ restoreScroll: false });
  }
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  window.__mvLenis?.scrollTo(0, { immediate: true });
}
