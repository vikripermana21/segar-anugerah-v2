import Link from "next/link";
import { and, asc, count, eq, ilike, max, min, sum } from "drizzle-orm";
import { Package, Plus, Search } from "lucide-react";

import { db } from "@/db";
import { category, product, productVariant } from "@/db/schema";
import { rupiah } from "@/lib/store-data";

import { Badge, Card, CardHead, EmptyNote, Tile } from "../_components/ui";
import { setProductActive } from "./actions";

export const instant = false;

type SearchParams = Promise<{ q?: string; kategori?: string; status?: string }>;

const statusTabs = [
  { key: "", label: "Semua" },
  { key: "aktif", label: "Aktif" },
  { key: "nonaktif", label: "Nonaktif" },
];

export default async function AdminProductListPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q = "", kategori = "", status = "" } = await searchParams;

  const filters = [];
  if (q.trim()) filters.push(ilike(product.name, `%${q.trim()}%`));
  if (kategori) filters.push(eq(category.slug, kategori));
  if (status === "aktif") filters.push(eq(product.isActive, true));
  if (status === "nonaktif") filters.push(eq(product.isActive, false));

  const [categories, rows] = await Promise.all([
    db
      .select({ slug: category.slug, name: category.name })
      .from(category)
      .orderBy(asc(category.sortOrder)),
    db
      .select({
        id: product.id,
        name: product.name,
        slug: product.slug,
        unitLabel: product.unitLabel,
        isActive: product.isActive,
        categoryName: category.name,
        variantCount: count(productVariant.id),
        minPrice: min(productVariant.price),
        maxPrice: max(productVariant.price),
        stock: sum(productVariant.stock),
      })
      .from(product)
      .innerJoin(category, eq(product.categoryId, category.id))
      .leftJoin(productVariant, eq(productVariant.productId, product.id))
      .where(filters.length ? and(...filters) : undefined)
      .groupBy(product.id, category.name)
      .orderBy(asc(product.sortOrder), asc(product.name)),
  ]);

  const activeCount = rows.filter((row) => row.isActive).length;
  const lowStockCount = rows.filter((row) => Number(row.stock ?? 0) <= 10).length;

  function tabHref(key: string) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (kategori) params.set("kategori", kategori);
    if (key) params.set("status", key);
    const query = params.toString();
    return query ? `/admin/produk?${query}` : "/admin/produk";
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="admin-h1">Produk</h1>
          <p className="admin-sub">
            {rows.length} produk · {activeCount} aktif · {lowStockCount} stok menipis
          </p>
        </div>
        <Link href="/admin/produk/baru" className="admin-btn">
          <Plus size={15} strokeWidth={2.1} />
          Tambah produk
        </Link>
      </div>

      <Card className="mt-5">
        <form className="flex flex-wrap items-center gap-2.5 px-3.5 py-3">
          <label className="flex h-[34px] min-w-0 flex-1 basis-[220px] items-center gap-2 rounded-lg border border-line bg-bg px-2.5">
            <Search size={14} strokeWidth={2} className="text-ink-3" aria-hidden="true" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Cari nama produk"
              aria-label="Cari nama produk"
              className="min-w-0 flex-1 bg-transparent text-[12px] text-ink outline-none placeholder:text-ink-3"
            />
          </label>

          <select
            name="kategori"
            defaultValue={kategori}
            aria-label="Filter kategori"
            className="h-[34px] rounded-lg border border-line bg-surface px-2.5 text-[12px] font-medium text-ink-2"
          >
            <option value="">Semua kategori</option>
            {categories.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>

          <input type="hidden" name="status" value={status} />

          <button type="submit" className="admin-btn-ghost admin-btn-sm h-[34px]">
            Terapkan
          </button>

          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            {statusTabs.map((tab) => (
              <Link
                key={tab.key}
                href={tabHref(tab.key)}
                className="admin-chip"
                data-active={status === tab.key}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </form>
      </Card>

      <Card className="mt-3">
        <CardHead
          title="Daftar produk"
          note="Harga dan stok disimpan di tiap varian"
          action={
            <Link href="/admin/kategori" className="admin-link">
              Kelola kategori
            </Link>
          }
        />

        {rows.length === 0 ? (
          <div className="admin-card-body">
            <EmptyNote>
              Tidak ada produk yang cocok.{" "}
              <Link href="/admin/produk" className="admin-link">
                Lihat semua
              </Link>
            </EmptyNote>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="w-[56px]" aria-label="Foto" />
                  <th>Produk</th>
                  <th className="w-[120px]">Kategori</th>
                  <th className="w-[90px]">Varian</th>
                  <th className="w-[160px]">Harga terendah</th>
                  <th className="w-[90px] text-right">Stok</th>
                  <th className="w-[130px]">Status</th>
                  <th className="w-[80px] text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const stock = Number(row.stock ?? 0);
                  const price =
                    row.variantCount === 0
                      ? "—"
                      : row.minPrice === row.maxPrice
                        ? rupiah(row.minPrice ?? 0)
                        : `${rupiah(row.minPrice ?? 0)} – ${rupiah(row.maxPrice ?? 0)}`;

                  return (
                    <tr key={row.id}>
                      <td>
                        <Tile>
                          <Package size={16} strokeWidth={1.9} />
                        </Tile>
                      </td>
                      <td>
                        <Link
                          href={`/admin/produk/${row.id}`}
                          className="admin-name admin-ellipsis hover:text-green-700"
                        >
                          {row.name}
                        </Link>
                        <p className="admin-muted">/{row.slug}</p>
                      </td>
                      <td>{row.categoryName}</td>
                      <td className="admin-nowrap">
                        {row.variantCount === 0 ? "—" : `${row.variantCount} varian`}
                      </td>
                      <td>
                        <span className="text-[12px] font-medium text-ink">
                          {price}
                          {row.variantCount > 0 ? ` / ${row.unitLabel}` : ""}
                        </span>
                      </td>
                      <td className="text-right">
                        {stock === 0 ? (
                          <span className="font-semibold text-amber-700">0</span>
                        ) : stock <= 10 ? (
                          <span className="font-semibold text-amber-700">{stock}</span>
                        ) : (
                          <span className="font-semibold">{stock}</span>
                        )}
                      </td>
                      <td>
                        <span className="flex items-center gap-2">
                          <form action={setProductActive}>
                            <input type="hidden" name="id" value={row.id} />
                            <input type="hidden" name="active" value={row.isActive ? "0" : "1"} />
                            <button
                              type="submit"
                              role="switch"
                              aria-checked={row.isActive}
                              aria-label={`${row.name} ${row.isActive ? "aktif" : "nonaktif"}`}
                              className="admin-switch"
                            />
                          </form>
                          <span className="text-[11.5px] text-ink-2">
                            {row.isActive ? "Aktif" : "Nonaktif"}
                          </span>
                        </span>
                      </td>
                      <td className="text-right">
                        <Link href={`/admin/produk/${row.id}`} className="admin-link">
                          Ubah
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line-soft px-5 py-3 text-[11.5px] text-ink-3">
          <span>
            Menampilkan {rows.length} dari {rows.length} produk
          </span>
          {lowStockCount > 0 ? <Badge tone="warn">{lowStockCount} perlu diisi ulang</Badge> : null}
        </div>
      </Card>
    </>
  );
}
