import type { Metadata } from "next";
import { Suspense } from "react";

import { getCatalog } from "@/lib/catalog";

import CartButton from "../_components/cart-button";
import { PageBar } from "../_components/app-bar";
import ProductBrowser, { ProductBrowserWithParams } from "../_components/product-browser";
import TabBar from "../_components/tab-bar";

export const metadata: Metadata = {
  title: "Produk",
  description: "Semua ikan, sayur, bumbu dapur, dan telur yang tersedia hari ini.",
};

export const instant = false;

export default async function ProductsPage() {
  const { categories, products } = await getCatalog();

  return (
    <div className="min-h-dvh pb-[calc(84px+env(safe-area-inset-bottom))] lg:pb-16">
      <PageBar title="Produk" right={<CartButton size={36} />} />

      <main className="page pb-4 pt-1.5">
        <Suspense fallback={<ProductBrowser categories={categories} products={products} />}>
          <ProductBrowserWithParams categories={categories} products={products} />
        </Suspense>
      </main>

      <TabBar />
    </div>
  );
}
