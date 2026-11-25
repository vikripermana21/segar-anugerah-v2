"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { order, orderStatusHistory } from "@/db/schema";
import { pgMessage, type ActionState } from "@/lib/action-state";
import { requireAdmin } from "@/lib/admin-guard";
import { restoreOrderStock } from "@/lib/orders";
import { orderStatusMeta, type OrderStatus } from "@/lib/order-status";
import {
  adminActionMeta,
  canAdminAct,
  releasesStockOnCancel,
  type AdminOrderAction,
} from "@/lib/order-transitions";

const changeSchema = z.object({
  orderNumber: z
    .string()
    .trim()
    .regex(/^SA-\d{6}-\d{4}$/, "Nomor pesanan tidak valid."),
  action: z.enum(["dispatch", "complete", "cancel", "refund"]),
  reason: z.string().trim().max(300, "Alasan maksimal 300 karakter.").optional(),
});

function noteFor(action: AdminOrderAction, reason?: string): string {
  switch (action) {
    case "dispatch":
      return "Pesanan diserahkan ke kurir.";
    case "complete":
      return "Pesanan selesai.";
    case "cancel":
      return `Dibatalkan admin: ${reason}`;
    case "refund":
      return "Dana dikembalikan lewat Midtrans.";
  }
}

/**
 * Satu pintu untuk semua perubahan status oleh admin. Status dibaca ulang
 * dengan `for update` supaya webhook atau cron tidak berlomba.
 */
export async function changeOrderStatus(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireAdmin();

  const parsed = changeSchema.safeParse({
    orderNumber: formData.get("orderNumber"),
    action: formData.get("action"),
    reason: formData.get("reason") || undefined,
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { orderNumber, action } = parsed.data;
  const reason = parsed.data.reason?.trim();

  if (action === "cancel" && (!reason || reason.length < 3)) {
    return { error: "Alasan pembatalan wajib diisi, minimal 3 karakter." };
  }

  let result: ActionState;

  try {
    result = await db.transaction(async (tx) => {
      const locked = await tx
        .select()
        .from(order)
        .where(eq(order.orderNumber, orderNumber))
        .for("update")
        .limit(1);

      const row = locked[0];
      if (!row) return { error: "Pesanan tidak ditemukan." };

      const current = row.status as OrderStatus;

      if (!canAdminAct(current, action, { paidAt: row.paidAt })) {
        return {
          error: `Pesanan berstatus ${orderStatusMeta[current]?.label ?? current} tidak bisa diubah menjadi ${adminActionMeta[action].label.toLowerCase()}.`,
        };
      }

      const next = adminActionMeta[action].next;
      const now = new Date();

      await tx
        .update(order)
        .set({
          status: next,
          cancelledReason: action === "cancel" ? reason : row.cancelledReason,
          updatedAt: now,
        })
        .where(eq(order.id, row.id));

      if (action === "cancel" && releasesStockOnCancel(current)) {
        await restoreOrderStock(tx, row.id, now);
      }

      await tx.insert(orderStatusHistory).values({
        orderId: row.id,
        fromStatus: current,
        toStatus: next,
        changedBy: session.name,
        note: noteFor(action, reason),
      });

      return { ok: "Status pesanan diperbarui." };
    });
  } catch (error) {
    return { error: pgMessage(error, "Status pesanan gagal diubah.") };
  }

  if (result.ok) {
    revalidatePath("/admin");
    revalidatePath("/admin/pesanan");
    revalidatePath(`/admin/pesanan/${orderNumber}`);
    revalidatePath("/account/orders");
    revalidatePath(`/account/orders/${orderNumber}`);
  }

  return result;
}
