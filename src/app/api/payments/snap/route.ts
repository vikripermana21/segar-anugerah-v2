import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { order } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { createSnapTransaction, isMidtransConfigured } from "@/lib/midtrans";
import { ORDER_EXPIRY_MINUTES } from "@/lib/order-rules";

const bodySchema = z.object({ orderNumber: z.string().min(6).max(40) });

export async function POST(request: Request) {
  const session = await getSession("customer");
  if (!session || session.type !== "customer") {
    return Response.json({ ok: false, message: "Masuk dulu untuk membayar." }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ ok: false, message: "Isi permintaan tidak valid." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json({ ok: false, message: "Nomor pesanan tidak valid." }, { status: 400 });
  }

  const rows = await db
    .select()
    .from(order)
    .where(
      and(eq(order.orderNumber, parsed.data.orderNumber), eq(order.customerId, session.id)),
    )
    .limit(1);

  const row = rows[0];
  if (!row) {
    return Response.json({ ok: false, message: "Pesanan tidak ditemukan." }, { status: 404 });
  }

  if (row.status !== "pending_payment") {
    return Response.json(
      { ok: false, message: "Pesanan ini sudah tidak menunggu pembayaran." },
      { status: 409 },
    );
  }

  const remainingMinutes = Math.ceil((row.expiresAt.getTime() - Date.now()) / 60000);
  if (remainingMinutes <= 0) {
    return Response.json(
      { ok: false, message: "Batas pembayaran sudah lewat. Buat pesanan baru." },
      { status: 409 },
    );
  }

  if (!isMidtransConfigured()) {
    return Response.json(
      { ok: false, message: "Pembayaran belum aktif. Hubungi toko." },
      { status: 503 },
    );
  }

  // Token Snap tetap berlaku sampai pesanan kedaluwarsa. Pakai ulang supaya
  // klik Bayar berulang tidak membuat transaksi baru dengan order_id sama.
  if (row.snapToken && row.snapRedirectUrl) {
    return Response.json(
      { ok: true, redirectUrl: row.snapRedirectUrl, token: row.snapToken, reused: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const resultUrl = new URL(
    `/checkout/result?order=${encodeURIComponent(row.orderNumber)}`,
    request.url,
  ).toString();

  try {
    const snap = await createSnapTransaction({
      orderNumber: row.orderNumber,
      grossAmount: row.total,
      expiryMinutes: Math.min(ORDER_EXPIRY_MINUTES, remainingMinutes),
      resultUrl,
      customer: { name: session.name, phone: session.phone },
    });

    await db
      .update(order)
      .set({
        snapToken: snap.token,
        snapRedirectUrl: snap.redirectUrl,
        snapCreatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(order.id, row.id));

    return Response.json(
      { ok: true, redirectUrl: snap.redirectUrl, token: snap.token, reused: false },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("snap gagal", row.orderNumber, error instanceof Error ? error.message : error);
    return Response.json(
      { ok: false, message: "Gagal membuka pembayaran. Coba lagi." },
      { status: 502 },
    );
  }
}
