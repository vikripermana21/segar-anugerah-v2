# Segar Anugerah — Product Requirements Document

**Versi:** 1.1
**Tanggal:** 19 November 2026
**Status:** Draft — menunggu persetujuan
**Pemilik:** Pemilik toko Segar Anugerah
**Menggantikan:** `docs/BLUEPRINT.md` v1.2 (dokumen lama disimpan sebagai arsip, bukan acuan)

> Dokumen ini ditulis ulang dari nol. Semua keputusan teknis di bawah adalah keputusan baru,
> bukan warisan dari sistem lama. Kode lama (`../segar-anugerah/`) hanya dipakai sebagai
> rujukan pengalaman, bukan sebagai dasar.

---

## Ringkasan Eksekutif

**TL;DR:** Toko online ikan dan sayur Segar Anugerah dibangun ulang sebagai satu aplikasi
Next.js fullstack: toko untuk pembeli, admin untuk pengelola toko, dan pembayaran online lewat
Midtrans. Satu repo, satu proses deploy, satu bahasa.

**Masalah:** Versi sebelumnya memakai tumpukan yang terlalu banyak — backend Rust terpisah, toko
React, admin SvelteKit, dan satu aplikasi Vue yang dibuang. Tiga basis kode, tiga pipeline deploy,
tiga pohon dependensi. Untuk toko dengan satu pemilik dan dua rekan, biaya perawatan itu tidak
sepadan dengan manfaatnya. Akibatnya pekerjaan berhenti di kerangka, bukan di toko yang bisa
menerima pesanan.

**Solusi:** Satu aplikasi Next.js yang memuat storefront dan admin dalam satu repo, dengan Postgres
sebagai database, Cloudflare R2 untuk foto produk, dan Midtrans untuk pembayaran. Pesanan menjadi
data di sistem — bukan percakapan WhatsApp — sehingga status, stok, dan omzet tercatat utuh.

**Metrik keberhasilan:**
1. Pesanan pertama yang dibayar lewat Midtrans dan berhasil diproses sampai selesai.
2. Waktu dari buka situs sampai pesanan dibayar < 3 menit untuk 3 varian produk.
3. Nol pesanan yang kehilangan stok akibat kesalahan sistem di bulan pertama.
4. Nol pesanan yang dibayar tetapi tidak tercatat (setiap transaksi Midtrans punya baris pesanan).
5. Admin bisa menyelesaikan satu pesanan tanpa membuka WhatsApp.

---

## 1. Gambaran Produk

### 1.1 Visi & Tujuan

**Visi:** Toko ikan dan sayur yang bisa dipesan online dengan harga jelas, ongkir jelas, dan status
pesanan yang bisa dilihat kapan saja — tanpa bergantung pada percakapan WhatsApp.

**Tujuan utama:**
- **Satu basis kode.** Storefront dan admin dalam satu aplikasi Next.js, satu repo, satu deploy.
- **Pesanan sebagai data.** Setiap pesanan punya nomor, status, dan riwayat yang bisa ditelusuri.
- **Pembayaran online.** Pembeli membayar lewat Midtrans; toko tidak perlu menagih manual.
- **Stok yang jujur.** Angka stok berkurang saat pesanan dibuat dan kembali saat pesanan batal.
- **Biaya operasional rendah.** Vercel Pro + Neon gratis + R2; tanpa server yang harus dijaga.

### 1.2 Pengguna

**Pembeli (publik, wajib punya akun):**
- **Perorangan** — membeli ikan dan sayur untuk kebutuhan rumah. Frekuensi rendah sampai sedang,
  nominal kecil, lebih suka bayar QRIS.
- **Restoran / warung** — membeli dalam jumlah lebih besar dan berulang. Butuh alamat tersimpan,
  riwayat pesanan, dan pesan ulang. Nominal lebih besar; sering memakai Virtual Account.

**Admin (privat, 3 orang):**
- Pemilik toko dan dua rekan. Wewenang sama. Mengelola katalog, stok, zona ongkir, pesanan,
  dan pengguna admin. Tidak ada pembeli yang bisa masuk ke area admin.

**Kurir toko:** bukan pengguna aplikasi. Menerima alamat dan daftar barang dari admin secara manual.

### 1.3 Cakupan

**Termasuk (MVP):**
- Katalog: kategori, produk, varian ukuran, harga, stok, **galeri foto (sampai 4 foto per produk)**.
- Akun pembeli: daftar, masuk, alamat tersimpan, riwayat pesanan.
- Keranjang dan checkout dengan pemilihan zona ongkir.
- Pembayaran Midtrans (QRIS, e-wallet, Virtual Account).
- Pesanan: nomor pesanan, status, kedaluwarsa otomatis, pengembalian stok.
- Admin: pesanan, produk, kategori, zona ongkir, pengaturan toko, pengguna admin.
- Laporan sederhana: omzet harian, jumlah pesanan, produk terlaris.
- Gratis ongkir saat peluncuran, dengan tanggal berakhir.

**Tidak termasuk (fase berikutnya):**
- Notifikasi WhatsApp otomatis ke pembeli.
- Voucher dan kode promo.
- Ekspor laporan ke Excel.
- Akun pembeli dengan login OTP.
- Pembatalan pesanan oleh pembeli sendiri.
- Refund otomatis dari aplikasi.
- Aplikasi mobile native.
- Multi-penjual / multi-toko.

**Bukan tujuan (non-goals):**
- Menjadi marketplace. Aplikasi ini hanya untuk satu toko.
- Menghitung pajak/PPN.
- Menghitung ongkir berdasarkan jarak atau peta.
- Menyediakan pelacakan kurir real-time.
- Menyimpan data kartu kredit. Semua data pembayaran ada di Midtrans.
- Tombol batal atau refund untuk pembeli. Pembatalan dan refund hanya lewat admin.

---

## 2. Kebutuhan Fungsional

### 2.1 Alur Utama

