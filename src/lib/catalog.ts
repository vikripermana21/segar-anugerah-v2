import { cache } from "react";
import { connection } from "next/server";
import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { category, product, productImage, productVariant, storeSetting } from "@/db/schema";

import type { Category, Product, StoreSettings, Variant } from "./catalog-types";

const FALLBACK_IMAGE = "/products/pasar.jpg";

const fallbackSettings: StoreSettings = {
  name: "Segar Anugerah",
  phone: "0812-3456-789",
  whatsapp: "628123456789",
  address: "Jl. Melati No. 12, Cilandak, Jakarta Selatan 12430",
  cutoffHour: 16,
  freeShippingActive: true,
  freeShippingUntil: null,
  freeShippingMinSubtotal: 0,
};

/**
 * Semua pembacaan katalog untuk toko. `cache()` membuat query yang sama
 * dipakai layout dan halaman dalam satu permintaan, bukan dua kali.
 */
export const getStoreSettings = cache(async (): Promise<StoreSettings> => {
  await connection();

  const [row] = await db.select().from(storeSetting).limit(1);
  if (!row) return fallbackSettings;

  return {
    name: row.storeName,
    phone: row.whatsapp ?? fallbackSettings.phone,
    whatsapp: (row.whatsapp ?? fallbackSettings.whatsapp).replace(/[^\d]/g, ""),
    address: row.address ?? fallbackSettings.address,
    cutoffHour: row.orderCutoffHour,
    freeShippingActive: row.freeShippingActive,
    freeShippingUntil: row.freeShippingUntil ? row.freeShippingUntil.toISOString() : null,
    freeShippingMinSubtotal: row.freeShippingMinSubtotal,
  };
});

export const getCatalog = cache(
  async (): Promise<{ categories: Category[]; products: Product[] }> => {
    await connection();

    const [categoryRows, productRows, variantRows, imageRows] = await Promise.all([
      db
        .select()
        .from(category)
        .where(eq(category.isActive, true))
        .orderBy(asc(category.sortOrder), asc(category.name)),
      db
        .select()
        .from(product)
        .where(eq(product.isActive, true))
        .orderBy(asc(product.sortOrder), asc(product.name)),
      db
        .select()
        .from(productVariant)
        .where(eq(productVariant.isActive, true))
        .orderBy(asc(productVariant.sortOrder), asc(productVariant.createdAt)),
      db
        .select()
        .from(productImage)
        .orderBy(asc(productImage.sortOrder), asc(productImage.createdAt)),
    ]);

    const categoryById = new Map(categoryRows.map((row) => [row.id, row]));

    const variantsByProduct = new Map<string, Variant[]>();
    for (const variant of variantRows) {
      const list = variantsByProduct.get(variant.productId) ?? [];
      list.push({
        id: variant.id,
        label: variant.label,
        price: variant.price,
        stock: variant.stock,
      });
      variantsByProduct.set(variant.productId, list);
    }

    const imagesByProduct = new Map<
      string,
      { url: string; alt: string | null; isPrimary: boolean }[]
    >();
    for (const image of imageRows) {
      const list = imagesByProduct.get(image.productId) ?? [];
      list.push({ url: image.url, alt: image.alt, isPrimary: image.isPrimary });
      imagesByProduct.set(image.productId, list);
    }

    const products: Product[] = [];

    for (const row of productRows) {
      const variants = variantsByProduct.get(row.id) ?? [];
      if (variants.length === 0) continue;

      const images = imagesByProduct.get(row.id) ?? [];
      const categoryRow = categoryById.get(row.categoryId);

      products.push({
        slug: row.slug,
        name: row.name,
        category: categoryRow?.slug ?? "",
        categoryName: categoryRow?.name ?? "",
        unit: row.unitLabel,
        description: row.description ?? "",
        image: images.find((image) => image.isPrimary)?.url ?? images[0]?.url ?? FALLBACK_IMAGE,
        images: images.map((image) => ({ url: image.url, alt: image.alt })),
        variants,
      });
    }

    const categories: Category[] = categoryRows.map((row) => ({
      slug: row.slug,
      name: row.name,
      description: row.description,
      image:
        row.imageUrl ??
        products.find((item) => item.category === row.slug)?.image ??
        FALLBACK_IMAGE,
      productCount: products.filter((item) => item.category === row.slug).length,
    }));

    return { categories, products };
  },
);

export const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  const { products } = await getCatalog();
  return products.find((item) => item.slug === slug) ?? null;
});

/** Produk unggulan: empat teratas menurut urutan admin. */
export const getFeaturedProducts = cache(async (): Promise<Product[]> => {
  const { products } = await getCatalog();
  return products.slice(0, 4);
});
