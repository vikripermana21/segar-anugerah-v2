import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getProductBySlug } from "@/lib/catalog";

import { PageBar } from "../../_components/app-bar";
import CartButton from "../../_components/cart-button";
import ProductDetail from "../../_components/product-detail";

export const instant = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) return { title: "Produk tidak ditemukan" };

  return {
    title: product.name,
    description: product.description,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  return (
    <div className="min-h-dvh">
      <PageBar
        title={product.name}
        backHref="/products"
        backLabel="Kembali ke daftar produk"
        right={<CartButton size={36} />}
      />
      <ProductDetail product={product} />
    </div>
  );
}
