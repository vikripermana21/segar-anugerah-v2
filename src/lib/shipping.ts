/**
 * Perhitungan ongkir dan jadwal kirim dari pengaturan toko di database.
 * Murni: dipakai komponen klien bersama `useStoreSettings()`.
 *
 * Server tetap menghitung ulang semua angka saat pesanan dibuat; fungsi ini
 * hanya untuk tampilan sebelum pesanan ada.
 */
import type { StoreSettings } from "./catalog-types";

export type ShippingBreakdown = {
  fee: number;
  discount: number;
  total: number;
  active: boolean;
  eligible: boolean;
};

export function freeShippingActive(settings: StoreSettings, now = new Date()): boolean {
  if (!settings.freeShippingActive) return false;
  if (!settings.freeShippingUntil) return true;
  return now.getTime() <= new Date(settings.freeShippingUntil).getTime();
}

export function shippingFor(
  subtotal: number,
  zoneFee: number,
  settings: StoreSettings,
  now = new Date(),
): ShippingBreakdown {
  const active = freeShippingActive(settings, now);
  const eligible = active && subtotal >= settings.freeShippingMinSubtotal;
  const discount = eligible ? zoneFee : 0;
  return {
    fee: zoneFee,
    discount,
    total: subtotal + zoneFee - discount,
    active,
    eligible,
  };
}

const dateFormat = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const hourFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Jakarta",
  hour: "2-digit",
  hour12: false,
});

/** Tanggal kirim mengikuti jam tutup pesanan dari pengaturan toko. */
export function deliveryWindow(cutoffHour: number, now = new Date()) {
  const hour = Number(hourFormat.format(now));
  const shipsToday = hour < cutoffHour;
  const date = new Date(now.getTime() + (shipsToday ? 0 : 24 * 60 * 60 * 1000));
  return { shipsToday, dateLabel: dateFormat.format(date) };
}
