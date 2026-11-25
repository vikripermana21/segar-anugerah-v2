"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { adminUser, session } from "@/db/schema";
import { pgMessage, type ActionState } from "@/lib/action-state";
import { requireAdmin } from "@/lib/admin-guard";
import { hashPassword, isValidPhone, normalizePhone } from "@/lib/auth";

const addSchema = z
  .object({
    name: z.string().trim().min(2, "Nama minimal 2 karakter.").max(80, "Nama maksimal 80 karakter."),
    phone: z.string().trim().min(8, "Nomor WhatsApp wajib diisi."),
    password: z.string().min(8, "Sandi minimal 8 karakter.").max(72, "Sandi maksimal 72 karakter."),
    confirm: z.string(),
  })
  .refine((value) => value.password === value.confirm, {
    message: "Ulangi sandi dengan benar.",
    path: ["confirm"],
  });

export async function createAdmin(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const parsed = addSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const phone = normalizePhone(parsed.data.phone);
  if (!isValidPhone(phone)) return { error: "Nomor WhatsApp tidak valid. Contoh: 08123456789." };

  try {
    await db.insert(adminUser).values({
      name: parsed.data.name,
      phone,
      passwordHash: await hashPassword(parsed.data.password),
    });
  } catch (error) {
    return { error: pgMessage(error, "Pengguna admin gagal dibuat.") };
  }

  revalidatePath("/admin/pengguna");
  return { ok: "Pengguna admin dibuat." };
}

const activeSchema = z.object({
  id: z.string().uuid("Pengguna tidak dikenal."),
  active: z.enum(["0", "1"]),
});

/**
 * Menonaktifkan admin menghapus semua sesinya. Pemeriksaan jumlah admin aktif
 * dilakukan dalam transaksi dengan kunci baris supaya dua admin terakhir tidak
 * bisa saling menonaktifkan bersamaan.
 */
export async function setAdminActive(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const current = await requireAdmin();

  const parsed = activeSchema.safeParse({
    id: formData.get("id"),
    active: formData.get("active"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const active = parsed.data.active === "1";

  if (!active && parsed.data.id === current.id) {
    return { error: "Tidak bisa menonaktifkan akun sendiri. Minta admin lain." };
  }

  let result: ActionState;

  try {
    result = await db.transaction(async (tx) => {
      const activeRows = await tx
        .select({ id: adminUser.id })
        .from(adminUser)
        .where(eq(adminUser.isActive, true))
        .for("update");

      const targetRows = await tx
        .select()
        .from(adminUser)
        .where(eq(adminUser.id, parsed.data.id))
        .for("update")
        .limit(1);

      const target = targetRows[0];
      if (!target) return { error: "Pengguna admin tidak ditemukan." };

      if (!active && target.isActive && activeRows.length <= 1) {
        return { error: "Tidak bisa menonaktifkan admin aktif terakhir." };
      }

      await tx
        .update(adminUser)
        .set({ isActive: active, updatedAt: new Date() })
        .where(eq(adminUser.id, target.id));

      if (!active) {
        await tx
          .delete(session)
          .where(
            and(eq(session.subjectType, "admin"), eq(session.subjectId, target.id)),
          );
      }

      return { ok: active ? "Pengguna diaktifkan." : "Pengguna dinonaktifkan." };
    });
  } catch (error) {
    return { error: pgMessage(error, "Status pengguna gagal diubah.") };
  }

  revalidatePath("/admin/pengguna");
  return result;
}
