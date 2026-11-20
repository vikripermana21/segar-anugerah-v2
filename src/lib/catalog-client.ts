import type { Product, Variant } from "./catalog-types";

export type VariantHit = { product: Product; variant: Variant };

/**
 * Indeks id varian → produk + varian. Keranjang hanya menyimpan id, jadi
 * indeks ini dibangun dari katalog yang dikirim server ke provider klien.
 */
export function buildVariantIndex(products: Product[]): Map<string, VariantHit> {
  const index = new Map<string, VariantHit>();

  for (const product of products) {
    for (const variant of product.variants) {
      index.set(variant.id, { product, variant });
    }
  }

  return index;
}
