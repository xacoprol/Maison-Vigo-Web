import Link from "next/link";

import { fetchWebStoreCatalog } from "@/lib/web-store/api";
import {
  careApiBaseUrl,
  formatEuroFromCents,
  webStoreFileUrl,
} from "@/lib/web-store/utils";

export const dynamic = "force-dynamic";

export default async function TiendaPage() {
  if (!careApiBaseUrl()) {
    return (
      <>
        <p className="tienda-eyebrow">Selección</p>
        <h1 className="tienda-title">Tienda</h1>
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
        <p className="tienda-eyebrow">Selección</p>
        <h1 className="tienda-title">Tienda</h1>
        <p className="tienda-lead">
          Productos seleccionados bajo la misma mirada que guía cada cuidado en
          Maison Vigo. Compra abierta, sin registro obligatorio.
        </p>

        {categories.length === 0 ? (
          <p className="tienda-status">
            Aún no hay productos públicos. Cuando marques categorías como
            visibles en el panel de Care, aparecerán aquí.
          </p>
        ) : (
          categories.map((category) => (
            <section key={category.id} className="tienda-category">
              <h2 className="tienda-category__title">{category.name}</h2>
              <div className="tienda-grid">
                {category.products.map((product) => {
                  const img = webStoreFileUrl(product.photos[0]?.url);
                  return (
                    <Link
                      key={product.id}
                      href={`/tienda/producto/${product.id}`}
                      className="tienda-card"
                    >
                      <div className="tienda-card__media">
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={img} alt="" />
                        ) : null}
                      </div>
                      <div className="tienda-card__body">
                        <h3 className="tienda-card__name">{product.name}</h3>
                        <p className="tienda-card__price">
                          {formatEuroFromCents(product.salePriceCents)}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </>
    );
  } catch {
    return (
      <>
        <p className="tienda-eyebrow">Selección</p>
        <h1 className="tienda-title">Tienda</h1>
        <p className="tienda-status tienda-status--error">
          No hemos podido cargar el catálogo. Inténtalo de nuevo en unos
          minutos.
        </p>
      </>
    );
  }
}
