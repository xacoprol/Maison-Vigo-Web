/**
 * Envío de eventos a Google Analytics 4 (gtag cargado en app/layout.tsx).
 * Si gtag aún no se ha cargado, deja el comando en dataLayer con el mismo
 * formato que usa gtag, para que se procese cuando cargue.
 */
type GtagFn = (...args: unknown[]) => void;

export function trackEvent(
  name: string,
  params: Record<string, string | number | boolean | null | undefined> = {},
): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as { dataLayer?: unknown[]; gtag?: GtagFn };
  w.dataLayer = w.dataLayer || [];
  if (typeof w.gtag !== "function") {
    w.gtag = function gtag() {
      // gtag exige empujar el objeto `arguments`, no un array.
      // eslint-disable-next-line prefer-rest-params
      w.dataLayer!.push(arguments);
    };
  }
  const clean: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== null && v !== undefined && v !== "") clean[k] = v;
  }
  w.gtag("event", name, clean);
}
