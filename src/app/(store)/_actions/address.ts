"use server";

import { and, count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { customerAddress } from "@/db/schema";
import type { ActionState } from "@/lib/action-state";
import { isValidPhone, normalizePhone } from "@/lib/auth";
import { requireCustomer } from "@/lib/customer-guard";

const addressSchema = z.object({
  label: z.string().trim().min(2, "Label alamat minimal 2 karakter."),
  recipientName: z.string().trim().min(2, "Nama penerima minimal 2 karakter."),
  phone: z.string().trim(),
  addressLine: z.string().trim().min(8, "Alamat lengkap minimal 8 karakter."),
  kecamatan: z.string().trim().min(2, "Pilih kecamatan."),
  city: z.string().trim().min(2, "Kota wajib diisi."),
  postalCode: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

const PATH = "/account/addresses";

export async function saveAddress(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireCustomer(PATH);

  const parsed = addressSchema.safeParse({
    label: formData.get("label"),
    recipientName: formData.get("recipientName"),
    phone: formData.get("phone"),
    addressLine: formData.get("addressLine"),
    kecamatan: formData.get("kecamatan"),
    city: formData.get("city"),
    postalCode: formData.get("postalCode") ?? "",
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Alamat belum lengkap." };
  }

  const phone = normalizePhone(parsed.data.phone);
  if (!isValidPhone(phone)) {
    return { error: "Nomor WhatsApp harus format 08xx, tanpa spasi atau tanda hubung." };
  }

  const values = {
    label: parsed.data.label,
    recipientName: parsed.data.recipientName,
    phone,
    addressLine: parsed.data.addressLine,
    kecamatan: parsed.data.kecamatan,
    city: parsed.data.city,
    postalCode: parsed.data.postalCode || null,
    notes: parsed.data.notes || null,
    updatedAt: new Date(),
  };

  const id = String(formData.get("id") ?? "");
  if (id) {
    const updated = await db
      .update(customerAddress)
      .set(values)
      .where(and(eq(customerAddress.id, id), eq(customerAddress.customerId, session.id)))
      .returning({ id: customerAddress.id });

    if (!updated[0]) return { error: "Alamat tidak ditemukan." };
    revalidatePath(PATH);
    return { ok: "Alamat tersimpan." };
  }

  const [owned] = await db
    .select({ total: count() })
    .from(customerAddress)
    .where(eq(customerAddress.customerId, session.id));

  await db.insert(customerAddress).values({
    ...values,
    customerId: session.id,
    isDefault: (owned?.total ?? 0) === 0,
  });

  revalidatePath(PATH);
  return { ok: "Alamat tersimpan." };
}

export async function setDefaultAddress(formData: FormData): Promise<void> {
  const session = await requireCustomer(PATH);
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const owned = await db
    .select({ id: customerAddress.id })
    .from(customerAddress)
    .where(and(eq(customerAddress.id, id), eq(customerAddress.customerId, session.id)))
    .limit(1);
  if (!owned[0]) return;

  await db.transaction(async (tx) => {
    await tx
      .update(customerAddress)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(eq(customerAddress.customerId, session.id));
    await tx
      .update(customerAddress)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(eq(customerAddress.id, id));
  });

  revalidatePath(PATH);
}

export async function deleteAddress(formData: FormData): Promise<void> {
  const session = await requireCustomer(PATH);
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const removed = await db
    .delete(customerAddress)
    .where(and(eq(customerAddress.id, id), eq(customerAddress.customerId, session.id)))
    .returning({ isDefault: customerAddress.isDefault });

  if (removed[0]?.isDefault) {
    const next = await db
      .select({ id: customerAddress.id })
      .from(customerAddress)
      .where(eq(customerAddress.customerId, session.id))
      .limit(1);

    if (next[0]) {
      await db
        .update(customerAddress)
        .set({ isDefault: true, updatedAt: new Date() })
        .where(eq(customerAddress.id, next[0].id));
    }
  }

  revalidatePath(PATH);
}
