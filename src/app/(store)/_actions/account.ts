"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { customer } from "@/db/schema";
import type { ActionState } from "@/lib/action-state";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { requireCustomer } from "@/lib/customer-guard";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter."),
});

export async function updateProfile(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireCustomer();
  const parsed = profileSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Nama belum benar." };
  }

  await db
    .update(customer)
    .set({ name: parsed.data.name, updatedAt: new Date() })
    .where(eq(customer.id, session.id));

  revalidatePath("/account");
  return { ok: "Data tersimpan." };
}

const passwordSchema = z.object({
  current: z.string().min(1, "Sandi sekarang wajib diisi."),
  next: z.string().min(8, "Sandi baru minimal 8 karakter."),
});

export async function changePassword(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireCustomer();
  const parsed = passwordSchema.safeParse({
    current: formData.get("current"),
    next: formData.get("next"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Sandi belum benar." };
  }

  const rows = await db
    .select({ passwordHash: customer.passwordHash })
    .from(customer)
    .where(eq(customer.id, session.id))
    .limit(1);

  const buyer = rows[0];
  if (!buyer || !(await verifyPassword(parsed.data.current, buyer.passwordHash))) {
    return { error: "Sandi sekarang salah." };
  }

  await db
    .update(customer)
    .set({ passwordHash: await hashPassword(parsed.data.next), updatedAt: new Date() })
    .where(eq(customer.id, session.id));

  return { ok: "Sandi tersimpan." };
}