**Alur A — Pembeli memesan dan membayar**
1. Pembeli membuka beranda, melihat kategori dan produk unggulan.
2. Membuka `/products`, menyaring per kategori, mencari nama produk.
3. Membuka detail produk, memilih varian ukuran (1 kg / 2 kg / 3 kg), melihat harga dan stok.
4. Menambah ke keranjang; keranjang tersimpan di perangkat dan bertahan setelah halaman ditutup.
5. Masuk atau mendaftar (wajib akun sebelum checkout).
6. Checkout: pilih alamat tersimpan, pilih kecamatan (menentukan zona dan ongkir), lihat ringkasan.
7. Sistem membuat pesanan berstatus `pending_payment`, mengunci stok, dan menghitung tanggal kirim.
8. Pembeli diarahkan ke Midtrans Snap, memilih metode, membayar.
9. Midtrans mengirim webhook; sistem menandai `paid` dan mencatat pembayaran.
10. Pembeli melihat status di `/account/orders/[orderNumber]`.

**Alur B — Admin memproses pesanan**
1. Admin masuk ke `/admin`, dashboard menampilkan pesanan baru dan omzet hari ini.
2. Membuka pesanan, melihat daftar barang, alamat, dan status pembayaran.
3. Menyiapkan barang dan packing.
4. Menekan "Sedang diantar" → status `out_for_delivery`.
5. Setelah kurir kembali, menekan "Selesai" → status `completed`.
6. Bila perlu membatalkan, menekan "Batalkan" dengan alasan; stok dikembalikan.

**Alur C — Pesanan kedaluwarsa**
1. Pesanan `pending_payment` melewati `expires_at` (30 menit).
2. Pekerjaan terjadwal menandai `expired`, mengembalikan stok, dan mencatat riwayat.
3. Jika webhook pembayaran datang setelah itu, sistem menandai `paid_late` untuk ditinjau admin —
   bukan langsung dianggap selesai, karena stok mungkin sudah terjual.

### 2.2 Cerita Pengguna & Kriteria Penerimaan

#### Epik 1 — Katalog

**1.1 Pembeli melihat daftar produk**
- **Cerita:** Sebagai pembeli, saya ingin melihat semua produk yang tersedia, supaya bisa memilih.
- **Kriteria:**
  - Given ada 12 produk aktif, when pembeli membuka `/products`, then 12 produk tampil dengan
    nama, harga terendah, satuan, dan foto utama.
  - Given sebuah produk `is_active = false`, when daftar dimuat, then produk itu tidak muncul.
  - Given pembeli memilih kategori "Ikan", when daftar dimuat, then hanya produk kategori itu tampil.
  - Given pencarian "nila", when daftar dimuat, then hanya produk yang namanya memuat "nila" tampil.
  - Given tidak ada hasil, then muncul pesan kosong dengan tautan "Lihat semua produk".
- **Prioritas:** Must-Have

**1.2 Pembeli melihat detail produk dan memilih varian**
- **Cerita:** Sebagai pembeli, saya ingin memilih ukuran ikan, supaya membeli jumlah yang pas.
- **Kriteria:**
  - Given produk "Ikan Nila" punya varian 1 kg (Rp 45.000, stok 12), 2 kg (Rp 88.000, stok 5),
    3 kg (Rp 130.000, stok 0), when halaman dibuka, then ketiga varian tampil dengan harga.
  - Given varian berstok 0, when dipilih, then tombol "Tambah ke keranjang" nonaktif dan diberi
    label "Habis".
  - Given pembeli menambah 2 unit varian 1 kg, when keranjang dibuka, then baris itu berisi 2 × Rp 45.000.
  - Given pembeli meminta jumlah melebihi stok, when menekan tambah, then sistem menolak dengan
    pesan "Stok tersisa 12".
- **Prioritas:** Must-Have

#### Epik 2 — Akun Pembeli

**2.1 Pendaftaran**
- **Cerita:** Sebagai pembeli baru, saya ingin mendaftar dengan nomor WhatsApp, supaya bisa memesan.
- **Kriteria:**
  - Given nomor 08123456789 belum terdaftar, when pembeli mendaftar dengan nama, nomor, dan sandi
    minimal 8 karakter, then akun dibuat dan pembeli langsung masuk.
  - Given nomor sudah terdaftar, when mendaftar, then ditolak dengan pesan "Nomor sudah terdaftar,
    silakan masuk".
  - Given nomor ditulis `0812-3456-789`, when disimpan, then dinormalkan menjadi `08123456789`
    dan disimpan unik.
  - Given sandi kurang dari 8 karakter, then ditolak sebelum dikirim ke server.
- **Prioritas:** Must-Have

**2.2 Masuk dan keluar**
- **Kriteria:**
  - Given nomor dan sandi benar, when masuk, then sesi dibuat dan pembeli diarahkan ke halaman tujuan.
  - Given sandi salah 5 kali dalam 15 menit untuk nomor yang sama, then percobaan berikutnya ditolak
    sementara (pesan "Coba lagi dalam 15 menit").
  - Given pembeli menekan keluar, then sesi dihapus dan cookie dibersihkan.
  - Given sesi kedaluwarsa (30 hari), when membuka halaman akun, then diarahkan ke `/login`.
- **Prioritas:** Must-Have

**2.3 Alamat tersimpan**
- **Kriteria:**
  - Given pembeli menyimpan alamat pertama, when disimpan, then otomatis menjadi alamat utama.
  - Given ada dua alamat, when pembeli menandai yang kedua sebagai utama, then yang pertama berhenti
    menjadi utama.
  - Given alamat dihapus padahal dipakai pesanan lama, then pesanan lama tetap utuh karena menyimpan
    salinan alamatnya sendiri.
- **Prioritas:** Must-Have

#### Epik 3 — Keranjang & Checkout

**3.1 Keranjang**
- **Kriteria:**
  - Given pembeli menambah produk tanpa masuk, when halaman ditutup dan dibuka lagi, then isi
    keranjang masih ada.
  - Given varian yang ada di keranjang menjadi habis, when keranjang dibuka, then baris itu ditandai
    "Habis" dan tidak ikut dihitung.
  - Given harga varian berubah setelah masuk keranjang, when checkout dibuka, then harga diambil
    ulang dari database, bukan dari keranjang.
- **Prioritas:** Must-Have

