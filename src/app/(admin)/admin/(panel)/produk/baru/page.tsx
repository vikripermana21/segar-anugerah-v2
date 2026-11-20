import Link from "next/link";
import { asc } from "drizzle-orm";
import { ArrowLeft, Info } from "lucide-react";

import { db } from "@/db";
import { category } from "@/db/schema";

import { ActionForm } from "../../_components/action-form";
import { Card, CardBody, CardHead, EmptyNote, inputClass } from "../../_components/ui";
import { createProduct } from "../actions";

export const instant = false;

export default async function AdminNewProductPage() {
  const categories = await db
    .select({ id: category.id, name: category.name })
    .from(category)
    .orderBy(asc(category.name));

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/admin/produk"
          aria-label="Kembali ke daftar produk"
          className="grid h-9 w-9 place-items-center rounded-[9px] border border-line bg-surface text-ink-2 hover:bg-bg"
        >
          <ArrowLeft size={16} strokeWidth={2} />
        </Link>
        <div>
          <h1 className="admin-h1 text-[22px]">Produk baru</h1>
          <p className="admin-sub mt-1 text-[11.5px]">
            Slug dibuat otomatis dari nama. Varian dan foto ditambahkan setelah produk tersimpan.
          </p>
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="mt-6">
          <EmptyNote>
            Belum ada kategori.{" "}
            <Link className="admin-link" href="/admin/kategori">
              Buat kategori dulu
            </Link>
            .
          </EmptyNote>
        </div>
      ) : (
        <div className="admin-split mt-5">
          <Card className="min-w-0">
            <CardHead
              title="Informasi produk"
              note="Nama, kategori, dan deskripsi yang dilihat pembeli"
            />
            <div className="admin-card-body">
              <ActionForm action={createProduct} submitLabel="Simpan dan lanjut">
                <label className="admin-label">
                  Nama produk
                  <input name="name" required placeholder="Ikan Nila" className={inputClass} />
                </label>

                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="admin-label">
                    Kategori
                    <select name="categoryId" required defaultValue="" className={inputClass}>
                      <option value="" disabled>
                        Pilih kategori
                      </option>
                      {categories.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="admin-label">
                    Satuan
                    <input name="unitLabel" defaultValue="kg" className={inputClass} />
                    <span className="admin-help">
                      Tampil di toko sebagai &quot;per kg&quot; atau &quot;per ikat&quot;.
                    </span>
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
                </div>

                <label className="admin-label">
                  Deskripsi
                  <textarea name="description" rows={4} className={inputClass} />
                </label>

                <label className="flex items-center gap-2.5 rounded-[10px] bg-bg px-3.5 py-3 text-[12.5px] font-semibold text-ink">
                  <input type="checkbox" name="isActive" defaultChecked className="h-4 w-4" />
                  <span>
                    Tampil di toko
                    <span className="block text-[10.5px] font-normal text-ink-3">
                      Menyembunyikan produk tanpa menghapus riwayat pesanannya
                    </span>
                  </span>
                </label>
              </ActionForm>
            </div>
          </Card>

          <Card>
            <CardHead title="Yang terjadi saat disimpan" />
            <CardBody>
              <ul className="flex flex-col gap-3">
                {[
                  "Slug dibuat dari nama dan dijaga tetap unik.",
                  "Harga dan stok baru bisa diisi lewat varian.",
                  "Foto utama muncul di daftar produk toko.",
                ].map((text) => (
                  <li key={text} className="flex gap-2 text-[11.5px] leading-relaxed text-ink-2">
                    <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-ink-3" />
                    {text}
                  </li>
                ))}
              </ul>

              <p className="mt-4 flex gap-2.5 rounded-[10px] bg-green-50 p-3.5 text-[11.5px] leading-relaxed text-green-700">
                <Info size={15} strokeWidth={1.9} className="mt-0.5 shrink-0" />
                Produk tanpa varian tidak bisa dibeli. Tambahkan minimal satu varian setelah
                produk tersimpan.
              </p>
            </CardBody>
          </Card>
        </div>
      )}
    </>
  );
}
