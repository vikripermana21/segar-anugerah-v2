# Segar Anugerah v2

Toko online ikan &amp; sayur Segar Anugerah. Next.js (App Router) + Postgres + Drizzle.

Dokumen acuan: [`docs/PRD.md`](docs/PRD.md) (v1.1) untuk produk, [`DESIGN.md`](DESIGN.md) untuk
dunia visual. Sumber visual toko: [`design/segar-anugerah-client.pen`](design/segar-anugerah-client.pen).

## Status

| Fase | Isi | Status |
|---|---|---|
| 1 | Fondasi: repo, skema, auth, seed, deploy | 🟡 staging live di Vercel + Neon, foto di R2; domain belum |
| — | Permukaan toko (desain `.pen`): 13 layar + keadaan kosong/memuat | ✅ katalog, akun, alamat, pesanan, dan pembayaran dari database |
| 2 | Katalog & admin katalog | ✅ admin katalog + toko membaca katalog database |
| 3 | Akun pembeli & keranjang | ✅ akun, alamat, checkout zona DB; keranjang tetap di perangkat |
| 4 | Midtrans & pesanan | ✅ pesanan, kunci stok, Snap sandbox, webhook, kedaluwarsa |
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

## Alur kerja per fase

- `main` selalu stabil dan jadi branch produksi Vercel (staging URL sekarang).
- Setiap fase dikerjakan di branch sendiri: `fase-<n>-<ringkas>`, mis. `fase-4-pesanan-pembayaran`.
- Push branch fase membuat preview deployment. Merge ke `main` hanya setelah fase selesai diuji.
- Preview memakai database staging yang sama. Jalankan migrasi ke Neon **sebelum** push kode yang
  butuh kolom baru, atau preview akan gagal saat query.

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
| `pnpm storage:upload` | Pindahkan foto `public/products` ke R2 lalu perbarui URL di database |
| `pnpm db:studio` | Drizzle Studio (lihat isi database) |

## Foto produk (R2)

Foto disimpan di Cloudflare R2. Browser mengecilkan foto (sisi terpanjang 2000 px, WebP)
lalu mengunggahnya langsung ke bucket lewat URL PUT bertanda tangan; server hanya menerbitkan
tanda tangan, jadi body request Vercel 4,5 MB tidak pernah dilewati.

Isi lima variabel di `.env.local` dan Vercel (Production + Preview):

```
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_PUBLIC_BASE_URL=        # https://pub-<hash>.r2.dev, tanpa garis miring di akhir
```

Bucket perlu CORS agar browser boleh `PUT` dari origin situs:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://segar-anugerah-v2.vercel.app"],
    "AllowedMethods": ["PUT", "GET"],
    "AllowedHeaders": ["content-type"],
    "MaxAgeSeconds": 3600
  }
]
```

Foto lama di `public/products` dipindah sekali dengan `pnpm storage:upload`. Skrip itu aman
diulang. Setelah pindah, `R2_PUBLIC_BASE_URL` juga dipakai `next.config.ts` untuk
`images.remotePatterns`; tanpa variabel itu, `next/image` menolak URL R2.

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
│   ├── orders.ts             # pesanan, stok, status, dan pembayaran (server)
│   ├── midtrans.ts           # Snap, verifikasi webhook, kedaluwarsa
│   ├── r2.ts                 # URL unggah bertanda tangan + hapus foto
│   └── store-data.ts         # helper rupiah, fakta toko, data contoh lama
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
- Pesanan, akun, alamat, dan zona checkout dibaca dari database. Pembayaran memakai Midtrans Snap
  sandbox; webhook terverifikasi dan pesanan kedaluwarsa otomatis mengembalikan stok.
- `.env.local` tidak masuk git. Jangan pernah menaruh kunci Midtrans di repo.
- Webhook Midtrans tidak bisa menjangkau `localhost`. Uji di preview Vercel: daftarkan
  `https://<preview>/api/webhooks/midtrans` di dashboard Midtrans, atau kirim notifikasi sendiri
  dengan tanda tangan yang dihitung dari server key.
- Jadwal kedaluwarsa di `vercel.json` jalan tiap 15 menit (batas Hobby). PRD meminta 5 menit; di
  Pro cukup ganti menjadi `*/5 * * * *`.
- Midtrans memisahkan **Server Key** (auth API/Snap) dari **Signature Secret Key** (tanda tangan
  webhook). Keduanya wajib ada di environment: `MIDTRANS_SERVER_KEY` dan
  `MIDTRANS_SIGNATURE_KEY`.
- `CRON_SECRET` wajib ada di environment Vercel. Rute cron menolak permintaan tanpa header
  `Authorization: Bearer <CRON_SECRET>`.
- Nomor HP dinormalkan ke format `08…` dan disimpan unik.
