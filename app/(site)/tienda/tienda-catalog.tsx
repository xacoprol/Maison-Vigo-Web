"use client";

import { useState } from "react";

import type {
  WebStoreCategory,
  WebStoreProduct,
} from "@/lib/web-store/types";

import { TiendaEditorialGrid } from "./tienda-editorial-grid";
import { TiendaProductSheet } from "./tienda-product-sheet";

type Props = {
  categories: WebStoreCategory[];
};

export function TiendaCatalog({ categories }: Props) {
  const [pickerProduct, setPickerProduct] = useState<WebStoreProduct | null>(
    null,
  );

  return (
    <>
      {categories.map((category) => (
        <section key={category.id} className="tienda-category">
          <h2 className="tienda-category__title">{category.name}</h2>
          <TiendaEditorialGrid
            products={category.products}
            onSelectProduct={setPickerProduct}
          />
        </section>
      ))}

      <TiendaProductSheet
        product={pickerProduct}
        open={pickerProduct != null}
        onClose={() => setPickerProduct(null)}
      />
    </>
  );
}
