"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/db";
import { adminUser } from "@/db/schema";
import { createSession, normalizePhone, verifyPassword } from "@/lib/auth";

const loginSchema = z.object({
  phone: z.string().min(8),
  password: z.string().min(1),
});

export type LoginState = { error?: string };

export async function adminLogin(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    phone: formData.get("phone"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Nomor dan sandi wajib diisi." };
  }

  const phone = normalizePhone(parsed.data.phone);
  const rows = await db.select().from(adminUser).where(eq(adminUser.phone, phone)).limit(1);
  const admin = rows[0];

  // Pesan yang sama untuk nomor tidak dikenal dan sandi salah:
  // jangan bocorkan nomor mana yang terdaftar.
  const invalid = { error: "Nomor atau sandi salah." };

  if (!admin || !admin.isActive) return invalid;
  if (!(await verifyPassword(parsed.data.password, admin.passwordHash))) return invalid;

  await db.update(adminUser).set({ lastLoginAt: new Date() }).where(eq(adminUser.id, admin.id));
  await createSession("admin", admin.id);

  redirect("/admin");
}
