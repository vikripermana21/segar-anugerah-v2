import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Klien Midtrans Snap minimal, tanpa SDK.
 * Hanya server yang memakai modul ini; kunci tidak pernah ke klien.
 */

export type SnapRequest = {
  orderNumber: string;
  grossAmount: number;
  expiryMinutes: number;
  finishUrl: string;
  customer: { name: string; phone: string };
};

export type SnapResult = { token: string; redirectUrl: string };

function baseUrl(): string {
  return process.env.MIDTRANS_IS_PRODUCTION === "true"
    ? "https://app.midtrans.com"
    : "https://app.sandbox.midtrans.com";
}

export function isMidtransConfigured(): boolean {
  return Boolean(process.env.MIDTRANS_SERVER_KEY);
}

export async function createSnapTransaction(input: SnapRequest): Promise<SnapResult> {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) {
    throw new Error("MIDTRANS_SERVER_KEY belum diisi.");
  }

  const body = {
    transaction_details: {
      order_id: input.orderNumber,
      gross_amount: input.grossAmount,
    },
    customer_details: {
      first_name: input.customer.name,
      phone: input.customer.phone,
    },
    expiry: { unit: "minutes", duration: Math.max(1, input.expiryMinutes) },
    callbacks: { finish: input.finishUrl },
    // Kartu kredit sengaja tidak diaktifkan (PRD 3.5).
    enabled_payments: [
      "other_qris",
      "gopay",
      "shopeepay",
      "bca_va",
      "bni_va",
      "bri_va",
      "mandiri_va",
      "echannel",
    ],
  };

  const response = await fetch(`${baseUrl()}/snap/v1/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Snap ${response.status}: ${detail.slice(0, 300)}`);
  }

  const data = (await response.json()) as { token?: string; redirect_url?: string };
  if (!data.token || !data.redirect_url) {
    throw new Error("Snap tidak mengembalikan token atau redirect_url.");
  }

  return { token: data.token, redirectUrl: data.redirect_url };
}

/**
 * Tanda tangan webhook: SHA-512(`order_id + status_code + gross_amount + server_key`).
 */
export function verifySignature(payload: {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
}): boolean {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) return false;

  const expected = createHash("sha512")
    .update(`${payload.order_id}${payload.status_code}${payload.gross_amount}${serverKey}`)
    .digest("hex");

  const given = Buffer.from(payload.signature_key ?? "");
  const want = Buffer.from(expected);
  if (given.length !== want.length) return false;
  return timingSafeEqual(given, want);
}
