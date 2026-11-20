/**
 * Bentuk katalog yang dipakai permukaan toko.
 *
 * Modul ini murni: boleh diimpor komponen klien. Query database ada di
 * `src/lib/catalog.ts` yang hanya dipakai server component.
 */

export type Variant = {
  id: string;
  label: string;
  price: number;
  stock: number;
};

export type ProductImage = {
  url: string;
  alt: string | null;
};

export type Product = {
  slug: string;
  name: string;
  category: string;
  categoryName: string;
  unit: string;
  description: string;
  image: string;
  images: ProductImage[];
  variants: Variant[];
};

export type Category = {
  slug: string;
  name: string;
  description: string | null;
  image: string;
  productCount: number;
};

export type StoreSettings = {
  name: string;
  phone: string;
  whatsapp: string;
  address: string;
  cutoffHour: number;
  freeShippingActive: boolean;
  freeShippingUntil: string | null;
  freeShippingMinSubtotal: number;
};

export function lowestPrice(product: Product): number {
  return Math.min(...product.variants.map((variant) => variant.price));
}

export function defaultVariant(product: Product): Variant | undefined {
  return product.variants.find((variant) => variant.stock > 0) ?? product.variants[0];
}

export function totalStock(product: Product): number {
  return product.variants.reduce((sum, variant) => sum + variant.stock, 0);
}

/** Teks ringkas aturan gratis ongkir untuk spanduk toko. */
export function freeShippingLabel(settings: StoreSettings): string {
  if (!settings.freeShippingActive) return "Ongkir dihitung per zona kecamatan";

  const until = settings.freeShippingUntil
    ? `s.d. ${new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Jakarta",
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(settings.freeShippingUntil))}`
    : "tanpa batas tanggal";

  const min = settings.freeShippingMinSubtotal
    ? ` · min. Rp ${new Intl.NumberFormat("id-ID").format(settings.freeShippingMinSubtotal)}`
    : "";

  return `Gratis ongkir ke semua kecamatan · ${until}${min}`;
}
