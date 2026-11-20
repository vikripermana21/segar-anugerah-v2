"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronDown, SearchX, Search, X } from "lucide-react";
import type { Category, Product } from "@/lib/catalog-types";
import ProductCard from "./product-card";

const sorts = [
  { value: "new", label: "Terbaru" },
  { value: "cheap", label: "Harga terendah" },
  { value: "expensive", label: "Harga tertinggi" },
] as const;

type Sort = (typeof sorts)[number]["value"];

/**
 * Kategori dan produk dikirim server sebagai prop; komponen ini hanya menyaring.
 * `category` dibaca dari URL oleh pembungkus di bawah, bukan di sini.
 */
export default function ProductBrowser({
  category = "semua",
  categories,
  products,
}: {
  category?: string;
  categories: Category[];
  products: Product[];
}) {
  const router = useRouter();
  const activeCategory = category;
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("new");
  const filters = [{ slug: "semua", name: "Semua" }, ...categories];

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const rows = products.filter((product) => {
      const inCategory = activeCategory === "semua" || product.category === activeCategory;
      const inQuery =
        needle.length === 0 ||
        product.name.toLowerCase().includes(needle) ||
        product.description.toLowerCase().includes(needle);
      return inCategory && inQuery;
    });

    if (sort === "cheap") {
      rows.sort((a, b) => Math.min(...a.variants.map((v) => v.price)) - Math.min(...b.variants.map((v) => v.price)));
    } else if (sort === "expensive") {
      rows.sort((a, b) => Math.min(...b.variants.map((v) => v.price)) - Math.min(...a.variants.map((v) => v.price)));
    }

    return rows;
  }, [activeCategory, products, query, sort]);

  function pickCategory(slug: string) {
    router.replace(slug === "semua" ? "/products" : `/products?kategori=${slug}`, {
      scroll: false,
    });
  }

  return (
    <>
      <div className="relative">
        <Search
          size={16}
          strokeWidth={2}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-2"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari ikan atau sayur"
          aria-label="Cari produk"
          className="field h-[46px] pl-10 pr-10 text-[12.5px]"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Hapus kata kunci"
            className="absolute right-2.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-ink-3 hover:bg-surface-2"
          >
            <X size={15} />
          </button>
        ) : null}
      </div>

      <div className="no-scrollbar -mx-5 mt-3 flex gap-1.5 overflow-x-auto px-5 lg:mx-0 lg:flex-wrap lg:px-0">
        {filters.map((filter) => (
          <button
            key={filter.slug}
            type="button"
            onClick={() => pickCategory(filter.slug)}
            data-active={activeCategory === filter.slug}
            className="chip"
            aria-pressed={activeCategory === filter.slug}
          >
            {filter.name}
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-[11.5px] text-ink-2">
          {filtered.length} produk
          {activeCategory !== "semua"
            ? ` · ${filters.find((item) => item.slug === activeCategory)?.name ?? ""}`
            : ""}
        </p>

        <label className="relative flex items-center gap-1 text-[11px] font-semibold text-ink">
          <span className="sr-only">Urutkan produk</span>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as Sort)}
            className="appearance-none bg-transparent py-1 pr-4 outline-none"
          >
            {sorts.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={13}
            strokeWidth={2}
            className="pointer-events-none absolute right-0 text-ink-2"
          />
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2.5 px-3 pb-8 pt-14 text-center">
          <span className="grid h-[68px] w-[68px] place-items-center rounded-full bg-surface-2 text-ink-2">
            <SearchX size={28} strokeWidth={1.8} />
          </span>
          <h2 className="text-[16px] font-bold">
            {query.trim() ? `Tidak ada produk untuk “${query.trim()}”` : "Belum ada produk di sini"}
          </h2>
          <p className="max-w-[34ch] text-[11.5px] leading-relaxed text-ink-3">
            Coba kata lain, atau lihat semua produk yang tersedia.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              pickCategory("semua");
            }}
            className="btn-primary mt-3 min-h-[44px] min-w-[190px] text-[12.5px]"
          >
            Lihat semua produk
          </button>
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-2.5 pb-6 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      )}
    </>
  );
}

/** Pembungkus tipis yang membaca ?kategori; dirender di dalam Suspense halaman. */
export function ProductBrowserWithParams({
  categories,
  products,
}: {
  categories: Category[];
  products: Product[];
}) {
  const searchParams = useSearchParams();
  return (
    <ProductBrowser
      category={searchParams.get("kategori") ?? "semua"}
      categories={categories}
      products={products}
    />
  );
}
