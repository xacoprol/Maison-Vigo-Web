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
  prevBodyPaddingRight: string;
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
  prevBodyPaddingRight: "",
};

function applyLockStyles() {
  const body = document.body;
  const scrollbarWidth = Math.max(
    window.innerWidth - document.documentElement.clientWidth,
    0,
  );
  state.scrollY = window.scrollY;
  state.prevBodyPosition = body.style.position;
  state.prevBodyTop = body.style.top;
  state.prevBodyLeft = body.style.left;
  state.prevBodyRight = body.style.right;
  state.prevBodyWidth = body.style.width;
  state.prevBodyOverflow = body.style.overflow;
  state.prevBodyPaddingRight = body.style.paddingRight;
  body.style.position = "fixed";
  body.style.top = `-${state.scrollY}px`;
  body.style.left = "0";
  body.style.right = "0";
  body.style.width = "100%";
  body.style.overflow = "hidden";
  if (scrollbarWidth > 0) {
    body.style.paddingRight = `${scrollbarWidth}px`;
  }
}

function releaseLockStyles() {
  const body = document.body;
  body.style.position = state.prevBodyPosition;
  body.style.top = state.prevBodyTop;
  body.style.left = state.prevBodyLeft;
  body.style.right = state.prevBodyRight;
  body.style.width = state.prevBodyWidth;
  body.style.overflow = state.prevBodyOverflow;
  body.style.paddingRight = state.prevBodyPaddingRight;
  window.scrollTo(0, state.scrollY);
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
  if (state.count === 0) releaseLockStyles();
}

export function resetScrollLock() {
  if (typeof window === "undefined") return;
  if (state.count === 0) return;
  state.count = 0;
  releaseLockStyles();
}
