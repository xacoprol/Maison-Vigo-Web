/**
 * IVA de The Selection (precios con IVA incluido).
 * Alimentación (piensos / kibble) → 10%; resto (y envío) → 21%.
 */

export type WebStoreVatRate = 10 | 21;

export type WebStoreVatLineInput = {
  productKind?: string | null;
  salePriceCents: number;
  quantity: number;
};

export type WebStoreVatBucket = {
  rate: WebStoreVatRate;
  /** Importe bruto (con IVA) atribuido a este tipo. */
  grossCents: number;
  /** Cuota de IVA incluida en grossCents. */
  vatCents: number;
  /** Base imponible = gross − IVA. */
  netCents: number;
};

export type WebStoreVatBreakdown = {
  buckets: WebStoreVatBucket[];
  /** Suma de cuotas de IVA (productos + envío). */
  vatCents: number;
  netCents: number;
  grossCents: number;
};

export function vatRateForProductKind(
  kind: string | null | undefined,
): WebStoreVatRate {
  return kind === "kibble" ? 10 : 21;
}

/** Cuota de IVA contenida en un importe bruto (IVA incluido). */
export function vatFromGrossCents(
  grossCents: number,
  ratePercent: WebStoreVatRate,
): number {
  const gross = Math.max(0, Math.round(Number(grossCents) || 0));
  if (gross <= 0) return 0;
  return Math.round((gross * ratePercent) / (100 + ratePercent));
}

/**
 * Desglose de IVA a partir de líneas (y envío opcional al 21%).
 * Los importes de línea se tratan como PVP con IVA incluido.
 */
export function computeVatBreakdown(
  lines: WebStoreVatLineInput[],
  shippingCents = 0,
): WebStoreVatBreakdown {
  const byRate = new Map<WebStoreVatRate, number>([
    [10, 0],
    [21, 0],
  ]);

  for (const line of lines) {
    const qty = Math.max(0, Math.round(Number(line.quantity) || 0));
    const unit = Math.max(0, Math.round(Number(line.salePriceCents) || 0));
    const gross = unit * qty;
    if (gross <= 0) continue;
    const rate = vatRateForProductKind(line.productKind);
    byRate.set(rate, (byRate.get(rate) ?? 0) + gross);
  }

  const ship = Math.max(0, Math.round(Number(shippingCents) || 0));
  if (ship > 0) {
    byRate.set(21, (byRate.get(21) ?? 0) + ship);
  }

  const buckets: WebStoreVatBucket[] = [];
  let vatCents = 0;
  let netCents = 0;
  let grossCents = 0;

  for (const rate of [10, 21] as const) {
    const gross = byRate.get(rate) ?? 0;
    if (gross <= 0) continue;
    const vat = vatFromGrossCents(gross, rate);
    const net = gross - vat;
    buckets.push({ rate, grossCents: gross, vatCents: vat, netCents: net });
    vatCents += vat;
    netCents += net;
    grossCents += gross;
  }

  return { buckets, vatCents, netCents, grossCents };
}
