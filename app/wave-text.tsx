type WaveTextProps = {
  text: string;
  /** Si es false, no se renderiza el texto oculto para SR (p. ej. el padre ya tiene aria-label). */
  screenReaderDuplicate?: boolean;
  /** Retardo entre caracteres (ms); por defecto 9 como en el resto del sitio. */
  charStaggerMs?: number;
};

export function WaveText({
  text,
  screenReaderDuplicate = true,
  charStaggerMs = 9,
}: WaveTextProps) {
  const chars = Array.from(text);
  const len = chars.length;
  return (
    <>
      <span className="mob-wave-text" aria-hidden={true}>
        {chars.map((char, idx) => {
          const delay = (len - idx - 1) * charStaggerMs;
          const safeChar = char === " " ? "\u00A0" : char;
          return (
            <span className="mob-wave-char-wrap" key={`${text}-${idx}`}>
              <span
                className="mob-wave-char mob-wave-char--top"
                style={{ transitionDelay: `${delay}ms` }}
              >
                {safeChar}
              </span>
              <span
                className="mob-wave-char mob-wave-char--bottom"
                style={{ transitionDelay: `${delay}ms` }}
              >
                {safeChar}
              </span>
            </span>
          );
        })}
      </span>
      {screenReaderDuplicate ? (
        <span className="mob-wave-sr">{text}</span>
      ) : null}
    </>
  );
}