**3.2 Checkout**
- **Kriteria:**
  - Given pembeli belum masuk, when membuka `/checkout`, then diarahkan ke `/login` dan kembali ke
    checkout setelah masuk.
  - Given pembeli memilih kecamatan "Cilandak", when alamat dipilih, then ongkir zona itu muncul
    dan total diperbarui.
  - Given subtotal Rp 120.000 dan ongkir Rp 15.000 tanpa promo, then total Rp 135.000.
  - Given gratis ongkir aktif dan subtotal memenuhi syarat, then total = subtotal, dan baris ongkir
    menampilkan "Rp 15.000" dengan potongan "−Rp 15.000".
  - Given jam pesanan 15.59 WIB, when pesanan dibuat, then `delivery_date` = hari ini.
  - Given jam pesanan 16.01 WIB, when pesanan dibuat, then `delivery_date` = besok.
  - Given stok varian berkurang oleh pesanan lain di saat yang sama, when pesanan dibuat, then
    transaksi dibatalkan dan pembeli diberi pesan "Stok baru saja habis" tanpa pesanan terbentuk.
- **Prioritas:** Must-Have

#### Epik 4 — Pembayaran

**4.1 Membayar lewat Midtrans**
- **Kriteria:**
  - Given pesanan `pending_payment` dibuat, when pembeli diarahkan ke Snap, then nominal dan nomor
    pesanan sama dengan yang tercatat di database.
  - Given pembayaran berhasil, when webhook diterima dengan tanda tangan valid, then status menjadi
    `paid` dan `paid_at` terisi.
  - Given webhook yang sama diterima dua kali, then hanya satu perubahan status tercatat (idempoten).
  - Given tanda tangan webhook tidak valid, then permintaan ditolak dan dicatat sebagai percobaan
    gagal.
  - Given pesanan tidak dibayar dalam 30 menit, then status `expired` dan stok kembali.
  - Given pembayaran masuk setelah pesanan `expired`, then status `paid_late` dan muncul di daftar
    "Perlu ditinjau" di admin.
- **Prioritas:** Must-Have

#### Epik 5 — Admin

**5.1 Masuk admin**
- **Kriteria:**
  - Given kredensial admin benar, when masuk di `/admin/login`, then sesi admin dibuat.
  - Given pembeli (bukan admin) membuka `/admin`, then ditolak dan diarahkan ke `/admin/login`.
  - Given tidak ada halaman pendaftaran admin sama sekali, then tidak ada rute yang membuat akun
    admin tanpa sesi admin yang sah.
- **Prioritas:** Must-Have

**5.2 Mengelola produk**
- **Kriteria:**
  - Given admin membuat produk dengan nama, kategori, deskripsi, dan satu foto, when disimpan,
    then `slug` dibuat otomatis dan unik.
  - Given admin menambah varian "1 kg" harga Rp 45.000 stok 20, when disimpan, then varian muncul
    di toko.
  - Given admin mengubah harga varian, when disimpan, then harga baru berlaku untuk pesanan
    berikutnya; pesanan lama tidak berubah.
  - Given admin menonaktifkan produk, then produk hilang dari toko tetapi riwayat pesanan tetap utuh.
  - Given foto diunggah lebih dari 2 MB atau bukan JPEG/PNG/WebP, then ditolak dengan pesan jelas.
  - Given admin mengunggah 4 foto untuk satu produk, when halaman produk dibuka pembeli, then foto
    pertama tampil besar dan tiga lainnya sebagai gambar kecil yang bisa dipilih.
  - Given admin menandai satu foto sebagai utama, then foto itu yang muncul di daftar produk.
  - Given admin menghapus foto utama, then sistem memilih foto berikutnya sebagai utama.
- **Prioritas:** Must-Have

**5.3 Memproses pesanan**
- **Kriteria:**
  - Given ada pesanan `paid`, when admin membuka dashboard, then pesanan muncul di daftar "Perlu
    disiapkan" dengan penanda jumlah pesanan baru.
  - Given admin menekan "Sedang diantar", then status `out_for_delivery` dan waktu perubahan tercatat.
  - Given admin menekan "Selesai", then status `completed`.
  - Given admin membatalkan pesanan `paid`, then status `cancelled`, stok kembali, dan alasan wajib diisi.
  - Given pesanan `completed`, then admin tidak bisa mengubahnya kembali ke `paid`.
- **Prioritas:** Must-Have

**5.4 Zona ongkir**
- **Kriteria:**
  - Given admin membuat zona "Jakarta Selatan" tarif Rp 15.000 dengan kecamatan Cilandak, Pasar Minggu,
    when pembeli memilih Cilandak, then tarif Rp 15.000 muncul.
  - Given sebuah kecamatan ada di dua zona aktif, when disimpan, then sistem menolak (satu kecamatan
    satu zona).
  - Given zona dinonaktifkan, then kecamatannya tidak muncul di checkout.
- **Prioritas:** Must-Have

**5.5 Pengguna admin**
- **Kriteria:**
  - Given admin menambah pengguna dengan nomor dan sandi, then akun aktif dan bisa masuk.
  - Given admin menonaktifkan pengguna, then sesi pengguna itu berakhir dan login ditolak.
  - Given hanya tersisa satu admin aktif, then sistem menolak menonaktifkan akun terakhir.
- **Prioritas:** Must-Have

**5.6 Laporan**
- **Kriteria:**
  - Given ada 5 pesanan `completed` hari ini senilai total Rp 850.000, when dashboard dibuka,
    then omzet hari ini Rp 850.000 dan jumlah pesanan 5.
  - Given admin memilih rentang 1–30 November, then omzet, jumlah pesanan, dan 5 produk terlaris
    tampil untuk rentang itu.
  - Given pesanan `cancelled` dan `expired`, then tidak dihitung sebagai omzet.
- **Prioritas:** Should-Have

#### Epik 6 — Pengaturan Toko

**6.1 Gratis ongkir peluncuran**
- **Kriteria:**
  - Given admin menyalakan gratis ongkir dengan tanggal berakhir 31 Desember 2026, when pembeli
    checkout pada 20 Desember, then ongkir dipotong penuh.
  - Given tanggal berakhir sudah lewat, then ongkir kembali normal otomatis tanpa tindakan admin.
  - Given admin mengisi syarat minimal belanja Rp 150.000, when subtotal Rp 120.000, then gratis
    ongkir tidak berlaku dan pembeli melihat syaratnya.
- **Prioritas:** Must-Have

### 2.3 Kebutuhan Non-Fungsional

**Kinerja**
- Halaman katalog dan detail produk: First Contentful Paint < 2 detik pada 4G.
- Respons server (p95) < 500 ms untuk halaman toko, < 300 ms untuk API internal.
- Checkout dan pembuatan pesanan < 1,5 detik.
- Kapasitas awal: 50 pesanan/hari, 500 pengunjung/hari. Tidak ada optimasi khusus di luar caching
  halaman katalog.

