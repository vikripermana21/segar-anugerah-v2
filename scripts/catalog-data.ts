/**
 * Katalog contoh untuk seed pertama.
 *
 * Dipakai `scripts/seed.ts`; aman diulang karena baris yang sudah ada dilewati.
 * Harga dan stok adalah contoh dari PRD, bukan angka penjualan nyata.
 */

export type SeedVariant = { label: string; price: number; stock: number };

export type SeedProduct = {
  slug: string;
  name: string;
  category: string;
  unit: string;
  description: string;
  image: string;
  variants: SeedVariant[];
};

export const seedCategories = [
  { slug: "ikan", name: "Ikan", description: "Ikan segar harian", image: "/products/nila.jpg", sortOrder: 1 },
  { slug: "sayur", name: "Sayur", description: "Sayur dan daun", image: "/products/sayur.jpg", sortOrder: 2 },
  {
    slug: "bumbu-dapur",
    name: "Bumbu dapur",
    description: "Kebutuhan dapur",
    image: "/products/dapur.jpg",
    sortOrder: 3,
  },
  { slug: "telur", name: "Telur", description: "Telur segar", image: "/products/telur.jpg", sortOrder: 4 },
];

export const seedProducts: SeedProduct[] = [
  {
    slug: "ikan-nila",
    name: "Ikan Nila",
    category: "ikan",
    unit: "kg",
    description:
      "Ikan nila segar dari kolam sendiri, dibersihkan dan disiangi sesuai permintaan. Dikirim pagi hari dengan es, tanpa bahan pengawet.",
    image: "/products/nila.jpg",
    variants: [
      { label: "1 kg", price: 45000, stock: 12 },
      { label: "2 kg", price: 88000, stock: 5 },
      { label: "3 kg", price: 130000, stock: 0 },
    ],
  },
  {
    slug: "ikan-gurame",
    name: "Ikan Gurame",
    category: "ikan",
    unit: "kg",
    description:
      "Gurame hidup dari kolam mitra, dipilih saat dipesan lalu dibersihkan. Dikirim dengan es agar tetap segar sampai dapur.",
    image: "/products/gurame.jpg",
    variants: [
      { label: "1 kg", price: 62000, stock: 5 },
      { label: "2 kg", price: 120000, stock: 0 },
    ],
  },
  {
    slug: "ikan-kembung",
    name: "Ikan Kembung",
    category: "ikan",
    unit: "kg",
    description:
      "Kembung segar dari pasar pagi, sisik dan isi perut dibersihkan bila diminta. Cocok untuk digoreng atau dipindang.",
    image: "/products/kembung.jpg",
    variants: [{ label: "1 kg", price: 38000, stock: 0 }],
  },
  {
    slug: "udang-segar",
    name: "Udang Segar",
    category: "ikan",
    unit: "kg",
    description:
      "Udang segar ukuran sedang, dikirim dengan es. Bisa diminta tanpa kepala atau tanpa kulit saat checkout.",
    image: "/products/udang.jpg",
    variants: [{ label: "1 kg", price: 95000, stock: 6 }],
  },
  {
    slug: "ikan-lele",
    name: "Ikan Lele",
    category: "ikan",
    unit: "kg",
    description:
      "Lele segar dari kolam sendiri, dibersihkan dan siap dimasak. Dikirim pagi hari bersama pesanan lain.",
    image: "/products/lele.jpg",
    variants: [{ label: "1 kg", price: 32000, stock: 9 }],
  },
  {
    slug: "ikan-mas",
    name: "Ikan Mas",
    category: "ikan",
    unit: "kg",
    description:
      "Ikan mas segar dari kolam mitra, dibersihkan sesuai permintaan. Dikirim dengan es tanpa bahan pengawet.",
    image: "/products/mas.jpg",
    variants: [{ label: "1 kg", price: 40000, stock: 7 }],
  },
  {
    slug: "kangkung",
    name: "Kangkung",
    category: "sayur",
    unit: "ikat",
    description:
      "Kangkung dipetik pagi hari, diikat rapi dan dibungkus daun pisang. Simpan di kulkas, masak dalam dua hari.",
    image: "/products/kangkung.jpg",
    variants: [
      { label: "1 ikat", price: 8000, stock: 30 },
      { label: "2 ikat", price: 15000, stock: 12 },
    ],
  },
  {
    slug: "bayam",
    name: "Bayam",
    category: "sayur",
    unit: "ikat",
    description:
      "Bayam hijau dipetik pagi hari, diikat rapi. Pilih daun yang masih tegak saat tiba, lalu simpan di kulkas.",
    image: "/products/bayam.jpg",
    variants: [{ label: "1 ikat", price: 7500, stock: 24 }],
  },
  {
    slug: "cabai-merah",
    name: "Cabai Merah",
    category: "bumbu-dapur",
    unit: "kg",
    description:
      "Cabai merah segar dari pasar, dipilih yang masih padat. Tersedia timbangan kecil untuk kebutuhan harian.",
    image: "/products/cabai.jpg",
    variants: [
      { label: "250 g", price: 12000, stock: 18 },
      { label: "1 kg", price: 45000, stock: 8 },
    ],
  },
  {
    slug: "bawang-merah",
    name: "Bawang Merah",
    category: "bumbu-dapur",
    unit: "kg",
    description:
      "Bawang merah segar, kulit kering dan tidak bertunas. Disimpan di tempat kering agar tahan lebih lama.",
    image: "/products/bawang.jpg",
    variants: [
      { label: "250 g", price: 10000, stock: 20 },
      { label: "1 kg", price: 38000, stock: 10 },
    ],
  },
  {
    slug: "telur-ayam",
    name: "Telur Ayam",
    category: "telur",
    unit: "kg",
    description:
      "Telur ayam segar dari peternak sekitar, diperiksa satu per satu sebelum dikemas. Dikirim dalam wadah tertutup.",
    image: "/products/telur.jpg",
    variants: [
      { label: "1 kg", price: 28000, stock: 15 },
      { label: "1 tray (30 butir)", price: 62000, stock: 6 },
    ],
  },
];
