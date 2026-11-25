/**
 * Menyusun pesan pesanan untuk WhatsApp toko. Murni: tidak menyentuh database
 * atau browser, jadi bisa dipakai halaman server dan komponen klien.
 */
import type { StoreSettings } from "./catalog-types";
import type { OrderDetail } from "./order-view";

const money = new Intl.NumberFormat("id-ID");

function rupiah(value: number): string {
  return `Rp ${money.format(value)}`;
}

/** Nomor toko disimpan lokal (`08…`) atau internasional (`62…`). */
export function whatsappNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("62")) return digits;
  return digits;
}

export function bankLines(settings: StoreSettings): string[] {
  if (!settings.bankName || !settings.bankAccountNumber) return [];

  const lines = [`${settings.bankName} ${settings.bankAccountNumber}`];
  if (settings.bankAccountName) lines.push(`a.n. ${settings.bankAccountName}`);
  return lines;
}

export function buildWhatsAppMessage(order: OrderDetail, settings: StoreSettings): string {
  const lines = [
    `Halo ${settings.name}, saya mau pesan:`,
    `No. ${order.number}`,
    "",
    ...order.items.map(
      (item, index) =>
        `${index + 1}. ${item.quantity} x ${item.name} ${item.variant} - ${rupiah(item.lineTotal)}`,
    ),
    "",
    `Subtotal: ${rupiah(order.subtotal)}`,
    `Ongkir: ${rupiah(order.shippingFee)}`,
  ];

  if (order.shippingDiscount > 0) {
    lines.push(`Potongan gratis ongkir: -${rupiah(order.shippingDiscount)}`);
  }

  lines.push(`Total: ${rupiah(order.total)}`, "");
  lines.push(`Kirim: ${order.deliveryDateLabel}`);
  lines.push(
    `Alamat: ${order.address.recipientName} (${order.address.phone})`,
    `${order.address.addressLine}, ${order.address.kecamatan}, ${order.address.city}`,
  );

  if (order.note) lines.push(`Catatan: ${order.note}`);

  const bank = bankLines(settings);
  lines.push("");
  if (bank.length > 0) {
    lines.push("Transfer ke:", ...bank, "Mohon konfirmasi ketersediaan barang. Bukti transfer saya kirim di chat ini.");
  } else {
    lines.push("Mohon info rekening transfer dan konfirmasi ketersediaan barang.");
  }

  return lines.join("\n");
}

export function whatsappOrderUrl(
  order: OrderDetail,
  settings: StoreSettings,
): string | null {
  const number = whatsappNumber(settings.whatsapp);
  if (!number) return null;

  return `https://wa.me/${number}?text=${encodeURIComponent(
    buildWhatsAppMessage(order, settings),
  )}`;
}
