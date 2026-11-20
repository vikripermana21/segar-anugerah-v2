/**
 * Aturan pesanan yang murni: tanpa database, tanpa React.
 * Dipakai server saat membuat pesanan dan cron saat kedaluwarsa.
 */

export const ORDER_EXPIRY_MINUTES = 30;

const jakarta = "Asia/Jakarta";

const dateParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: jakarta,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const hourParts = new Intl.DateTimeFormat("en-GB", {
  timeZone: jakarta,
  hour: "2-digit",
  hour12: false,
});

function partsOf(now: Date): { year: string; month: string; day: string } {
  const map: Record<string, string> = {};
  for (const part of dateParts.formatToParts(now)) {
    if (part.type !== "literal") map[part.type] = part.value;
  }
  return { year: map.year, month: map.month, day: map.day };
}

/** Tanggal kalender Jakarta dalam bentuk `YYYY-MM-DD`. */
export function jakartaDate(now: Date): string {
  const { year, month, day } = partsOf(now);
  return `${year}-${month}-${day}`;
}

/** Jam 0–23 menurut zona Jakarta. */
export function jakartaHour(now: Date): number {
  return Number(hourParts.format(now));
}

/**
 * Tanggal kirim: sebelum jam tutup pesanan → hari ini, setelahnya → besok.
 * Tidak ada pengecualian hari libur (PRD 3.3 butir 4).
 */
export function deliveryDate(now: Date, cutoffHour: number): string {
  const today = partsOf(now);
  const afterCutoff = jakartaHour(now) >= cutoffHour;
  if (!afterCutoff) return `${today.year}-${today.month}-${today.day}`;

  const base = Date.UTC(Number(today.year), Number(today.month) - 1, Number(today.day));
  const next = new Date(base + 24 * 60 * 60 * 1000);
  const year = next.getUTCFullYear();
  const month = String(next.getUTCMonth() + 1).padStart(2, "0");
  const day = String(next.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Nomor pesanan `SA-YYMMDD-XXXX` dengan 4 digit acak (PRD 3.3 butir 7). */
export function orderNumber(now: Date, random: () => number = Math.random): string {
  const { year, month, day } = partsOf(now);
  const suffix = String(1000 + Math.floor(random() * 9000));
  return `SA-${year.slice(2)}${month}${day}-${suffix}`;
}

export function orderExpiry(now: Date): Date {
  return new Date(now.getTime() + ORDER_EXPIRY_MINUTES * 60 * 1000);
}

export type FreeShippingSetting = {
  freeShippingActive: boolean;
  freeShippingUntil: Date | null;
  freeShippingMinSubtotal: number;
};

/**
 * Gratis ongkir dihitung sebagai potongan, bukan ongkir nol (PRD 3.3 butir 5).
 */
export function shippingDiscount(
  subtotal: number,
  fee: number,
  setting: FreeShippingSetting,
  now: Date,
): number {
  if (!setting.freeShippingActive) return 0;
  if (setting.freeShippingUntil && setting.freeShippingUntil.getTime() < now.getTime()) return 0;
  if (subtotal < setting.freeShippingMinSubtotal) return 0;
  return fee;
}
