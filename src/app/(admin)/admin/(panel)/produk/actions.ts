"use server";

import { revalidatePath } from "next/cache";
import { and, asc, eq, ne } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/db";
import { product, productImage, productVariant } from "@/db/schema";
import { pgMessage, type ActionState } from "@/lib/action-state";
import { requireAdmin } from "@/lib/admin-guard";
import { deleteR2Object, r2KeyFromUrl } from "@/lib/r2";
import { slugify, uniqueSlug } from "@/lib/slug";

const productSchema = z.object({
  name: z.string().trim().min(2, "Nama produk minimal 2 karakter."),
  categoryId: z.string().uuid("Pilih kategori."),
  description: z.string().trim().max(2000).optional(),
  unitLabel: z.string().trim().min(1, "Satuan wajib diisi.").max(20),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.coerce.boolean().default(true),
});

const variantSchema = z.object({
  label: z.string().trim().min(1, "Label varian wajib diisi.").max(40),
  price: z.coerce.number().int("Harga harus angka bulat.").min(0, "Harga tidak boleh negatif."),
  stock: z.coerce.number().int("Stok harus angka bulat.").min(0, "Stok tidak boleh negatif."),
  sku: z.string().trim().max(40).optional(),
});

function refreshProduct(id?: string) {
  revalidatePath("/admin/produk");
  revalidatePath("/admin");
  if (id) revalidatePath(`/admin/produk/${id}`);
}

function wantActive(formData: FormData) {
  return formData.get("isActive") === "on" || formData.get("isActive") === "1";
}

export async function createProduct(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    categoryId: formData.get("categoryId"),
    description: formData.get("description") || undefined,
    unitLabel: formData.get("unitLabel") || "kg",
    sortOrder: formData.get("sortOrder") || 0,
    isActive: wantActive(formData),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  let newId: string;

  try {
    const existing = await db.select({ slug: product.slug }).from(product);
    const taken = new Set(existing.map((row) => row.slug));

    const inserted = await db
      .insert(product)
      .values({
        name: parsed.data.name,
        categoryId: parsed.data.categoryId,
        slug: uniqueSlug(slugify(parsed.data.name), taken),
        description: parsed.data.description ?? null,
        unitLabel: parsed.data.unitLabel,
        sortOrder: parsed.data.sortOrder,
        isActive: parsed.data.isActive,
      })
      .returning({ id: product.id });

    newId = inserted[0].id;
  } catch (error) {
    return { error: pgMessage(error, "Produk gagal dibuat.") };
  }

  refreshProduct(newId);
  redirect(`/admin/produk/${newId}`);
}

export async function updateProduct(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Produk tidak dikenal." };

  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    categoryId: formData.get("categoryId"),
    description: formData.get("description") || undefined,
    unitLabel: formData.get("unitLabel") || "kg",
    sortOrder: formData.get("sortOrder") || 0,
    isActive: wantActive(formData),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await db
      .update(product)
      .set({
        name: parsed.data.name,
        categoryId: parsed.data.categoryId,
        description: parsed.data.description ?? null,
        unitLabel: parsed.data.unitLabel,
        sortOrder: parsed.data.sortOrder,
        isActive: parsed.data.isActive,
        updatedAt: new Date(),
      })
      .where(eq(product.id, id));
  } catch (error) {
    return { error: pgMessage(error, "Produk gagal disimpan.") };
  }

  refreshProduct(id);
  return { ok: "Produk disimpan." };
}

export async function setProductActive(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await db
    .update(product)
    .set({ isActive: formData.get("active") === "1", updatedAt: new Date() })
    .where(eq(product.id, id));

  refreshProduct(id);
}

export async function deleteProduct(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const images = await db
    .select({ url: productImage.url })
    .from(productImage)
    .where(eq(productImage.productId, id));

  await db.delete(product).where(eq(product.id, id));

  for (const image of images) {
    const key = r2KeyFromUrl(image.url);
    if (key) await deleteR2Object(key);
  }

  refreshProduct();
  redirect("/admin/produk");
}

