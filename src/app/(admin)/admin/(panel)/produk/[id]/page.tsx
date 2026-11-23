import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { ArrowLeft, Check, ImagePlus, Info, Plus, Trash2 } from "lucide-react";

import { db } from "@/db";
import { category, product, productImage, productVariant } from "@/db/schema";
import { rupiah } from "@/lib/store-data";

import { ActionForm } from "../../_components/action-form";
import { ImageUploadForm } from "../../_components/image-upload-form";
import {
  Badge,
  Card,
  CardBody,
  CardHead,
  EmptyNote,
  inputClass,
} from "../../_components/ui";
import {
  addImage,
  addVariant,
  deleteImage,
  deleteProduct,
  deleteVariant,
  setPrimaryImage,
  saveVariant,
  updateProduct,
} from "../actions";

export const instant = false;

const variantGrid =
  "grid grid-cols-[140px_150px_110px_170px_36px] items-center gap-3";

export default async function AdminEditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [row] = await db.select().from(product).where(eq(product.id, id)).limit(1);
  if (!row) notFound();

  const [categories, variants, images] = await Promise.all([
    db
      .select({ id: category.id, name: category.name })
      .from(category)
      .orderBy(asc(category.sortOrder), asc(category.name)),
    db
      .select()
      .from(productVariant)
      .where(eq(productVariant.productId, id))
      .orderBy(asc(productVariant.sortOrder), asc(productVariant.createdAt)),
    db
      .select()
      .from(productImage)
      .where(eq(productImage.productId, id))
      .orderBy(asc(productImage.sortOrder), asc(productImage.createdAt)),
  ]);

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
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="admin-h1 truncate text-[20px]">{row.name}</h1>
            <Badge tone={row.isActive ? undefined : "muted"}>
              {row.isActive ? "Aktif" : "Nonaktif"}
            </Badge>
          </div>
          <p className="admin-sub mt-1 text-[11.5px]">/{row.slug}</p>
        </div>
      </div>

      <div className="admin-split mt-5">
        <div className="flex min-w-0 flex-col gap-4">
          <Card>
            <CardHead
              title="Informasi produk"
              note="Nama, kategori, dan deskripsi yang dilihat pembeli"
            />
            <div className="admin-card-body">
              <ActionForm action={updateProduct} submitLabel="Simpan produk">
                <input type="hidden" name="id" value={row.id} />

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="admin-label">
                    Nama produk
                    <input name="name" defaultValue={row.name} required className={inputClass} />
                  </label>

                  <label className="admin-label">
                    Kategori
                    <select
                      name="categoryId"
                      defaultValue={row.categoryId}
                      required
                      className={inputClass}
                    >
                      {categories.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="admin-label">
                    Satuan
                    <input name="unitLabel" defaultValue={row.unitLabel} className={inputClass} />
                    <span className="admin-help">
                      Tampil di toko sebagai &quot;per {row.unitLabel}&quot;.
                    </span>
                  </label>

                  <label className="admin-label">
                    Alamat halaman (slug)
                    <input
                      value={row.slug}
                      readOnly
                      aria-label="Slug produk"
                      className={`${inputClass} bg-bg text-ink-3`}
                    />
                    <span className="admin-help">Dibuat otomatis dari nama, dijaga tetap unik.</span>
                  </label>
                </div>

                <label className="admin-label">
                  Deskripsi
                  <textarea
                    name="description"
                    rows={4}
                    defaultValue={row.description ?? ""}
                    className={inputClass}
                  />
                </label>

                <label className="flex items-center gap-2.5 rounded-[10px] bg-bg px-3.5 py-3 text-[12.5px] font-semibold text-ink">
                  <input
                    type="checkbox"
                    name="isActive"
                    defaultChecked={row.isActive}
                    className="h-4 w-4"
                  />
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
            <CardHead
              title="Varian ukuran"
              note="Satu dimensi: ukuran atau berat · harga dan stok per varian"
              action={
                variants.length === 0 ? (
                  <Link href="#tambah-varian" className="admin-btn-ghost admin-btn-sm">
                    <Plus size={13} strokeWidth={2.2} />
                    Tambah varian
                  </Link>
                ) : undefined
              }
            />

            {variants.length === 0 ? (
              <div className="admin-card-body">
                <EmptyNote>Belum ada varian. Produk tanpa varian tidak bisa dibeli.</EmptyNote>
              </div>
            ) : (
              <div className="admin-table-wrap">
                <div className={`${variantGrid} border-b border-line-soft bg-[#FAFCF9] px-5 py-2 text-[11.5px] font-semibold text-ink-3`}>
                  <span>Label</span>
                  <span>Harga (Rp)</span>
                  <span>Stok</span>
                  <span>SKU</span>
                  <span />
                </div>

                {variants.map((variant) => (
                  <div key={variant.id} className="border-b border-line-soft last:border-b-0">
                    <div className={`${variantGrid} px-5 py-2.5`}>
                      <input
                        form={`variant-${variant.id}`}
                        name="label"
                        defaultValue={variant.label}
                        aria-label="Label varian"
                        className="h-9 w-full rounded-[7px] border border-line bg-surface px-2.5 text-[12px] text-ink outline-none focus:border-green-600"
                      />
                      <input
                        form={`variant-${variant.id}`}
                        name="price"
                        type="number"
                        min={0}
                        defaultValue={variant.price}
                        aria-label="Harga varian"
                        className="h-9 w-full rounded-[7px] border border-line bg-surface px-2.5 text-[12px] text-ink outline-none focus:border-green-600"
                      />
                      <input
                        form={`variant-${variant.id}`}
                        name="stock"
                        type="number"
                        min={0}
                        defaultValue={variant.stock}
                        aria-label="Stok varian"
                        className={`h-9 w-full rounded-[7px] border border-line bg-surface px-2.5 text-[12px] outline-none focus:border-green-600 ${
                          variant.stock === 0 ? "text-amber-700" : "text-ink"
                        }`}
                      />
                      <input
                        form={`variant-${variant.id}`}
                        name="sku"
                        defaultValue={variant.sku ?? ""}
                        aria-label="SKU varian"
                        className="h-9 w-full rounded-[7px] border border-line bg-surface px-2.5 text-[12px] text-ink outline-none focus:border-green-600"
                      />

                      <form id={`variant-${variant.id}`} action={saveVariant}>
                        <input type="hidden" name="id" value={variant.id} />
                        <input type="hidden" name="productId" value={row.id} />
                        <button
                          type="submit"
                          aria-label={`Simpan varian ${variant.label}`}
                          className="grid h-8 w-8 place-items-center rounded-[7px] border border-line bg-surface text-green-700 hover:bg-green-50"
                        >
                          <Check size={14} strokeWidth={2.2} />
                        </button>
                      </form>
                    </div>

                    <div className="flex items-center justify-between gap-2 px-5 pb-2.5">
                      <label className="flex items-center gap-2 text-[11.5px] text-ink-2">
                        <input
                          form={`variant-${variant.id}`}
                          type="checkbox"
                          name="isActive"
                          defaultChecked={variant.isActive}
                          className="admin-check-switch"
                        />
                        Varian aktif · {rupiah(variant.price)} · stok {variant.stock}
                      </label>
                      <form action={deleteVariant}>
                        <input type="hidden" name="id" value={variant.id} />
                        <input type="hidden" name="productId" value={row.id} />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-ink-3 hover:text-red-600"
                        >
                          <Trash2 size={13} strokeWidth={1.9} />
                          Hapus
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-line-soft px-5 py-3 text-[10.5px] leading-relaxed text-ink-3">
              Varian tanpa stok tetap tampil di toko dan ditandai habis. Harga baru berlaku untuk
              pesanan berikutnya.
            </div>

            <div id="tambah-varian" className="border-t border-line-soft px-5 py-4">
              <h3 className="text-[12.5px] font-semibold text-ink">Tambah varian</h3>

              <ActionForm action={addVariant} submitLabel="Tambah varian">
                <input type="hidden" name="productId" value={row.id} />

                <div className="grid gap-3 sm:grid-cols-4">
                  <label className="admin-label">
                    Label
                    <input name="label" required placeholder="1 kg" className={inputClass} />
                  </label>
                  <label className="admin-label">
                    Harga (Rp)
                    <input name="price" type="number" min={0} required className={inputClass} />
                  </label>
                  <label className="admin-label">
                    Stok
                    <input
                      name="stock"
                      type="number"
                      min={0}
                      defaultValue={0}
                      className={inputClass}
                    />
                  </label>
                  <label className="admin-label">
                    SKU
                    <input name="sku" className={inputClass} />
                  </label>
                </div>
              </ActionForm>
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHead
              title="Foto produk"
              note={`${images.length} / 4`}
              action={<ImagePlus size={15} strokeWidth={1.9} className="text-ink-3" />}
            />

            <div className="admin-card-body">
              {images.length === 0 ? (
                <EmptyNote>Belum ada foto.</EmptyNote>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  {images.map((image) => (
                    <div key={image.id} className="flex flex-col gap-1.5">
                      <span className="relative block h-[74px] overflow-hidden rounded-[9px] border border-line bg-green-50">
                        <Image
                          src={image.url}
                          alt={image.alt ?? row.name}
                          fill
                          sizes="160px"
                          className="object-cover"
                        />
                        {image.isPrimary ? (
                          <span className="absolute left-1.5 top-1.5 rounded-full bg-surface px-2 py-0.5 text-[9.5px] font-semibold text-green-700">
                            Utama
                          </span>
                        ) : null}
                      </span>

                      <div className="flex items-center justify-between gap-1">
                        {image.isPrimary ? (
                          <span className="text-[10px] text-ink-3">Foto utama</span>
                        ) : (
                          <form action={setPrimaryImage}>
                            <input type="hidden" name="id" value={image.id} />
                            <input type="hidden" name="productId" value={row.id} />
                            <button type="submit" className="text-[10px] font-semibold text-green-700">
                              Jadikan utama
                            </button>
                          </form>
                        )}

                        <form action={deleteImage}>
                          <input type="hidden" name="id" value={image.id} />
                          <input type="hidden" name="productId" value={row.id} />
                          <button
                            type="submit"
                            aria-label="Hapus foto"
                            className="text-ink-3 hover:text-red-600"
                          >
                            <Trash2 size={12} strokeWidth={2} />
                          </button>
                        </form>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {images.length < 4 ? (
                <div className="mt-4">
                  <ImageUploadForm productId={row.id} action={addImage} />
                </div>
              ) : null}

              <p className="admin-help mt-3">
                Maksimal 4 foto. Foto dikecilkan di browser lalu diunggah langsung ke Cloudflare R2,
                jadi fungsi Vercel tidak melewati batas 4,5 MB. Foto utama pindah otomatis kalau
                dihapus.
              </p>
            </div>
          </Card>

          <Card>
            <CardHead title="Yang terjadi saat disimpan" />
            <CardBody>
              <ul className="flex flex-col gap-3">
                {[
                  "Harga baru berlaku untuk pesanan berikutnya.",
                  "Pesanan lama menyimpan salinan nama, varian, dan harganya.",
                  "Menonaktifkan produk menyembunyikan dari toko tanpa menghapus riwayat.",
                ].map((text) => (
                  <li key={text} className="flex gap-2 text-[11.5px] leading-relaxed text-ink-2">
                    <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-ink-3" />
                    {text}
                  </li>
                ))}
              </ul>

              <p className="mt-4 flex gap-2.5 rounded-[10px] bg-green-50 p-3.5 text-[11.5px] leading-relaxed text-green-700">
                <Info size={15} strokeWidth={1.9} className="mt-0.5 shrink-0" />
                Tidak ada riwayat perubahan harga di MVP. Periksa harga sebelum menyimpan.
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHead title="Hapus produk" note="Riwayat pesanan tetap utuh" />
            <CardBody>
              <p className="text-[11.5px] leading-relaxed text-ink-2">
                Produk yang sudah pernah dipesan tidak bisa dihapus. Nonaktifkan saja supaya riwayat
                pesanan tetap utuh.
              </p>

              <form action={deleteProduct} className="mt-3">
                <input type="hidden" name="id" value={row.id} />
                <button type="submit" className="admin-btn-danger">
                  Hapus produk ini
                </button>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
