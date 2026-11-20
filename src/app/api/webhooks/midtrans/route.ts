import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { order, orderStatusHistory, paymentEvent } from "@/db/schema";
import { verifySignature } from "@/lib/midtrans";
import { restoreOrderStock } from "@/lib/orders";

const notificationSchema = z.object({
  order_id: z.string().min(1),
  status_code: z.string().min(1),
  gross_amount: z.string().min(1),
  signature_key: z.string().min(1),
  transaction_status: z.string().min(1),
  transaction_id: z.string().optional(),
  fraud_status: z.string().optional(),
  payment_type: z.string().optional(),
  status_message: z.string().optional(),
});

export type MidtransNotification = z.infer<typeof notificationSchema>;

type OrderRow = typeof order.$inferSelect;

/** Event yang mengubah status, dipetakan ke status pesanan baru. */
function transitionFor(
  row: OrderRow,
  event: MidtransNotification,
): { status: OrderRow["status"]; note: string } | null {
  const paid = event.transaction_status === "settlement" ||
    (event.transaction_status === "capture" && event.fraud_status === "accept");

  if (paid) {
    if (row.status === "pending_payment") {
      return { status: "paid", note: "Pembayaran diterima lewat Midtrans." };
    }
    if (row.status === "expired") {
      return {
        status: "paid_late",
        note: "Pembayaran masuk setelah pesanan kedaluwarsa. Perlu ditinjau admin.",
      };
    }
    return null;
  }

  if (event.transaction_status === "expire") {
    if (row.status === "pending_payment") {
      return { status: "expired", note: "Pembayaran melewati batas waktu." };
    }
    return null;
  }

  if (
    event.transaction_status === "deny" ||
    event.transaction_status === "cancel" ||
    event.transaction_status === "failure"
  ) {
    if (row.status === "pending_payment") {
      return { status: "cancelled", note: "Pembayaran ditolak atau dibatalkan." };
    }
    return null;
  }

  if (event.transaction_status === "refund" || event.transaction_status === "partial_refund") {
    if (row.status === "paid" || row.status === "processing" || row.status === "out_for_delivery") {
      return { status: "refunded", note: "Dana dikembalikan lewat Midtrans." };
    }
    return null;
  }

  return null;
}

function releasesStock(status: OrderRow["status"]): boolean {
  return status === "expired" || status === "cancelled" || status === "refunded";
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ ok: false, message: "Body bukan JSON." }, { status: 400 });
  }

  const parsed = notificationSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json({ ok: false, message: "Notifikasi tidak lengkap." }, { status: 400 });
  }

  const event = parsed.data;
  const signatureValid = verifySignature(event);

  const found = await db
    .select()
    .from(order)
    .where(eq(order.orderNumber, event.order_id))
    .limit(1);
  const existing = found[0] ?? null;

  if (!signatureValid) {
    // Percobaan gagal tetap dicatat, tetapi diberi akhiran supaya tidak
    // menempati kunci unik event dan memblokir notifikasi sah berikutnya.
    await db.insert(paymentEvent).values({
      orderId: existing?.id ?? null,
      provider: "midtrans",
      eventType: event.transaction_status,
      transactionId: `${event.transaction_id ?? "tanpa-id"}:invalid:${Date.now()}`,
      payload: event,
      signatureValid: false,
      processedAt: new Date(),
    });
    console.warn("webhook tanda tangan tidak valid", event.order_id);
    return Response.json({ ok: false, message: "Tanda tangan tidak valid." }, { status: 401 });
  }

  if (!existing) {
    return Response.json({ ok: false, message: "Pesanan tidak dikenal." }, { status: 404 });
  }

  const inserted = await db
    .insert(paymentEvent)
    .values({
      orderId: existing.id,
      provider: "midtrans",
      eventType: event.transaction_status,
      transactionId: event.transaction_id ?? null,
      payload: event,
      signatureValid: true,
    })
    .onConflictDoNothing()
    .returning({ id: paymentEvent.id });

  let eventId = inserted[0]?.id;

  if (!eventId) {
    // Notifikasi yang dulu ditolak karena kunci salah boleh diproses ulang
    // setelah kuncinya diperbaiki.
    const prior =
      event.transaction_id && existing
        ? await db
            .select()
            .from(paymentEvent)
            .where(
              and(
                eq(paymentEvent.eventType, event.transaction_status),
                eq(paymentEvent.transactionId, event.transaction_id),
              ),
            )
            .limit(1)
        : [];

    const row = prior[0];
    if (!row || row.signatureValid) {
      return Response.json({ ok: true, duplicate: true }, { status: 200 });
    }

    await db
      .update(paymentEvent)
      .set({
        orderId: existing.id,
        payload: event,
        signatureValid: true,
        processedAt: null,
      })
      .where(eq(paymentEvent.id, row.id));
    eventId = row.id;
  }

  if (Number(event.gross_amount) !== existing.total) {
    await db
      .update(paymentEvent)
      .set({ processedAt: new Date() })
      .where(eq(paymentEvent.id, eventId));
    console.error("nominal webhook tidak cocok", existing.orderNumber, event.gross_amount);
    return Response.json({ ok: false, message: "Nominal tidak cocok." }, { status: 200 });
  }

  const applied = await db.transaction(async (tx) => {
    const locked = await tx
      .select()
      .from(order)
      .where(eq(order.id, existing.id))
      .for("update")
      .limit(1);

    const row = locked[0];
    if (!row) return { changed: false };

    const transition = transitionFor(row, event);
    if (!transition) return { changed: false };

    const now = new Date();
    await tx
      .update(order)
      .set({
        status: transition.status,
        paymentMethod: event.payment_type ?? row.paymentMethod,
        midtransTransactionId: event.transaction_id ?? row.midtransTransactionId,
        paidAt:
          transition.status === "paid" || transition.status === "paid_late"
            ? row.paidAt ?? now
            : row.paidAt,
        cancelledReason:
          transition.status === "cancelled"
            ? (event.status_message ?? "Pembayaran ditolak")
            : row.cancelledReason,
        updatedAt: now,
      })
      .where(eq(order.id, row.id));

    if (releasesStock(transition.status)) {
      await restoreOrderStock(tx, row.id, now);
    }

    await tx.insert(orderStatusHistory).values({
      orderId: row.id,
      fromStatus: row.status,
      toStatus: transition.status,
      changedBy: "system:midtrans",
      note: transition.note,
    });

    return { changed: true };
  });

  await db
    .update(paymentEvent)
    .set({ processedAt: new Date() })
    .where(eq(paymentEvent.id, eventId));

  console.info("webhook diproses", existing.orderNumber, event.transaction_status, applied.changed);

  return Response.json({ ok: true, changed: applied.changed }, { status: 200 });
}

export async function GET() {
  return Response.json({ ok: true, service: "midtrans-webhook" }, { status: 200 });
}
