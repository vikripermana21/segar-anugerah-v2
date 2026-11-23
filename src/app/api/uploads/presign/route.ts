import { count, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { product, productImage } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { MAX_UPLOAD_BYTES, presignImageUpload } from "@/lib/r2";

const MAX_IMAGES = 4;

const bodySchema = z.object({
  productId: z.string().uuid(),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  size: z.number().int().min(1).max(MAX_UPLOAD_BYTES),
});

/**
 * Menandatangani URL unggah foto. Browser mengirim berkas langsung ke R2,
 * jadi fungsi ini hanya menerima metadata, bukan isi berkas.
 */
export async function POST(request: Request) {
  const session = await getSession("admin");
  if (!session || session.type !== "admin") {
    return Response.json({ ok: false, message: "Masuk sebagai admin dulu." }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json(
      { ok: false, message: "Isi permintaan tidak valid." },
      { status: 400 },
    );
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json(
      { ok: false, message: "Data unggahan tidak lengkap." },
      { status: 400 },
    );
  }

  const products = await db
    .select({ id: product.id })
    .from(product)
    .where(eq(product.id, parsed.data.productId))
    .limit(1);

  if (!products[0]) {
    return Response.json({ ok: false, message: "Produk tidak ditemukan." }, { status: 404 });
  }

  const [existing] = await db
    .select({ total: count() })
    .from(productImage)
    .where(eq(productImage.productId, parsed.data.productId));

  if ((existing?.total ?? 0) >= MAX_IMAGES) {
    return Response.json(
      { ok: false, message: `Maksimal ${MAX_IMAGES} foto per produk.` },
      { status: 409 },
    );
  }

  try {
    const upload = await presignImageUpload(parsed.data);
    if (!upload.ok) {
      const status = upload.message.includes("belum dikonfigurasi") ? 503 : 400;
      return Response.json(upload, { status });
    }

    return Response.json(upload, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error(
      "presign foto gagal",
      parsed.data.productId,
      error instanceof Error ? error.message : error,
    );
    return Response.json(
      { ok: false, message: "Gagal menyiapkan unggahan. Coba lagi." },
      { status: 500 },
    );
  }
}
