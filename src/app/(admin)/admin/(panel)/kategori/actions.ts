"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { category } from "@/db/schema";
import { pgMessage, type ActionState } from "@/lib/action-state";
import { requireAdmin } from "@/lib/admin-guard";
import { slugify, uniqueSlug } from "@/lib/slug";

const schema = z.object({
  name: z.string().trim().min(2, "Nama kategori minimal 2 karakter."),
  description: z.string().trim().max(500).optional(),
  imageUrl: z.string().trim().optional(),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

function readForm(formData: FormData) {
  return schema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    imageUrl: formData.get("imageUrl") || undefined,
    sortOrder: formData.get("sortOrder") || 0,
  });
}

function refresh() {
  revalidatePath("/admin/kategori");
  revalidatePath("/admin");
}

export async function createCategory(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const parsed = readForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    const existing = await db.select({ slug: category.slug }).from(category);
    const taken = new Set(existing.map((row) => row.slug));
    const desired = slugify(parsed.data.name);

    await db.insert(category).values({
      name: parsed.data.name,
      slug: uniqueSlug(desired, taken),
      description: parsed.data.description ?? null,
      imageUrl: parsed.data.imageUrl ?? null,
      sortOrder: parsed.data.sortOrder,
    });
  } catch (error) {
    return { error: pgMessage(error, "Kategori gagal dibuat.") };
  }

  refresh();
  return { ok: `Kategori "${parsed.data.name}" dibuat.` };
}

export async function updateCategory(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Kategori tidak dikenal." };

  const parsed = readForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await db
      .update(category)
      .set({
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        imageUrl: parsed.data.imageUrl ?? null,
        sortOrder: parsed.data.sortOrder,
        updatedAt: new Date(),
      })
      .where(eq(category.id, id));
  } catch (error) {
    return { error: pgMessage(error, "Kategori gagal disimpan.") };
  }

  refresh();
  return { ok: "Perubahan disimpan." };
}

export async function setCategoryActive(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "1";
  if (!id) return;

  await db
    .update(category)
    .set({ isActive: active, updatedAt: new Date() })
    .where(eq(category.id, id));

  refresh();
}

export async function deleteCategory(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  try {
    await db.delete(category).where(eq(category.id, id));
  } catch {
    // Masih dipakai produk: halaman kategori mencegah tombol ini muncul.
    return;
  }

  refresh();
}
