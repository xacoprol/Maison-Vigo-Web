"use client";

type Props = {
  /** Texto bajo la marca (p. ej. «Cargando carrito…»). */
  message?: string;
  className?: string;
};

/**
 * Loader de The Selection: M animada (trazo + alas), como en MV Care.
 */
export function TiendaLogoLoader({
  message = "Cargando…",
  className,
}: Props) {
  return (
    <div
      className={
        "tienda-logo-loader" + (className ? ` ${className}` : "")
      }
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="tienda-logo-loader__inner">
        <div className="tienda-logo-mark" aria-hidden={true}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 81.9 73.5"
            className="tienda-logo-mark__svg"
          >
            <path
              className="tienda-logo-mark__v"
              d="M62.6,0h0l-.1.245L40.951,51.209,19.306,0l-4.07,12.667,21,49.69L40.948,73.5h0l4.708-11.142,21-49.682L62.84.76Z"
            />
            <path
              className="tienda-logo-mark__wing-l"
              d="M9.661,30.046l-.15.465-.007.024L5.086,44.273V44.26L0,60.092H10.372V27.84Z"
            />
            <path
              className="tienda-logo-mark__wing-r"
              d="M72.24,30.046l.15.465.007.024,4.418,13.738V44.26L81.9,60.092H71.529V27.84Z"
            />
          </svg>
        </div>
        <p className="tienda-logo-loader__message">{message}</p>
        <div className="tienda-logo-loader__bar" aria-hidden={true}>
          <span className="tienda-logo-loader__bar-fill" />
        </div>
      </div>
    </div>
  );
}
