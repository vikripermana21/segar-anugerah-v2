# Segar Anugerah v2

Toko online ikan &amp; sayur Segar Anugerah. Next.js (App Router) + Postgres + Drizzle.

Dokumen acuan: [`docs/PRD.md`](docs/PRD.md) (v1.1). Semua keputusan produk ada di sana;
README ini hanya cara menjalankan.

## Status

| Fase | Isi | Status |
|---|---|---|
| 1 | Fondasi: repo, skema, auth, seed, deploy | 🟡 berjalan — skema + auth admin selesai, deploy belum |
| 2 | Katalog & admin katalog | ⏸ belum |
| 3 | Akun pembeli & keranjang | ⏸ belum |
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
│   ├── (store)/          # toko publik
│   └── (admin)/admin/    # admin, dijaga middleware + sesi database
├── db/
│   ├── schema.ts         # 15 tabel
│   └── index.ts          # koneksi Drizzle
├── lib/auth.ts           # sesi cookie httpOnly, bcrypt, normalisasi nomor
└── middleware.ts         # penjaga rute /admin
scripts/seed.ts           # admin pertama + pengaturan toko
drizzle/                  # migrasi SQL
docs/PRD.md               # PRD v1.1
```

## Catatan

- Kode berbahasa Inggris; teks antarmuka berbahasa Indonesia.
- `.env.local` tidak masuk git. Jangan pernah menaruh kunci Midtrans di repo.
- Webhook Midtrans tidak bisa menjangkau `localhost`; saat Fase 4 pakai URL preview Vercel.
- Nomor HP dinormalkan ke format `08…` dan disimpan unik.