**Keamanan**
- Sandi disimpan dengan bcrypt (cost ≥ 10). Tidak pernah disimpan atau dicatat dalam bentuk asli.
- Sesi lewat cookie `httpOnly`, `Secure`, `SameSite=Lax`, berisi token acak; token disimpan di tabel
  `session` dengan tanggal kedaluwarsa. Tidak ada token di `localStorage`.
- Semua rute `/admin` dijaga di server (middleware + pemeriksaan sesi di setiap muatan data),
  bukan hanya di klien.
- Webhook Midtrans diverifikasi dengan `signature_key` (SHA-512: `order_id + status_code +
  gross_amount + server_key`) sebelum diproses.
- Nomor pesanan tidak boleh bisa ditebak berurutan; gunakan awalan tanggal + nomor acak.
- Tidak ada rute pendaftaran admin. Akun admin pertama dari seeder; akun berikutnya dari dalam admin.
- Data pribadi (nama, nomor, alamat) hanya untuk keperluan pengiriman. Tidak ada analitik pihak
  ketiga yang menerima data pribadi. Pembeli bisa meminta penghapusan akun lewat admin.
- Semua trafik HTTPS. Kunci rahasia hanya di environment variable, tidak di repo.

**Keandalan**
- Target ketersediaan 99,5% (mengikuti Vercel).
- Webhook idempoten; setiap event disimpan di `payment_event` sebelum diproses.
- Backup database harian oleh Neon, retensi 7 hari.
- Pesanan yang gagal diproses harus tercatat di log dengan nomor pesanan.

**Aksesibilitas**
- Kontras teks minimal 4.5:1; semua tombol bisa dijangkau keyboard; label form terhubung ke input;
  gambar produk punya teks alternatif. Target: setara WCAG 2.1 AA pada alur belanja.

**Responsif**
- Mobile-first. Titik henti: 640 px, 1024 px. Checkout harus nyaman di layar 360 px.
- Admin dioptimalkan untuk desktop (≥ 1024 px), tetapi daftar pesanan tetap bisa dibaca di ponsel.

---

## 3. Spesifikasi Teknis

### 3.1 Tumpukan Teknologi

| Bagian | Pilihan | Alasan |
|---|---|---|
| Kerangka | **Next.js 15+ (App Router)** | Fullstack: server component, route handler, server action dalam satu repo. Satu deploy. |
| Bahasa | TypeScript | Tipe di batas data mencegah kesalahan bentuk data pesanan. |
| Gaya | Tailwind CSS | Cepat, tidak perlu berkas CSS terpisah. |
| Database | **PostgreSQL** (Neon, gratis) | Relasional; pesanan butuh transaksi dan kunci baris untuk stok. |
| ORM | Drizzle ORM | Skema bertipe, migrasi jelas, ringan. |
| Auth | Sesi sendiri (tabel `session` + cookie httpOnly) | Tidak ada penyedia tambahan; alur sederhana; mudah diaudit. |
| Pembayaran | **Midtrans Snap** | Snap menangani halaman pembayaran, metode, dan status; backend hanya membuat transaksi dan menerima webhook. |
| Foto produk | **Cloudflare R2** | Sudah dipakai; tanpa biaya egress. |
| Hosting | **Vercel Pro** | Tanpa server yang diurus; webhook selalu hidup. |
| Email | Tidak ada di MVP | Status pesanan lewat halaman akun. |

**Yang sengaja tidak dipakai:** backend terpisah, dua kerangka kerja, Redis, Docker, sistem
antrean, GraphQL. Setiap tambahan harus punya alasan yang tidak bisa dipenuhi tumpukan di atas.

**Struktur repo (satu aplikasi):**
```
segar-anugerah/
├── src/
│   ├── app/
│   │   ├── (store)/            # toko: beranda, produk, keranjang, checkout, akun
│   │   ├── (admin)/admin/      # admin: dashboard, pesanan, produk, zona, pengaturan
│   │   └── api/webhooks/midtrans/
│   ├── db/                     # skema Drizzle, migrasi, seed
│   ├── lib/                    # auth, midtrans, r2, validasi
│   └── components/             # komponen bersama
├── drizzle/                    # berkas migrasi
└── scripts/seed.ts             # akun admin pertama + pengaturan toko
```

### 3.2 Model Data

Semua tabel memakai `id` (UUID), `created_at`, dan `updated_at` (trigger otomatis).

**`admin_user`** — pengguna area admin
| Kolom | Tipe | Aturan |
|---|---|---|
| name | text | wajib, ≤ 80 |
| phone | text | wajib, unik, dinormalkan |
| password_hash | text | wajib |
| is_active | boolean | default true |
| last_login_at | timestamptz | boleh kosong |

**`customer`** — pembeli
| Kolom | Tipe | Aturan |
|---|---|---|
| name | text | wajib, ≤ 80 |
| phone | text | wajib, unik, dinormalkan |
| password_hash | text | wajib |
| phone_verified_at | timestamptz | boleh kosong (disiapkan untuk OTP) |
| is_active | boolean | default true |

**`customer_address`**
| Kolom | Tipe | Aturan |
|---|---|---|
| customer_id | uuid | FK → customer, wajib |
| label | text | mis. "Rumah", "Restoran" |
| recipient_name | text | wajib |
| phone | text | wajib |
| address_line | text | wajib, ≤ 300 |
| kelurahan | text | boleh kosong |
| kecamatan | text | wajib |
| city | text | wajib |
| postal_code | text | boleh kosong |
| notes | text | boleh kosong, ≤ 200 |
| is_default | boolean | satu alamat utama per pelanggan |

**`delivery_zone`** — zona ongkir
| Kolom | Tipe | Aturan |
|---|---|---|
| name | text | wajib, unik |
| fee | integer | rupiah, ≥ 0 |
| is_active | boolean | default true |
| sort_order | integer | default 0 |

**`delivery_zone_area`** — kecamatan per zona
| Kolom | Tipe | Aturan |
|---|---|---|
| zone_id | uuid | FK → delivery_zone |
| kecamatan | text | wajib |
| city | text | wajib |

