import Image from "next/image";
import Link from "./_components/transition-link";
import { MapPin, Phone } from "lucide-react";

import { getCatalog, getFeaturedProducts, getStoreSettings } from "@/lib/catalog";
import { freeShippingLabel } from "@/lib/catalog-types";

import { BrandBar } from "./_components/app-bar";
import ProductCard from "./_components/product-card";
import TabBar from "./_components/tab-bar";
import { DisplayTitle, FreeShippingNote } from "./_components/ui";

export const instant = false;

export default async function StoreHomePage() {
  const [{ categories }, featured, settings] = await Promise.all([
    getCatalog(),
    getFeaturedProducts(),
    getStoreSettings(),
  ]);

  return (
    <div className="min-h-dvh pb-[calc(84px+env(safe-area-inset-bottom))] lg:pb-16">
      <BrandBar />

      <main className="page flex flex-col gap-[26px] pt-1">
        <FreeShippingNote>{freeShippingLabel(settings)}</FreeShippingNote>

        <section aria-labelledby="sapaan">
          <p className="text-[10.5px] font-bold tracking-[0.08em] text-accent uppercase">
            Pagi ini di pasar
          </p>
          <h1 id="sapaan" className="hero-type">
            Ikan &amp; sayur segar, dipotong sejak subuh.
          </h1>
        </section>

        {categories.length > 0 ? (
          <section aria-labelledby="kategori">
            <div className="flex items-center justify-between gap-3">
              <h2 id="kategori" className="text-[13px] font-bold">
                Kategori
              </h2>
              <span className="text-[11px] text-ink-3">{categories.length} kategori</span>
            </div>
            <div className="cat-rail">
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/products?kategori=${category.slug}`}
                  className="cat-rail__item"
                >
                  <span className="cat-rail__thumb">
                    <Image
                      src={category.image}
                      alt={`Kategori ${category.name}`}
                      width={140}
                      height={140}
                      className="cat-rail__img"
                    />
                  </span>
                  <span className="cat-rail__text">
                    <span className="cat-rail__label">{category.name}</span>
                    <span className="cat-rail__count">{category.productCount} produk</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section aria-labelledby="unggulan">
          <DisplayTitle action="Lihat semua" href="/products" actionLabel="Lihat semua produk">
            <span id="unggulan">Produk unggulan</span>
          </DisplayTitle>

          {featured.length === 0 ? (
            <p className="mt-3 rounded-2xl border border-border bg-surface px-4 py-8 text-center text-[12px] text-ink-3">
              Belum ada produk aktif. Tambah produk dari area admin.
            </p>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
              {featured.map((product) => (
                <ProductCard key={product.slug} product={product} showFrom />
              ))}
            </div>
          )}
        </section>

        <section
          aria-labelledby="diantar"
          className="rounded-[18px] bg-brand-deep p-[18px] text-cream"
        >
          <h2 id="diantar" className="font-display text-[17px] font-semibold">
            Diantar setiap hari
          </h2>
          <p className="mt-2.5 max-w-[46ch] text-[11.5px] leading-[1.5] text-cream/75">
            Pesanan sebelum {settings.cutoffHour}.00 WIB dikirim hari itu juga, dengan es dan daun
            pisang.
          </p>
          <div className="my-3 h-px bg-white/12" />
          <div className="flex flex-col gap-2 text-[11px] text-cream/80">
            <p className="flex items-start gap-2">
              <Phone size={13} className="mt-0.5 shrink-0 text-cream/55" />
              {settings.phone}
            </p>
            <p className="flex items-start gap-2">
              <MapPin size={13} className="mt-0.5 shrink-0 text-cream/55" />
              {settings.address}
            </p>
          </div>
        </section>
      </main>

      <TabBar />
    </div>
  );
}
