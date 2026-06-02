import Link from "next/link";

import { buildSectionUrl } from "@/lib/hash-nav";

type ServicioBackNavProps = {
  currentTitle: string;
};

export function ServicioBackNav({ currentTitle }: ServicioBackNavProps) {
  const serviciosHref = buildSectionUrl("servicios");

  return (
    <nav className="servicio__back" aria-label="Migas de pan">
      <ol className="servicio__back-crumbs">
        <li className="servicio__back-crumb">
          <Link href="/">Inicio</Link>
        </li>
        <li className="servicio__back-crumb servicio__back-crumb--sep" aria-hidden={true}>
          /
        </li>
        <li className="servicio__back-crumb">
          <Link href={serviciosHref}>Cuidado integral</Link>
        </li>
        <li className="servicio__back-crumb servicio__back-crumb--sep" aria-hidden={true}>
          /
        </li>
        <li
          className="servicio__back-crumb servicio__back-crumb--current"
          aria-current="page"
        >
          {currentTitle}
        </li>
      </ol>
    </nav>
  );
}