Batasan: `(kecamatan, city)` unik lintas zona aktif — satu kecamatan satu zona.

**`category`**
| Kolom | Tipe | Aturan |
|---|---|---|
| name | text | wajib, unik |
| slug | text | wajib, unik |
| description | text | boleh kosong |
| image_url | text | boleh kosong |
| sort_order | integer | default 0 |
| is_active | boolean | default true |

**`product`**
| Kolom | Tipe | Aturan |
|---|---|---|
| category_id | uuid | FK → category |
| name | text | wajib, ≤ 120 |
| slug | text | wajib, unik |
| description | text | boleh kosong, ≤ 2000 |
| unit_label | text | mis. "kg", "ikat" |
| is_active | boolean | default true |
| sort_order | integer | default 0 |

**`product_image`**
| Kolom | Tipe | Aturan |
|---|---|---|
| product_id | uuid | FK → product |
| url | text | wajib (R2) |
| alt | text | boleh kosong |
| is_primary | boolean | satu per produk |
| sort_order | integer | default 0 |

**`product_variant`** — satu dimensi: ukuran/berat
| Kolom | Tipe | Aturan |
|---|---|---|
| product_id | uuid | FK → product |
| label | text | wajib, mis. "1 kg" |
| price | integer | rupiah, > 0 |
| stock | integer | ≥ 0 |
| sku | text | unik bila diisi |
| is_active | boolean | default true |
| sort_order | integer | default 0 |

Batasan: `(product_id, label)` unik. Model varian sengaja disederhanakan menjadi satu dimensi —
tidak ada tabel dimensi/opsi generik seperti sistem lama. Alasan: semua produk memakai dimensi
berat/ukuran, dan model generik membuat admin serta checkout jauh lebih rumit tanpa manfaat.

**`order`**
| Kolom | Tipe | Aturan |
|---|---|---|
| order_number | text | wajib, unik, pola `SA-YYMMDD-XXXX` |
| customer_id | uuid | FK → customer |
| status | enum | lihat daftar status |
| subtotal | integer | ≥ 0 |
| shipping_fee | integer | ≥ 0, ongkir asli |
| shipping_discount | integer | ≥ 0, potongan ongkir |
| total | integer | = subtotal + shipping_fee − shipping_discount |
| zone_id | uuid | FK → delivery_zone |
| delivery_date | date | dihitung dari jam pesanan |
| address_snapshot | jsonb | salinan alamat saat pesan |
| notes | text | boleh kosong |
| midtrans_order_id | text | unik |
| midtrans_transaction_id | text | boleh kosong |
| payment_method | text | dari Midtrans |
| paid_at | timestamptz | boleh kosong |
| expires_at | timestamptz | dibuat + 30 menit |
| cancelled_reason | text | boleh kosong |

**Status pesanan:** `pending_payment` → `paid` → `processing` → `out_for_delivery` → `completed`;
serta `cancelled`, `expired`, `paid_late`, `refunded`.

**`order_item`**
| Kolom | Tipe | Aturan |
|---|---|---|
| order_id | uuid | FK → order |
| product_id | uuid | FK → product |
| variant_id | uuid | FK → product_variant |
| product_name | text | salinan saat pesan |
| variant_label | text | salinan saat pesan |
| unit_price | integer | salinan saat pesan |
| quantity | integer | > 0 |
| line_total | integer | unit_price × quantity |

Alasan salinan: pesanan lama tidak boleh berubah ketika admin mengganti nama atau harga produk.

**`order_status_history`**
| Kolom | Tipe | Aturan |
|---|---|---|
| order_id | uuid | FK → order |
| from_status | text | boleh kosong |
| to_status | text | wajib |
| changed_by | text | `system` / `admin:<id>` / `customer:<id>` |
| note | text | boleh kosong |

**`payment_event`** — jejak webhook
| Kolom | Tipe | Aturan |
|---|---|---|
| order_id | uuid | FK → order |
| provider | text | "midtrans" |
| event_type | text | mis. `settlement`, `expire`, `deny` |
| payload | jsonb | isi mentah webhook |
| signature_valid | boolean | wajib |
| processed_at | timestamptz | boleh kosong |

Batasan: `(provider, event_type, midtrans_transaction_id)` unik untuk mencegah proses ganda.

**`session`**
| Kolom | Tipe | Aturan |
|---|---|---|
| token_hash | text | unik, wajib |
| subject_type | text | `customer` / `admin` |
| subject_id | uuid | wajib |
| expires_at | timestamptz | wajib |

**`store_setting`** — satu baris
| Kolom | Tipe | Aturan |
|---|---|---|
| store_name | text | "Segar Anugerah" |
| whatsapp | text | kontak toko |
| address | text | lokasi toko |
| free_shipping_active | boolean | default true saat peluncuran |
| free_shipping_until | timestamptz | boleh kosong |
| free_shipping_min_subtotal | integer | default 0 |
| order_cutoff_hour | integer | default 16 |

### 3.3 Aturan Bisnis

1. **Stok dikunci saat pesanan dibuat.** Pengurangan stok dan pembuatan pesanan dalam satu transaksi
   database dengan `SELECT ... FOR UPDATE` pada baris varian. Jika stok kurang, seluruh transaksi
   dibatalkan.
2. **Stok kembali** saat `expired`, `cancelled`, atau `refunded` — hanya sekali, dijaga status.
3. **Kedaluwarsa 30 menit.** Pekerjaan terjadwal (Vercel Cron, tiap 5 menit) menandai pesanan lewat
   `expires_at` menjadi `expired` dan mengembalikan stok.
4. **Tanggal kirim.** Dibuat sebelum pukul 16.00 WIB → hari ini; setelahnya → besok. Tidak ada
   pengecualian hari libur.
5. **Ongkir** diambil dari zona kecamatan yang dipilih. Gratis ongkir dihitung sebagai
   `shipping_discount`, bukan `shipping_fee = 0`.
6. **Harga dan nama disalin** ke `order_item` saat pesanan dibuat.
7. **Nomor pesanan** `SA-YYMMDD-XXXX` dengan XXXX acak 4 digit, diperiksa unik.
8. **Satu kecamatan satu zona aktif.**
9. **Akun admin terakhir tidak bisa dinonaktifkan.**
10. **Pesanan `completed` bersifat final** untuk admin; koreksi hanya lewat pesanan baru atau catatan.