export async function addVariant(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const productId = String(formData.get("productId") ?? "");
  if (!productId) return { error: "Produk tidak dikenal." };

  const parsed = variantSchema.safeParse({
    label: formData.get("label"),
    price: formData.get("price"),
    stock: formData.get("stock"),
    sku: formData.get("sku") || undefined,
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await db.insert(productVariant).values({
      productId,
      label: parsed.data.label,
      price: parsed.data.price,
      stock: parsed.data.stock,
      sku: parsed.data.sku ?? null,
    });
  } catch (error) {
    return { error: pgMessage(error, "Varian gagal ditambah. Label mungkin sudah dipakai.") };
  }

  refreshProduct(productId);
  return { ok: `Varian "${parsed.data.label}" ditambah.` };
}

export async function updateVariant(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const productId = String(formData.get("productId") ?? "");
  if (!id || !productId) return { error: "Varian tidak dikenal." };

  const parsed = variantSchema.safeParse({
    label: formData.get("label"),
    price: formData.get("price"),
    stock: formData.get("stock"),
    sku: formData.get("sku") || undefined,
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await db
      .update(productVariant)
      .set({
        label: parsed.data.label,
        price: parsed.data.price,
        stock: parsed.data.stock,
        sku: parsed.data.sku ?? null,
        isActive: wantActive(formData),
        updatedAt: new Date(),
      })
      .where(eq(productVariant.id, id));
  } catch (error) {
    return { error: pgMessage(error, "Varian gagal disimpan.") };
  }

  refreshProduct(productId);
  return { ok: "Varian disimpan." };
}

/** Versi form-langsung dari updateVariant, tanpa useActionState. */
export async function saveVariant(formData: FormData): Promise<void> {
  await updateVariant({}, formData);
}

export async function deleteVariant(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const productId = String(formData.get("productId") ?? "");
  if (!id) return;

  await db.delete(productVariant).where(eq(productVariant.id, id));
  refreshProduct(productId);
}

export async function addImage(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const productId = String(formData.get("productId") ?? "");
  if (!productId) return { error: "Produk tidak dikenal." };

  const url = String(formData.get("url") ?? "").trim();
  const alt = String(formData.get("alt") ?? "").trim().slice(0, 160);

  if (!url) return { error: "Berkas foto wajib diunggah." };
  if (url.length > 600 || (!url.startsWith("/") && !url.startsWith("https://"))) {
    return { error: "URL foto tidak valid." };
  }

  const existing = await db
    .select({ id: productImage.id })
    .from(productImage)
    .where(eq(productImage.productId, productId));

  if (existing.length >= 4) return { error: "Maksimal 4 foto per produk." };

  try {
    await db.insert(productImage).values({
      productId,
      url,
      alt: alt || null,
      isPrimary: existing.length === 0,
      sortOrder: existing.length,
    });
  } catch (error) {
    return { error: pgMessage(error, "Foto gagal ditambah.") };
  }

  refreshProduct(productId);
  return { ok: "Foto ditambah." };
}

export async function setPrimaryImage(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const productId = String(formData.get("productId") ?? "");
  if (!id || !productId) return;

  await db
    .update(productImage)
    .set({ isPrimary: false })
    .where(eq(productImage.productId, productId));

  await db.update(productImage).set({ isPrimary: true }).where(eq(productImage.id, id));

  refreshProduct(productId);
}

export async function deleteImage(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const productId = String(formData.get("productId") ?? "");
  if (!id || !productId) return;

  const rows = await db.select().from(productImage).where(eq(productImage.productId, productId));
  const target = rows.find((row) => row.id === id);

  await db.delete(productImage).where(eq(productImage.id, id));

  if (target) {
    const key = r2KeyFromUrl(target.url);
    if (key) await deleteR2Object(key);
  }

  if (target?.isPrimary) {
    const next = await db
      .select()
      .from(productImage)
      .where(and(eq(productImage.productId, productId), ne(productImage.id, id)))
      .orderBy(asc(productImage.sortOrder))
      .limit(1);

    if (next[0]) {
      await db.update(productImage).set({ isPrimary: true }).where(eq(productImage.id, next[0].id));
    }
  }

  refreshProduct(productId);
}
