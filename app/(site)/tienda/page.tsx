import { fetchWebStoreCatalog } from "@/lib/web-store/api";
import { careApiBaseUrl } from "@/lib/web-store/utils";

import { TiendaCatalog } from "./tienda-catalog";

export const dynamic = "force-dynamic";

function TiendaHero({
  lead,
}: {
  lead?: string;
}) {
  return (
    <header className="tienda-hero">
      <h1 className="tienda-title">The Selection</h1>
      {lead ? <p className="tienda-lead">{lead}</p> : null}
    </header>
  );
}

export default async function TiendaPage() {
  if (!careApiBaseUrl()) {
    return (
      <>
        <TiendaHero />
        <p className="tienda-status tienda-status--error">
          Falta configurar <code>NEXT_PUBLIC_CARE_API_BASE_URL</code> para
          conectar con el catálogo.
        </p>
      </>
    );
  }

  try {
    const catalog = await fetchWebStoreCatalog();
    const categories = catalog.categories ?? [];

    return (
      <>
        <TiendaHero lead="Cosmética, accesorios y objetos seleccionados bajo la misma mirada que guía cada cuidado." />

        {categories.length === 0 ? (
          <p className="tienda-status">
            Aún no hay productos públicos. Cuando marques categorías como
            visibles en el panel de Care, aparecerán aquí.
          </p>
        ) : (
          <TiendaCatalog categories={categories} />
        )}
      </>
    );
  } catch {
    return (
      <>
        <TiendaHero />
        <p className="tienda-status tienda-status--error">
          No hemos podido cargar el catálogo. Inténtalo de nuevo en unos
          minutos.
        </p>
      </>
    );
  }
}
