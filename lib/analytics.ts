/**
 * Envío de eventos a Google Analytics 4 (gtag cargado en app/layout.tsx).
 * Si gtag aún no se ha cargado, deja el comando en dataLayer con el mismo
 * formato que usa gtag, para que se procese cuando cargue.
 */
type GtagFn = (...args: unknown[]) => void;

export type TrackEventOptions = {
  /** Callback de gtag cuando el hit se ha enviado (o ha fallado). */
  event_callback?: () => void;
  /** Preferir beacon para no perder el hit al navegar fuera. */
  transport_type?: "beacon" | "xhr" | "image";
};

export function trackEvent(
  name: string,
  params: Record<string, string | number | boolean | null | undefined> = {},
  options?: TrackEventOptions,
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
  const clean: Record<string, string | number | boolean | (() => void)> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== null && v !== undefined && v !== "") clean[k] = v;
  }
  if (options?.transport_type) clean.transport_type = options.transport_type;
  if (options?.event_callback) clean.event_callback = options.event_callback;
  w.gtag("event", name, clean);
}
