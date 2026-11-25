"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { storeSetting } from "@/db/schema";
import { pgMessage, type ActionState } from "@/lib/action-state";
import { requireAdmin } from "@/lib/admin-guard";

const schema = z.object({
  storeName: z.string().trim().min(2, "Nama toko minimal 2 karakter."),
  whatsapp: z.string().trim().max(20).optional(),
  address: z.string().trim().max(300).optional(),
  freeShippingActive: z.coerce.boolean(),
  freeShippingUntil: z.string().trim().optional(),
  freeShippingMinSubtotal: z.coerce
    .number()
    .int()
    .min(0, "Minimal belanja tidak boleh negatif."),
  orderCutoffHour: z.coerce.number().int().min(0).max(23),
  paymentMode: z.enum(["whatsapp", "midtrans"]),
  bankName: z.string().trim().max(60).optional(),
  bankAccountNumber: z.string().trim().max(40).optional(),
  bankAccountName: z.string().trim().max(80).optional(),
});

export async function updateSettings(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const rawUntil = String(formData.get("freeShippingUntil") ?? "").trim();

  const parsed = schema.safeParse({
    storeName: formData.get("storeName"),
    whatsapp: formData.get("whatsapp") || undefined,
    address: formData.get("address") || undefined,
    freeShippingActive: formData.get("freeShippingActive") === "on",
    freeShippingUntil: rawUntil || undefined,
    freeShippingMinSubtotal: formData.get("freeShippingMinSubtotal") || 0,
    orderCutoffHour: formData.get("orderCutoffHour") || 16,
    paymentMode: formData.get("paymentMode") || "whatsapp",
    bankName: formData.get("bankName") || undefined,
    bankAccountNumber: formData.get("bankAccountNumber") || undefined,
    bankAccountName: formData.get("bankAccountName") || undefined,
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const until = parsed.data.freeShippingUntil
    ? new Date(`${parsed.data.freeShippingUntil}T23:59:59+07:00`)
    : null;

  if (until && Number.isNaN(until.getTime())) {
    return { error: "Tanggal berakhir gratis ongkir tidak valid." };
  }

  try {
    await db
      .update(storeSetting)
      .set({
        storeName: parsed.data.storeName,
        whatsapp: parsed.data.whatsapp ?? null,
        address: parsed.data.address ?? null,
        freeShippingActive: parsed.data.freeShippingActive,
        freeShippingUntil: until,
        freeShippingMinSubtotal: parsed.data.freeShippingMinSubtotal,
        orderCutoffHour: parsed.data.orderCutoffHour,
        paymentMode: parsed.data.paymentMode,
        bankName: parsed.data.bankName ?? null,
        bankAccountNumber: parsed.data.bankAccountNumber ?? null,
        bankAccountName: parsed.data.bankAccountName ?? null,
        updatedAt: new Date(),
      })
      .where(eq(storeSetting.id, 1));
  } catch (error) {
    return { error: pgMessage(error, "Pengaturan gagal disimpan.") };
  }

  revalidatePath("/admin/pengaturan");
  revalidatePath("/admin");
  return { ok: "Pengaturan disimpan." };
}
