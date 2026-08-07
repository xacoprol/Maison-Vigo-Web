import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
};

/** La ficha se abre como modal en el catálogo; las URLs antiguas vuelven a /tienda. */
export default async function TiendaProductPage({ params }: PageProps) {
  await params;
  redirect("/tienda");
}