### 3.4 Endpoint & Rute

**Toko (publik):**
| Rute | Isi |
|---|---|
| `/` | Beranda: kategori, produk unggulan, info gratis ongkir |
| `/products` | Daftar produk + filter kategori + pencarian |
| `/products/[slug]` | Detail produk, pemilih varian, stok |
| `/cart` | Keranjang |
| `/checkout` | Alamat, zona, ringkasan, tombol bayar |
| `/login`, `/register` | Masuk / daftar |
| `/account/orders` | Riwayat pesanan |
| `/account/orders/[orderNumber]` | Status pesanan dan rincian |
| `/account/addresses` | Daftar alamat |
| `/account/profile` | Nama, nomor, ganti sandi |

**Admin (wajib sesi admin):**
| Rute | Isi |
|---|---|
| `/admin/login` | Masuk admin |
| `/admin` | Dashboard: pesanan baru, omzet hari ini |
| `/admin/orders` | Daftar pesanan + filter status |
| `/admin/orders/[id]` | Detail pesanan + ubah status |
| `/admin/products` | Daftar produk |
| `/admin/products/new`, `/admin/products/[id]` | Buat / ubah produk + varian + foto |
| `/admin/categories` | Kategori |
| `/admin/zones` | Zona ongkir + kecamatan |
| `/admin/settings` | Pengaturan toko, gratis ongkir |
| `/admin/users` | Pengguna admin |
| `/admin/reports` | Laporan omzet & produk terlaris |

**API:**
| Endpoint | Keterangan |
|---|---|
| `POST /api/webhooks/midtrans` | Menerima notifikasi pembayaran. Verifikasi tanda tangan, idempoten. |
| `POST /api/checkout` | Membuat pesanan + transaksi Midtrans dalam satu alur. |
| `POST /api/auth/login`, `/register`, `/logout` | Sesi pembeli. |
| `POST /api/admin/auth/login`, `/logout` | Sesi admin. |

Sebagian besar mutasi memakai server action Next.js. Endpoint HTTP hanya untuk webhook dan
autentikasi, karena keduanya dipanggil dari luar halaman.

### 3.5 Integrasi Midtrans

- **Mode:** sandbox saat pembangunan; produksi setelah situs aktif dan akun disetujui.
- **Kunci sandbox** sudah tersedia sekarang di dashboard Midtrans (Settings → Access Keys), tanpa
  menunggu verifikasi dokumen. Jadi pembangunan tidak terhalang meski data bisnis belum lengkap.
- **Metode aktif:** QRIS, GoPay/ShopeePay, Virtual Account (BCA, Mandiri, BNI, BRI). Kartu kredit
  **dimatikan** karena biaya 2,9% + Rp 2.000 terlalu besar untuk nilai pesanan toko sayur.
- **Biaya per transaksi berhasil:** QRIS 0,7%; Virtual Account Rp 4.000 flat; e-wallet 2%.
  Tidak ada biaya pendaftaran atau biaya bulanan.
- **Alur:** buat transaksi → Snap token → pembeli bayar → webhook `settlement`/`expire`/`deny`.
- **Verifikasi:** `signature_key` = SHA-512(`order_id + status_code + gross_amount + server_key`).
- **Kedaluwarsa:** 30 menit, disetel di permintaan transaksi dan dicocokkan dengan `expires_at`.
- **Refund:** manual lewat dashboard Midtrans. Aplikasi hanya mencatat status `refunded`.

**Prasyarat akun (di luar coding):** akun Midtrans perorangan butuh **KTP dan NPWP** pemilik.
Midtrans mensyaratkan situs sudah aktif dan sesuai kategori usaha sebelum mode produksi disetujui.
Karena itu urutan peluncuran: sandbox → situs tayang → pengajuan produksi → pembayaran sungguhan.

### 3.6 Arsitektur

Satu aplikasi Next.js di Vercel. Server component membaca Postgres (Neon) langsung lewat Drizzle;
server action menulis. Foto produk diunggah ke R2 lewat URL bertanda tangan. Midtrans memanggil
`/api/webhooks/midtrans`; Vercel Cron menjalankan pekerjaan kedaluwarsa tiap 5 menit.

**Alur data pesanan:**
1. Pembeli menekan bayar → server action memeriksa sesi, alamat, zona, dan stok.
2. Transaksi database: kunci baris varian, kurangi stok, buat `order` + `order_item`, hitung tanggal kirim.
3. Panggil Midtrans dengan `order_number` dan `total`; simpan `midtrans_order_id`.
4. Pembeli diarahkan ke Snap.
5. Webhook masuk → verifikasi tanda tangan → simpan `payment_event` → ubah status ke `paid`.
6. Admin memproses → `out_for_delivery` → `completed`.

---

## 4. Pengalaman Pengguna

### 4.1 Prinsip

1. **Harga dan ongkir terlihat sebelum bayar.** Tidak ada biaya kejutan di akhir.
2. **Status selalu bisa dilihat.** Setiap pesanan punya halaman yang bisa dibuka kapan saja.
3. **Satu keputusan per layar.** Checkout tidak menumpuk semua isian dalam satu halaman panjang.
4. **Jujur soal stok.** Barang habis ditandai, bukan disembunyikan.

### 4.2 Layar yang Dibutuhkan

Desain visual dan wireframe dikerjakan terpisah lewat `/intent`; PRD hanya menetapkan isi layar.

**Toko (11 layar):** Beranda · Daftar produk · Detail produk · Keranjang · Checkout alamat ·
Checkout pembayaran · Hasil pembayaran · Masuk · Daftar akun · Riwayat pesanan · Detail pesanan ·
Alamat · Profil. *(13 bila hasil pembayaran dan detail pesanan dipisah.)*

**Admin (11 layar):** Masuk · Dashboard · Daftar pesanan · Detail pesanan · Daftar produk ·
Form produk · Kategori · Zona ongkir · Pengaturan toko · Pengguna admin · Laporan.

**Isi wajib tiap layar utama:**
- **Beranda:** kategori, produk unggulan, banner gratis ongkir, tautan masuk/akun.
- **Detail produk:** foto utama, nama, deskripsi, pemilih varian dengan harga & stok, tombol tambah.
- **Checkout:** alamat terpilih, pilihan kecamatan, ringkasan barang, ongkir, potongan, total,
  tanggal kirim, tombol "Bayar".
