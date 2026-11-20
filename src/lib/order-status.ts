/**
 * Label dan warna status pesanan. Murni: dipakai server dan klien.
 */
export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "processing"
  | "out_for_delivery"
  | "completed"
  | "cancelled"
  | "expired"
  | "paid_late"
  | "refunded";

type StatusMeta = { label: string; tone: string; note: string; active: boolean };

export const orderStatusMeta: Record<OrderStatus, StatusMeta> = {
  pending_payment: {
    label: "Menunggu pembayaran",
    tone: "bg-accent-soft text-accent",
    note: "Selesaikan pembayaran sebelum pesanan kedaluwarsa.",
    active: true,
  },
  paid: {
    label: "Dibayar",
    tone: "bg-brand-soft text-brand",
    note: "Pembayaran diterima. Pesanan disiapkan toko.",
    active: false,
  },
  processing: {
    label: "Disiapkan",
    tone: "bg-brand-soft text-brand",
    note: "Barang sedang disiapkan dan dikemas.",
    active: false,
  },
  out_for_delivery: {
    label: "Sedang diantar",
    tone: "bg-brand-soft text-brand",
    note: "Kurir toko sedang mengantar pesanan.",
    active: false,
  },
  completed: {
    label: "Selesai",
    tone: "bg-surface-2 text-ink-2",
    note: "Pesanan selesai.",
    active: false,
  },
  cancelled: {
    label: "Dibatalkan",
    tone: "bg-surface-2 text-ink-2",
    note: "Pesanan dibatalkan. Stok sudah dikembalikan.",
    active: false,
  },
  expired: {
    label: "Kedaluwarsa",
    tone: "bg-surface-2 text-ink-2",
    note: "Pembayaran lewat batas waktu. Stok sudah dikembalikan.",
    active: false,
  },
  paid_late: {
    label: "Perlu ditinjau",
    tone: "bg-danger-soft text-danger",
    note: "Pembayaran masuk setelah kedaluwarsa. Toko akan menghubungi Anda.",
    active: false,
  },
  refunded: {
    label: "Dana dikembalikan",
    tone: "bg-surface-2 text-ink-2",
    note: "Pesanan dibatalkan dan dana dikembalikan.",
    active: false,
  },
};

export const orderFilters: { key: string; label: string; statuses?: OrderStatus[] }[] = [
  { key: "semua", label: "Semua" },
  { key: "belum", label: "Belum dibayar", statuses: ["pending_payment"] },
  { key: "diproses", label: "Diproses", statuses: ["paid", "processing"] },
  { key: "dikirim", label: "Dikirim", statuses: ["out_for_delivery"] },
  { key: "selesai", label: "Selesai", statuses: ["completed"] },
];
