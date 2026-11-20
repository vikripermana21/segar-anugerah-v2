import { z } from "zod";

import { getSession } from "@/lib/auth";
import { createOrder } from "@/lib/orders";

const bodySchema = z.object({
  addressId: z.string().uuid(),
  kecamatan: z.string().trim().min(2),
  city: z.string().trim().min(2),
  note: z.string().trim().max(200).optional(),
  idempotencyKey: z.string().uuid().optional(),
  items: z
    .array(
      z.object({
        variantId: z.string().uuid(),
        quantity: z.number().int().min(1).max(99),
      }),
    )
    .min(1)
    .max(50),
});

/**
 * Membuat pesanan dan mengunci stok. Nominal tidak pernah diambil dari klien;
 * harga, ongkir, dan potongan dihitung ulang dari database.
 */
export async function POST(request: Request) {
  const session = await getSession("customer");
  if (!session || session.type !== "customer") {
    return Response.json(
      { ok: false, code: "unauthorized", message: "Masuk dulu untuk memesan." },
      { status: 401 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json(
      { ok: false, code: "invalid_body", message: "Isi permintaan tidak valid." },
      { status: 400 },
    );
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json(
      { ok: false, code: "invalid_body", message: "Data pesanan tidak lengkap." },
      { status: 400 },
    );
  }

  try {
    const result = await createOrder({
      customerId: session.id,
      addressId: parsed.data.addressId,
      kecamatan: parsed.data.kecamatan,
      city: parsed.data.city,
      note: parsed.data.note,
      idempotencyKey: parsed.data.idempotencyKey,
      items: parsed.data.items,
    });

    if (result.ok) {
      return Response.json(result, {
        status: 201,
        headers: { "Cache-Control": "no-store" },
      });
    }

    const status =
      result.code === "rate_limited"
        ? 429
        : result.code === "address_not_found" || result.code === "zone_unavailable"
          ? 404
          : result.code === "out_of_stock" ||
              result.code === "variant_unavailable" ||
              result.code === "too_many_pending"
            ? 409
            : 400;

    return Response.json(result, { status, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("checkout gagal", error);
    return Response.json(
      {
        ok: false,
        code: "server_error",
        message: "Pesanan gagal dibuat. Coba lagi sebentar.",
      },
      { status: 500 },
    );
  }
}
