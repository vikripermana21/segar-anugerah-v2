import { and, eq, lte } from "drizzle-orm";

import { db } from "@/db";
import { order, orderStatusHistory } from "@/db/schema";
import { restoreOrderStock } from "@/lib/orders";

const BATCH = 50;

/**
 * Menandai pesanan yang lewat batas bayar sebagai `expired` dan
 * mengembalikan stoknya tepat sekali. Dipanggil penjadwal tiap 5 menit.
 */
async function expireOrders(now: Date): Promise<{ checked: number; expired: number }> {
  const candidates = await db
    .select({ id: order.id })
    .from(order)
    .where(and(eq(order.status, "pending_payment"), lte(order.expiresAt, now)))
    .limit(BATCH);

  let expired = 0;

  for (const candidate of candidates) {
    const changed = await db.transaction(async (tx) => {
      const locked = await tx
        .select()
        .from(order)
        .where(eq(order.id, candidate.id))
        .for("update")
        .limit(1);

      const row = locked[0];
      if (!row || row.status !== "pending_payment" || row.expiresAt > now) return false;

      await tx
        .update(order)
        .set({ status: "expired", updatedAt: now })
        .where(eq(order.id, row.id));

      await restoreOrderStock(tx, row.id, now);

      await tx.insert(orderStatusHistory).values({
        orderId: row.id,
        fromStatus: "pending_payment",
        toStatus: "expired",
        changedBy: "system:cron",
        note: "Batas pembayaran lewat, stok dikembalikan.",
      });

      return true;
    });

    if (changed) expired += 1;
  }

  return { checked: candidates.length, expired };
}

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return Response.json({ ok: false, message: "Tidak diizinkan." }, { status: 401 });
  }

  const result = await expireOrders(new Date());
  return Response.json({ ok: true, ...result }, { headers: { "Cache-Control": "no-store" } });
}
