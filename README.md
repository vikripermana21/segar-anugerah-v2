# Segar Anugerah v2

Toko online ikan &amp; sayur Segar Anugerah. Next.js (App Router) + Postgres + Drizzle.

Dokumen acuan: [`docs/PRD.md`](docs/PRD.md) (v1.1) untuk produk, [`DESIGN.md`](DESIGN.md) untuk
dunia visual. Sumber visual toko: [`design/segar-anugerah-client.pen`](design/segar-anugerah-client.pen).

## Status

| Fase | Isi | Status |
|---|---|---|
| 1 | Fondasi: repo, skema, auth, seed, deploy | 🟡 staging live di Vercel + Neon; domain dan R2 belum |
| — | Permukaan toko (desain `.pen`): 13 layar + keadaan kosong/memuat | 🟡 katalog, akun, dan alamat dari database; pesanan masih contoh |
| 2 | Katalog & admin katalog | ✅ admin katalog + toko membaca katalog database |
| 3 | Akun pembeli & keranjang | 🟡 daftar, masuk, profil, alamat, checkout zona DB selesai; keranjang masih di perangkat |
| 4 | Midtrans & pesanan | ⏸ belum |
| 5 | Dashboard pesanan & laporan | ⏸ belum |
| 6 | Uji & peluncuran | ⏸ belum |

## Menjalankan

```bash
pnpm install
cp .env.example .env.local     # isi DATABASE_URL, SESSION_SECRET, SEED_ADMIN_*
createdb segar_anugerah_v2
pnpm db:migrate
pnpm db:seed
pnpm dev                        # http://localhost:3000
```

Masuk admin di `/admin/login` dengan nomor dan sandi dari `SEED_ADMIN_*` di `.env.local`.

## Staging

- Vercel: https://segar-anugerah-v2.vercel.app (region fungsi `sin1`)
- Database: Neon project `segar-anugerah`, branch `staging`, koneksi pooled
- Deployment Protection aktif. Uji lewat curl pakai `vercel curl`; pembeli luar belum bisa
  membuka situs sampai proteksi dimatikan atau domain produksi dipakai.

Migrasi dan seed ke staging memakai env dari shell, bukan `.env.local`:

```bash
set -a; source .env.staging; set +a
npm run db:migrate
npm run db:seed
```

`.env.staging` tidak masuk git. Isinya `DATABASE_URL` Neon pooled, `SEED_ADMIN_*` staging, dan
kunci Midtrans sandbox.

## Rute toko

| Rute | Isi |
|---|---|
| `/` | Beranda: gratis ongkir, kategori, produk unggulan, info pengiriman |
| `/products` | Daftar produk, pencarian, filter kategori, urutan |
| `/products/[slug]` | Detail produk, galeri, varian, stok, jumlah |
| `/cart` | Keranjang tersimpan di perangkat, ringkasan, checkout |
| `/checkout` | Langkah 1: alamat, kecamatan, catatan kurir, ringkasan |
| `/checkout/payment` | Langkah 2: alamat, barang, total, metode, tombol bayar |
| `/checkout/result` | Hasil pembayaran |
| `/login`, `/register` | Masuk / daftar akun |
| `/account` | Profil, ganti sandi, menu akun |
| `/account/addresses` | Daftar alamat, tambah/ubah/hapus |
| `/account/orders` | Riwayat pesanan + filter status |
| `/account/orders/[orderNumber]` | Detail pesanan, riwayat status, pembayaran |

## Rute admin

Visual admin mengikuti [`design/segar-anugerah-cms.pen`](design/segar-anugerah-cms.pen):
sidebar 264 px, appbar 72 px, token hijau `green-600`/`green-700`, kartu 12 px.
Halaman pesanan, pengguna admin, dan laporan belum dibuat.

| Rute | Isi |
|---|---|
| `/admin` | Dashboard: hitungan katalog, pintasan |
| `/admin/kategori` | Kategori: tambah, ubah, aktif/nonaktif, hapus bila kosong |
| `/admin/produk` | Daftar produk: cari, filter kategori, aktif/nonaktif |
| `/admin/produk/baru` | Produk baru; slug otomatis |
| `/admin/produk/[id]` | Detail produk, varian, hingga 4 foto, hapus |
| `/admin/zona` | Zona ongkir + kecamatan per zona |
| `/admin/pengaturan` | Identitas toko, jam tutup pesanan, gratis ongkir |

## Perintah

| Perintah | Guna |
|---|---|
| `pnpm dev` | Server pengembangan |
| `pnpm build` | Build produksi |
| `pnpm typecheck` | Periksa tipe tanpa build |
| `pnpm lint` | ESLint |
| `pnpm db:generate` | Buat migrasi dari perubahan `src/db/schema.ts` |
| `pnpm db:migrate` | Terapkan migrasi |
| `pnpm db:seed` | Buat admin pertama + pengaturan toko (aman diulang) |
| `pnpm db:studio` | Drizzle Studio (lihat isi database) |

## Peta folder

```
src/
├── app/
│   ├── (store)/              # toko publik
│   │   ├── _components/      # app bar, tab bar, kartu produk, alur checkout
│   │   ├── products/
│   │   ├── cart/
│   │   ├── checkout/
│   │   └── account/
│   └── (admin)/admin/        # admin, dijaga middleware + sesi database
├── db/
│   ├── schema.ts             # 15 tabel
│   └── index.ts              # koneksi Drizzle
├── lib/
│   ├── auth.ts               # sesi cookie httpOnly, bcrypt, normalisasi nomor
│   ├── catalog.ts            # query katalog + pengaturan toko (server)
│   ├── catalog-types.ts      # bentuk katalog + helper harga (aman untuk klien)
│   └── store-data.ts         # pesanan, alamat, zona contoh + aturan ongkir
└── middleware.ts             # penjaga rute /admin
public/products/              # foto contoh katalog
scripts/seed.ts               # admin, pengaturan toko, katalog contoh
drizzle/                      # migrasi SQL
docs/PRD.md                   # PRD v1.1
DESIGN.md                     # token, tipografi, komponen, aturan visual
design/                       # .pen, wireframe, dan artefak desain
```

## Catatan

- Kode berbahasa Inggris; teks antarmuka berbahasa Indonesia.
- Katalog toko dibaca dari database lewat `src/lib/catalog.ts`; `pnpm db:seed` mengisi kategori
  dan 11 produk contoh bila tabelnya masih kosong.
- Pesanan masih **data contoh** di `src/lib/store-data.ts`; akun, alamat, dan zona checkout sudah
  dibaca dari database. Jangan menambah klaim (jumlah pelanggan, ulasan, sertifikasi) yang tidak
  ada di PRD.
- Pembayaran masih alur tampilan; Midtrans menyusul di Fase 4. Tombol bayar menampilkan hasil
  contoh, bukan transaksi nyata.
- `.env.local` tidak masuk git. Jangan pernah menaruh kunci Midtrans di repo.
- Webhook Midtrans tidak bisa menjangkau `localhost`; saat Fase 4 pakai URL preview Vercel.
- Nomor HP dinormalkan ke format `08…` dan disimpan unik.
