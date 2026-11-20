"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/db";
import { customer } from "@/db/schema";
import {
  createSession,
  destroySession,
  hashPassword,
  isValidPhone,
  normalizePhone,
  verifyPassword,
} from "@/lib/auth";

const credentials = z.object({
  phone: z.string().trim(),
  password: z.string().min(8, "Sandi minimal 8 karakter."),
});

const registration = credentials.extend({
  name: z.string().trim().min(2, "Nama minimal 2 karakter."),
});

export type AuthState = { error?: string };

/** Hanya rute internal yang boleh jadi tujuan setelah masuk. */
function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  if (!next.startsWith("/") || next.startsWith("//")) return "/account";
  return next;
}

export async function customerLogin(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = credentials.safeParse({
    phone: formData.get("phone"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Nomor dan sandi wajib diisi, sandi minimal 8 karakter." };
  }

  const phone = normalizePhone(parsed.data.phone);
  if (!isValidPhone(phone)) {
    return { error: "Nomor WhatsApp harus format 08xx, tanpa spasi atau tanda hubung." };
  }

  const rows = await db.select().from(customer).where(eq(customer.phone, phone)).limit(1);
  const buyer = rows[0];

  // Pesan sama untuk nomor tidak dikenal dan sandi salah.
  const invalid = { error: "Nomor atau sandi salah." };
  if (!buyer || !buyer.isActive) return invalid;
  if (!(await verifyPassword(parsed.data.password, buyer.passwordHash))) return invalid;

  await createSession("customer", buyer.id);
  redirect(safeNext(formData.get("next")));
}

export async function customerRegister(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = registration.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Isian belum benar." };
  }

  const phone = normalizePhone(parsed.data.phone);
  if (!isValidPhone(phone)) {
    return { error: "Nomor WhatsApp harus format 08xx, tanpa spasi atau tanda hubung." };
  }

  const existing = await db.select({ id: customer.id }).from(customer).where(eq(customer.phone, phone)).limit(1);
  if (existing[0]) {
    return { error: "Nomor ini sudah terdaftar. Masuk saja." };
  }

  const created = await db
    .insert(customer)
    .values({
      name: parsed.data.name,
      phone,
      passwordHash: await hashPassword(parsed.data.password),
    })
    .onConflictDoNothing({ target: customer.phone })
    .returning({ id: customer.id });

  const buyer = created[0];
  if (!buyer) {
    return { error: "Nomor ini sudah terdaftar. Masuk saja." };
  }

  await createSession("customer", buyer.id);
  redirect(safeNext(formData.get("next")));
}

export async function customerLogout(): Promise<void> {
  await destroySession("customer");
  redirect("/");
}
