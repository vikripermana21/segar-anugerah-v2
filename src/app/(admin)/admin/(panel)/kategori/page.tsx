import Link from "next/link";
import { asc, count, eq } from "drizzle-orm";
import { Info, Tags } from "lucide-react";

import { db } from "@/db";
import { category, product } from "@/db/schema";

import { ActionForm } from "../_components/action-form";
import { Card, CardHead, EmptyNote, inputClass, Tile } from "../_components/ui";
import {
  createCategory,
  deleteCategory,
  setCategoryActive,
  updateCategory,
} from "./actions";

export const instant = false;

type SearchParams = Promise<{ ubah?: string }>;

const rowGrid =
  "grid grid-cols-[minmax(0,1fr)_72px] items-center gap-3 px-5 py-3 lg:grid-cols-[minmax(0,1fr)_120px_76px_64px_110px_56px]";

export default async function AdminCategoryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { ubah } = await searchParams;

  const rows = await db
    .select({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      imageUrl: category.imageUrl,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
      productCount: count(product.id),
    })
    .from(category)
    .leftJoin(product, eq(product.categoryId, category.id))
    .groupBy(category.id)
    .orderBy(asc(category.sortOrder), asc(category.name));

  const editing = ubah ? rows.find((row) => row.id === ubah) : undefined;
  const activeCount = rows.filter((row) => row.isActive).length;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="admin-h1">Kategori</h1>
          <p className="admin-sub">
            {activeCount} kategori aktif · urutan menentukan susunan di beranda toko
          </p>
        </div>
        <span className="admin-btn-ghost pointer-events-none">
          <Info size={14} strokeWidth={1.9} />
          Perubahan langsung tampil di toko
        </span>
      </div>

      <div className="admin-split mt-5">
        <Card className="min-w-0">
          <CardHead
            title="Kategori di toko"
            note="Diubah dengan angka urutan, bukan dengan menggeser baris"
            action={
              <Link href="/" className="admin-link">
                Lihat toko
              </Link>
            }
          />

          {rows.length === 0 ? (
            <div className="admin-card-body">
              <EmptyNote>Belum ada kategori. Tambah satu di panel kanan.</EmptyNote>
            </div>
          ) : (
            <ul>
              <li className="hidden grid-cols-[minmax(0,1fr)_120px_76px_64px_110px_56px] items-center gap-3 border-b border-line-soft bg-[#FAFCF9] px-5 py-2 text-[11.5px] font-semibold text-ink-3 lg:grid">
                <span>Nama</span>
                <span>Slug</span>
                <span>Produk</span>
                <span>Urutan</span>
                <span>Status</span>
                <span className="text-right">Aksi</span>
              </li>

              {rows.map((row) => (
                <li key={row.id} className="border-b border-line-soft last:border-b-0">
                  <div className={rowGrid}>
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Tile>
                        <Tags size={16} strokeWidth={1.9} />
                      </Tile>
                      <div className="min-w-0">
                        <p className="admin-name admin-ellipsis">{row.name}</p>
                        <p className="admin-muted admin-ellipsis">
                          {row.description ?? "Tanpa deskripsi"}
                        </p>
                      </div>
                    </div>

                    <span className="hidden text-[12px] text-ink-2 lg:block">{row.slug}</span>
                    <span className="hidden text-[12px] text-ink-2 lg:block">
                      {row.productCount} produk
                    </span>
                    <span className="hidden lg:block">
                      <span className="grid h-7 w-[34px] place-items-center rounded-[7px] bg-bg text-[12px] font-semibold text-ink-2">
                        {row.sortOrder}
                      </span>
                    </span>

                    <span className="hidden items-center gap-2 lg:flex">
                      <form action={setCategoryActive}>
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

                    <Link
                      href={editing?.id === row.id ? "/admin/kategori" : `/admin/kategori?ubah=${row.id}`}
                      className="admin-link justify-self-end"
                    >
                      {editing?.id === row.id ? "Tutup" : "Ubah"}
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="border-t border-line-soft px-5 py-3 text-[11px] leading-relaxed text-ink-3">
            Kategori nonaktif hilang dari beranda, tetapi produknya tetap ada dan tetap bisa
            dicari.
          </div>
        </Card>

        <Card>
          <CardHead
            title={editing ? `Ubah · ${editing.name}` : "Tambah kategori"}
            className="pb-2.5"
            action={
              editing ? (
                <Link href="/admin/kategori" className="admin-link">
                  Batal
                </Link>
              ) : undefined
            }
          />
          <div className="admin-card-body">
            {editing ? (
              <ActionForm action={updateCategory} submitLabel="Simpan perubahan">
                <input type="hidden" name="id" value={editing.id} />

                <label className="admin-label">
                  Nama
                  <input name="name" defaultValue={editing.name} required className={inputClass} />
                </label>

                <label className="admin-label">
                  Deskripsi (opsional)
                  <input
                    name="description"
                    defaultValue={editing.description ?? ""}
                    className={inputClass}
                  />
                </label>

                <label className="admin-label">
                  Foto kategori (opsional)
                  <input
                    name="imageUrl"
                    defaultValue={editing.imageUrl ?? ""}
                    className={inputClass}
                  />
                </label>

                <label className="admin-label">
                  Urutan
                  <input
                    name="sortOrder"
                    type="number"
                    min={0}
                    defaultValue={editing.sortOrder}
                    className={inputClass}
                  />
                </label>

                <p className="admin-help">
                  Slug <span className="font-semibold text-ink-2">/{editing.slug}</span> tidak ikut
                  berubah agar tautan lama tetap hidup.
                </p>

                {editing.productCount === 0 ? (
                  <div>
                    <button type="submit" formAction={deleteCategory} className="admin-btn-danger">
                      Hapus kategori
                    </button>
                  </div>
                ) : (
                  <p className="admin-help">
                    Kategori ini dipakai {editing.productCount} produk, jadi tidak bisa dihapus.
                    Nonaktifkan saja lewat saklar di tabel.
                  </p>
                )}
              </ActionForm>
            ) : (
              <ActionForm action={createCategory} submitLabel="Simpan kategori">
                <label className="admin-label">
                  Nama
                  <input name="name" required placeholder="Buah" className={inputClass} />
                </label>

                <label className="admin-label">
                  Deskripsi (opsional)
                  <input
                    name="description"
                    placeholder="Buah potong dan buah utuh"
                    className={inputClass}
                  />
                </label>

                <label className="admin-label">
                  Foto kategori (opsional)
                  <input name="imageUrl" placeholder="/products/buah.jpg" className={inputClass} />
                </label>

                <label className="admin-label">
                  Urutan
                  <input
                    name="sortOrder"
                    type="number"
                    min={0}
                    defaultValue={0}
                    className={inputClass}
                  />
                </label>

                <p className="admin-help">
                  Kategori baru langsung muncul di beranda setelah disimpan.
                </p>
              </ActionForm>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
