"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { deliveryZone, deliveryZoneArea } from "@/db/schema";
import { pgMessage, type ActionState } from "@/lib/action-state";
import { requireAdmin } from "@/lib/admin-guard";

const zoneSchema = z.object({
  name: z.string().trim().min(2, "Nama zona minimal 2 karakter."),
  fee: z.coerce.number().int("Tarif harus angka bulat.").min(0, "Tarif tidak boleh negatif."),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

const areaSchema = z.object({
  kecamatan: z.string().trim().min(2, "Kecamatan wajib diisi."),
  city: z.string().trim().min(2, "Kota wajib diisi."),
});

function refresh() {
  revalidatePath("/admin/zona");
  revalidatePath("/admin");
}

export async function createZone(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const parsed = zoneSchema.safeParse({
    name: formData.get("name"),
    fee: formData.get("fee"),
    sortOrder: formData.get("sortOrder") || 0,
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  let newId: string;

  try {
    const inserted = await db.insert(deliveryZone).values(parsed.data).returning({ id: deliveryZone.id });
    newId = inserted[0].id;
  } catch (error) {
    return { error: pgMessage(error, "Zona gagal dibuat.") };
  }

  refresh();
  redirect(`/admin/zona?zona=${newId}`);
}

export async function updateZone(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Zona tidak dikenal." };

  const parsed = zoneSchema.safeParse({
    name: formData.get("name"),
    fee: formData.get("fee"),
    sortOrder: formData.get("sortOrder") || 0,
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await db
      .update(deliveryZone)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(deliveryZone.id, id));
  } catch (error) {
    return { error: pgMessage(error, "Zona gagal disimpan.") };
  }

  refresh();
  return { ok: "Zona disimpan." };
}

export async function setZoneActive(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await db
    .update(deliveryZone)
    .set({ isActive: formData.get("active") === "1", updatedAt: new Date() })
    .where(eq(deliveryZone.id, id));

  refresh();
}

export async function addArea(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const zoneId = String(formData.get("zoneId") ?? "");
  if (!zoneId) return { error: "Zona tidak dikenal." };

  const parsed = areaSchema.safeParse({
    kecamatan: formData.get("kecamatan"),
    city: formData.get("city"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await db.insert(deliveryZoneArea).values({ zoneId, ...parsed.data });
  } catch (error) {
    return {
      error: pgMessage(error, "Kecamatan itu sudah dipakai zona lain. Satu kecamatan satu zona."),
    };
  }

  refresh();
  return { ok: `${parsed.data.kecamatan} ditambahkan.` };
}

export async function deleteArea(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await db.delete(deliveryZoneArea).where(eq(deliveryZoneArea.id, id));
  refresh();
}