- **Detail pesanan (pembeli):** nomor, status, rincian barang, alamat, total, waktu pembayaran.
- **Dashboard admin:** jumlah pesanan baru, pesanan perlu disiapkan, omzet hari ini.
- **Detail pesanan (admin):** barang, alamat, status, tombol ubah status, riwayat status.

### 4.3 Keadaan Khusus

- **Kosong:** katalog kosong → "Belum ada produk"; keranjang kosong → tautan ke katalog;
  riwayat kosong → "Belum ada pesanan".
- **Memuat:** kerangka (skeleton) untuk daftar produk dan daftar pesanan; tombol bayar nonaktif
  dengan label "Memproses…" saat transaksi dibuat.
- **Galat:** stok habis saat checkout → pesan jelas dan keranjang diperbarui; pembayaran gagal →
  halaman pesanan dengan tautan "Coba bayar lagi" selama belum kedaluwarsa; webhook gagal →
  pesanan tetap `pending_payment` dan muncul di daftar "Perlu ditinjau" admin.
- **Teks:** semua teks antarmuka berbahasa Indonesia. Nama rute, nama tabel, nama berkas, dan
  nama variabel berbahasa Inggris.

---

## 5. Rencana Implementasi

Dikerjakan oleh pemilik toko dengan bantuan AI. Fase disusun supaya setiap fase berakhir dengan
sesuatu yang bisa dilihat, bukan setengah jadi. Setiap fase butuh persetujuan sebelum dilanjutkan.

**Fase 1 — Fondasi (perkiraan 1 minggu)**
- Repo Next.js + TypeScript + Tailwind; struktur `(store)` dan `(admin)`.
- Skema Drizzle + migrasi awal + seed (akun admin pertama, pengaturan toko, zona contoh).
- Auth sesi: daftar, masuk, keluar untuk pembeli dan admin; middleware rute `/admin`.
- Deploy ke Vercel + Neon; domain; unggah foto ke R2.
- **Hasil:** situs kosong yang bisa diakses publik, admin bisa masuk, database siap.

**Fase 2 — Katalog & admin katalog (1–2 minggu)**
- Admin: kategori, produk, varian, stok, foto, zona ongkir, pengaturan toko.
- Toko: beranda, daftar produk, filter kategori, pencarian, detail produk.
- **Hasil:** katalog asli bisa diisi sendiri dan dilihat pembeli.

**Fase 3 — Akun & keranjang (1 minggu)**
- Akun pembeli: daftar, masuk, alamat, profil.
- Keranjang (tersimpan di perangkat), checkout sampai ringkasan total + ongkir + tanggal kirim.
- **Hasil:** pembeli bisa mengisi keranjang dan melihat total sebelum membayar.

**Fase 4 — Pesanan & pembayaran (1–2 minggu)**
- Pembuatan pesanan + penguncian stok dalam satu transaksi.
- Midtrans sandbox: Snap, webhook, verifikasi tanda tangan, idempoten.
- Kedaluwarsa otomatis + pengembalian stok (Vercel Cron).
- Halaman status pesanan pembeli.
- **Hasil:** pesanan bisa dibayar penuh di sandbox dan statusnya berubah sendiri.

**Fase 5 — Admin pesanan & laporan (1 minggu)**
- Dashboard, daftar pesanan, detail pesanan, ubah status, pembatalan.
- Pengguna admin, laporan omzet dan produk terlaris.
- **Hasil:** pesanan bisa diproses dari dashboard tanpa WhatsApp.

**Fase 6 — Uji & peluncuran (1 minggu)**
- Uji alur ujung-ke-ujung: daftar → belanja → bayar → proses → selesai.
- Uji kasus gagal: stok habis, pembayaran gagal, kedaluwarsa, webhook ganda, pembayaran terlambat.
- Pemeriksaan keamanan: rute admin tertutup, sesi httpOnly, kunci tidak bocor, webhook terverifikasi.
- Pengajuan akun Midtrans produksi, lalu uji satu transaksi nyata bernilai kecil.
- **Hasil:** toko menerima pesanan sungguhan.

**Ketergantungan:** Fase 2 butuh Fase 1. Fase 4 butuh Fase 2 dan 3. Fase 5 butuh Fase 4.
Pengajuan akun Midtrans bisa berjalan paralel sejak Fase 1, karena persetujuan produksi butuh
situs yang sudah aktif.

### 5.1 Biaya

| Pos | Biaya |
|---|---|
| Vercel Pro | $20/bulan ≈ Rp 330.000 |
| Neon Postgres | Gratis (1 GB, 100 CU-jam) |
| Cloudflare R2 | Gratis sampai 10 GB; egress nol |
| Domain | ± Rp 150.000/tahun |
| Midtrans | Tanpa biaya tetap; hanya potongan per transaksi berhasil |

**Total tetap: ± Rp 330.000/bulan + domain.** Per transaksi: QRIS 0,7%, VA Rp 4.000, e-wallet 2%.

---

## 6. Pengujian

**Wajib diuji sebelum peluncuran:**
1. Daftar dengan nomor baru → masuk → tambah produk → checkout → bayar (sandbox) → status `paid`.
2. Dua pembeli membeli varian terakhir bersamaan → satu berhasil, satu ditolak dengan pesan jelas.
3. Pesanan tidak dibayar 30 menit → `expired` → stok kembali.
4. Webhook dikirim dua kali → hanya satu perubahan status.
5. Webhook dengan tanda tangan salah → ditolak dan tercatat.
6. Pembayaran masuk setelah `expired` → `paid_late` muncul di admin.
7. Admin membatalkan pesanan `paid` → stok kembali, alasan tercatat.
8. Pembeli membuka `/admin` → ditolak.
9. Admin menonaktifkan admin lain → sesi orang itu berakhir.
10. Gratis ongkir: sebelum dan sesudah tanggal berakhir.
11. Pesanan pukul 15.59 dan 16.01 → tanggal kirim berbeda.
12. Uji satu transaksi nyata bernilai kecil setelah mode produksi disetujui.

---

## 7. Risiko

