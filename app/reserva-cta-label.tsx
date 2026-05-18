import { WaveText } from "./wave-text";

type ReservaCtaLabelProps = {
  /** Texto corto en el botón circular del menú móvil (≤900px). */
  compactOnMobile?: boolean;
};

export function ReservaCtaLabel({
  compactOnMobile = false,
}: ReservaCtaLabelProps) {
  if (!compactOnMobile) {
    return <WaveText text="Reserva una cita" />;
  }

  return (
    <span className="cta-reserva-label">
      <span className="cta-reserva-label__full">
        <WaveText text="Reserva una cita" screenReaderDuplicate={false} />
      </span>
      <span className="cta-reserva-label__short" aria-hidden={true}>
        <WaveText text="Reserva" screenReaderDuplicate={false} />
      </span>
      <span className="mob-wave-sr">Reserva una cita</span>
    </span>
  );
}
