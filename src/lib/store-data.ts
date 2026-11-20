/**
 * Data contoh yang belum tersambung database: alamat, zona, dan pesanan.
 *
 * Katalog asli ada di `src/lib/catalog.ts` (dibaca dari tabel kategori,
 * produk, varian, dan foto). Jangan menambah klaim (jumlah pelanggan, ulasan,
 * sertifikasi) yang tidak ada di PRD.
 */

export const storeFacts = {
  name: "Segar Anugerah",
  area: "Cilandak · Jakarta Selatan",
  phone: "0812-3456-789",
  whatsapp: "628123456789",
};

export function rupiah(value: number): string {
  return `Rp ${new Intl.NumberFormat("id-ID").format(value)}`;
}

export function priceShort(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}

export type Address = {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  addressLine: string;
  kecamatan: string;
  city: string;
  notes?: string;
  isDefault: boolean;
};

export const addresses: Address[] = [
  {
    id: "rumah",
    label: "Rumah",
    recipientName: "Dewi Lestari",
    phone: "08123456789",
    addressLine: "Jl. Melati No. 12, RT 04/RW 02, Cilandak, Jakarta Selatan 12430",
    kecamatan: "Cilandak",
    city: "Jakarta Selatan",
    notes: "pagar hijau, titip ke penjaga.",
    isDefault: true,
  },
  {
    id: "restoran",
    label: "Restoran",
    recipientName: "Dewi Lestari",
    phone: "08123456789",
    addressLine: "Jl. Raya Pasar Minggu No. 8, Pasar Minggu, Jakarta Selatan 12520",
    kecamatan: "Pasar Minggu",
    city: "Jakarta Selatan",
    isDefault: false,
  },
];

export type Zone = { name: string; city: string; fee: number };

export const zones: Zone[] = [
  { name: "Cilandak", city: "Jakarta Selatan", fee: 15000 },
  { name: "Pasar Minggu", city: "Jakarta Selatan", fee: 15000 },
  { name: "Kebayoran Lama", city: "Jakarta Selatan", fee: 18000 },
];

export function zoneByName(name: string): Zone {
  return zones.find((zone) => zone.name === name) ?? zones[0];
}

export const customer = {
  name: "Dewi Lestari",
  phone: "08123456789",
  since: "Pelanggan sejak Nov 2026",
};

export type OrderStatus = "pending_payment" | "shipped" | "completed" | "cancelled";

export type OrderLine = {
  name: string;
  variant: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type Order = {
  number: string;
  createdLabel: string;
  dateLabel: string;
  itemCount: number;
  status: OrderStatus;
  statusLabel: string;
  note: string;
  paymentFailed?: boolean;
  lastAttemptAt?: string;
  subtotal: number;
  shippingFee: number;
  shippingDiscount: number;
  total: number;
  paymentMethod?: string;
  paidAt?: string;
  items: OrderLine[];
  addressId: string;
  timeline: { time: string; label: string; done: boolean }[];
};

export const orders: Order[] = [
  {
    number: "SA-261119-4821",
    createdLabel: "19 Nov 2026, 14.02 WIB",
    dateLabel: "19 Nov 2026",
    itemCount: 2,
    status: "pending_payment",
    statusLabel: "Menunggu pembayaran",
    note: "Bayar dalam 18 menit, setelah itu stok dilepas.",
    paymentFailed: true,
    lastAttemptAt: "19 Nov 2026, 14.06 WIB",
    subtotal: 106000,
    shippingFee: 15000,
    shippingDiscount: 15000,
    total: 106000,
    paymentMethod: "QRIS",
    items: [
      {
        name: "Ikan Nila",
        variant: "1 kg",
        quantity: 2,
        unitPrice: 45000,
        lineTotal: 90000,
      },
      {
        name: "Kangkung",
        variant: "1 ikat",
        quantity: 2,
        unitPrice: 8000,
        lineTotal: 16000,
      },
    ],
    addressId: "rumah",
    timeline: [{ time: "14.02", label: "Pesanan dibuat", done: true }],
  },
  {
    number: "SA-261116-3310",
    createdLabel: "16 Nov 2026, 09.12 WIB",
    dateLabel: "16 Nov 2026",
    itemCount: 3,
    status: "shipped",
    statusLabel: "Sedang diantar",
    note: "Kurir menghubungi sebelum mengantar.",
    subtotal: 145000,
    shippingFee: 15000,
    shippingDiscount: 15000,
    total: 145000,
    paymentMethod: "BCA VA",
    paidAt: "16 Nov 2026, 09.18 WIB",
    items: [
      {
        name: "Ikan Nila",
        variant: "1 kg",
        quantity: 1,
        unitPrice: 45000,
        lineTotal: 45000,
      },
      {
        name: "Ikan Gurame",
        variant: "1 kg",
        quantity: 1,
        unitPrice: 62000,
        lineTotal: 62000,
      },
      {
        name: "Ikan Kembung",
        variant: "1 kg",
        quantity: 1,
        unitPrice: 38000,
        lineTotal: 38000,
      },
    ],
    addressId: "rumah",
    timeline: [
      { time: "09.12", label: "Pesanan dibuat", done: true },
      { time: "09.18", label: "Pembayaran diterima lewat BCA VA", done: true },
      { time: "10.05", label: "Sedang diantar kurir toko", done: true },
    ],
  },
  {
    number: "SA-261110-1902",
    createdLabel: "10 Nov 2026, 14.02 WIB",
    dateLabel: "10 Nov 2026",
    itemCount: 2,
    status: "completed",
    statusLabel: "Selesai",
    note: "Diterima 10 Nov, 16.45 WIB.",
    subtotal: 106000,
    shippingFee: 15000,
    shippingDiscount: 15000,
    total: 106000,
    paymentMethod: "QRIS",
    paidAt: "10 Nov 2026, 14.04 WIB",
    items: [
      {
        name: "Ikan Nila",
        variant: "1 kg",
        quantity: 2,
        unitPrice: 45000,
        lineTotal: 90000,
      },
      {
        name: "Kangkung",
        variant: "1 ikat",
        quantity: 2,
        unitPrice: 8000,
        lineTotal: 16000,
      },
    ],
    addressId: "rumah",
    timeline: [
      { time: "14.02", label: "Pesanan dibuat", done: true },
      { time: "14.04", label: "Pembayaran diterima lewat QRIS", done: true },
      { time: "15.10", label: "Sedang diantar kurir toko", done: true },
      { time: "16.45", label: "Pesanan selesai", done: true },
    ],
  },
  {
    number: "SA-261105-0473",
    createdLabel: "5 Nov 2026, 08.20 WIB",
    dateLabel: "5 Nov 2026",
    itemCount: 1,
    status: "cancelled",
    statusLabel: "Dibatalkan",
    note: "Alasan: stok tidak tersedia. Dana dikembalikan.",
    subtotal: 45000,
    shippingFee: 0,
    shippingDiscount: 0,
    total: 45000,
    items: [
      {
        name: "Ikan Nila",
        variant: "1 kg",
        quantity: 1,
        unitPrice: 45000,
        lineTotal: 45000,
      },
    ],
    addressId: "rumah",
    timeline: [
      { time: "08.20", label: "Pesanan dibuat", done: true },
      { time: "08.31", label: "Dibatalkan karena stok tidak tersedia", done: true },
    ],
  },
];

export function orderByNumber(number: string): Order | undefined {
  return orders.find((order) => order.number === number);
}

export function addressById(id: string): Address {
  return addresses.find((address) => address.id === id) ?? addresses[0];
}

