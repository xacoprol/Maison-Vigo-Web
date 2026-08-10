import { formatEuroFromCents } from "@/lib/web-store/utils";
import {
  computeVatBreakdown,
  type WebStoreVatLineInput,
} from "@/lib/web-store/vat";

type Props = {
  lines: WebStoreVatLineInput[];
  shippingCents?: number;
  /** Clase de cada fila (p. ej. `tienda-checkout__total-row`). */
  rowClassName: string;
  /** Clase extra para filas de IVA (más tenues). */
  mutedRowClassName?: string;
  /** Nota bajo el desglose. */
  noteClassName?: string;
  showNote?: boolean;
};

/**
 * Filas informativas de IVA incluido (no suman al total: el PVP ya lo lleva).
 */
export function TiendaVatRows({
  lines,
  shippingCents = 0,
  rowClassName,
  mutedRowClassName,
  noteClassName,
  showNote = true,
}: Props) {
  const { buckets, vatCents } = computeVatBreakdown(lines, shippingCents);
  if (vatCents <= 0 || buckets.length === 0) return null;

  const rowCls = [rowClassName, mutedRowClassName].filter(Boolean).join(" ");

  return (
    <>
      {buckets.map((b) => (
        <div key={b.rate} className={rowCls}>
          <span>IVA {b.rate}% (incluido)</span>
          <span>{formatEuroFromCents(b.vatCents)}</span>
        </div>
      ))}
      {showNote && noteClassName ? (
        <p className={noteClassName}>Precios con IVA incluido.</p>
      ) : null}
    </>
  );
}