| Risiko | Peluang | Dampak | Penanganan |
|---|---|---|---|
| Akun Midtrans produksi ditolak atau lama disetujui | Sedang | Tinggi | Ajukan lebih awal; bangun penuh di sandbox; siapkan KTP + NPWP; jangan janji tanggal peluncuran ke pelanggan sebelum disetujui |
| Webhook tidak masuk sehingga pesanan menggantung | Sedang | Sedang | Tampilkan "Perlu ditinjau" di admin; sediakan tombol "Periksa status ke Midtrans" manual |
| Stok terjual dua kali karena balapan | Rendah | Tinggi | Kunci baris dalam transaksi; uji dua pembeli bersamaan |
| Biaya transaksi menggerus margin | Sedang | Sedang | QRIS sebagai jalur utama; kartu kredit dimatikan; tampilkan total dengan jelas |
| Kesalahan input produk oleh admin (harga salah) | Sedang | Sedang | Konfirmasi sebelum simpan; harga lama disalin ke pesanan sehingga pesanan lama tidak rusak |
| Data pribadi bocor | Rendah | Tinggi | Sesi httpOnly, HTTPS, tanpa pendaftaran admin publik, kunci di environment variable |
| Satu orang mengerjakan semuanya | Tinggi | Sedang | Fase kecil dengan hasil yang bisa dilihat; setiap fase bisa berhenti dengan aman |
| Jangkauan meluas ke luar Jabodetabek | Sedang | Rendah | Zona dikelola admin, bukan ditanam di kode |

---

## 8. Peluncuran

**Sebelum tayang:**
- [ ] Semua kriteria Must-Have lulus.
- [ ] Uji kasus gagal di §6 lulus.
- [ ] Rute admin tertutup; tidak ada pendaftaran admin.
- [ ] Kunci Midtrans dan database hanya di environment variable.
- [ ] Backup database terjadwal dan sudah diuji pulih.
- [ ] Nomor WhatsApp toko dan alamat tampil di situs.
- [ ] Akun Midtrans produksi disetujui.

**Saat tayang:**
- Gratis ongkir dinyalakan dengan tanggal berakhir.
- Isi katalog minimal: beberapa kategori ikan dan sayur dengan varian asli.
- Uji satu pesanan nyata dari perangkat sendiri, nilai kecil.

**Setelah tayang:**
- Pantau pesanan `paid` yang tidak diproses lebih dari 12 jam.
- Pantau webhook gagal dan pesanan `paid_late`.
- Kumpulkan masukan pembeli pertama; perbaiki yang paling sering dikeluhkan.

---

## 9. Asumsi & Pertanyaan Terbuka

### 9.1 Asumsi

| Asumsi | Dasar | Dampak bila salah |
|---|---|---|
| Tidak ada tanggal peluncuran mati | Tidak disebutkan saat wawancara | Rendah — fase tetap bisa dipercepat |
| Hanya 3 admin (pemilik + 2 rekan), wewenang sama | Disebutkan pengguna | Sedang — bila perlu peran, tambah kolom `role` dan aturan per halaman |
| Galeri sampai 4 foto per produk | Diminta pengguna (19 Nov) | Rendah — sudah masuk cakupan MVP |
| Pembeli tidak membatalkan sendiri setelah bayar | Tidak dibahas | Rendah — pembatalan lewat admin |
| Refund manual lewat dashboard Midtrans | Tidak dibahas | Rendah — aplikasi hanya mencatat status |
| Ongkir per kecamatan, tarif diisi admin | Pengguna memilih kurir sendiri | Rendah — struktur zona sudah fleksibel |
| Tidak ada data lama yang perlu dimigrasi | DB lokal hanya berisi data uji | Rendah |
| Pajak tidak dihitung aplikasi | Tidak disebutkan | Sedang bila toko wajib PKP — perlu kolom pajak |
| Pembeli memakai ponsel | Kebiasaan pasar toko sayur | Rendah — antarmuka mobile-first |
| Kurir tidak memakai aplikasi | Tidak disebutkan | Rendah — alamat dikirim manual |

### 9.2 Pertanyaan Terbuka

- [ ] Tarif ongkir per zona berapa saja? **Ditunda ke Fase 2** atas keputusan pemilik (19 Nov); zona dibuat dengan tarif sementara yang bisa diubah kapan saja.
- [ ] Apakah ada jam tutup toko di luar pukul 16.00? (sebelum Fase 3)
- [x] Apakah pesanan yang sudah `paid` boleh diubah isinya oleh admin? **Tidak** (25 Nov). Perubahan isi mengubah total dan nominal Midtrans; jalur resmi adalah batalkan lalu buat pesanan baru.
- [x] Kanal pesanan sebelum Midtrans produksi: **WhatsApp + transfer bank** (25 Nov). Midtrans tetap tersimpan dan bisa diaktifkan lagi dari pengaturan admin.
- [ ] Apakah pembeli boleh memakai satu nomor untuk beberapa alamat restoran? (sebelum Fase 3)
- [ ] Nama dan ketentuan `/intent` untuk wireframe — perlu dicatat agar PRD tidak bertentangan
- [ ] Apakah perlu faktur/surat jalan untuk pelanggan restoran? (setelah peluncuran)
- [ ] Setelah berapa lama data pelanggan tidak aktif dihapus? (kebijakan privasi)

---

## 10. Glosarium

- **Varian** — ukuran/berat dari satu produk (1 kg, 2 kg), dengan harga dan stok sendiri.
- **Zona ongkir** — kelompok kecamatan dengan satu tarif kirim.
- **Snap** — halaman pembayaran Midtrans yang menampilkan semua metode aktif.
- **Webhook** — panggilan dari Midtrans ke aplikasi saat status pembayaran berubah.
- **Idempoten** — permintaan yang sama diproses berkali-kali menghasilkan satu perubahan saja.
- **`paid_late`** — pembayaran masuk setelah pesanan kedaluwarsa; perlu ditinjau admin.
- **Cut-off** — pukul 16.00 WIB; pesanan setelah itu diantar besok.

---

## 11. Riwayat Perubahan

| Versi | Tanggal | Perubahan |
|---|---|---|
| 1.0 | 19 Nov 2026 | Draf awal. Menggantikan `BLUEPRINT.md` v1.2. Tumpukan baru: Next.js fullstack, Midtrans, Vercel + Neon + R2. |
| 1.1 | 19 Nov 2026 | Galeri foto masuk MVP; pembatalan/refund hanya lewat admin; tarif zona ditunda ke Fase 2; kunci sandbox Midtrans tersedia lebih awal. |
