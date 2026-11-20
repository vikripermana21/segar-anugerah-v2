---
name: Segar Anugerah
description: Pasar pagi — kertas krem, hijau tua, jingga kunyit, kartu putih membulat, dan bilah tab melayang.
colors:
  bg: "#F7F5EF"
  surface: "#FFFFFF"
  surface-2: "#EDEAE1"
  ink: "#17241C"
  ink-2: "#586A5F"
  ink-3: "#6F7D73"
  border: "#E3DFD3"
  brand: "#1B5C45"
  brand-deep: "#133B2C"
  brand-soft: "#E6EEE7"
  accent: "#BE5A2B"
  accent-soft: "#FBEEE5"
  danger: "#A6392A"
  danger-soft: "#FBEDE8"
  cream: "#F7F5EF"
typography:
  display:
    fontFamily: "Fraunces, ui-serif, Georgia, serif"
    fontSize: "27px"
    fontWeight: 600
    lineHeight: 1.16
  page-title:
    fontFamily: "Fraunces, ui-serif, Georgia, serif"
    fontSize: "22–26px"
    fontWeight: 600
    lineHeight: 1.2
  hero:
    fontFamily: "Bricolage Grotesque, Plus Jakarta Sans, sans-serif"
    fontSize: "26–38px"
    fontWeight: 600
    lineHeight: 1.18
    letterSpacing: "-0.035em"
  section:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12–12.5px"
    fontWeight: 400
    lineHeight: 1.5
  meta:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "10.5–11px"
    fontWeight: 400
    lineHeight: 1.45
  eyebrow:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "10.5px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.06–0.08em"
rounded:
  card: "16px"
  card-small: "14px"
  control: "12px"
  media: "18px"
  pill: "999px"
  tab: "23px"
spacing:
  unit: "4px"
  gutter: "20px"
  page: "1120px"
  section-gap: "26px"
components:
  app-bar:
    height: "66px"
    background: "transparent di atas bg, sticky"
    logo-tile: "38px, radius 13px, fill brand"
  card:
    backgroundColor: "{colors.surface}"
    border: "1px solid {colors.border}"
    rounded: "{rounded.card}"
  chip:
    height: "30px"
    border: "1px solid {colors.border}"
    rounded: "{rounded.pill}"
    active: "{colors.brand} / {colors.cream}"
  tab-bar:
    background: "{colors.surface}"
    rounded: "29px"
    shadow: "0 6px 20px rgba(23,36,28,0.16)"
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.cream}"
    rounded: "{rounded.control}"
    height: "48px"
  sticky-action:
    background: "{colors.surface}"
    border-top: "1px solid {colors.border}"
---

# Design System: Segar Anugerah

## Overview

**Sumber visual: `design/segar-anugerah-client.pen` (23 layar klien).** Dokumen ini menjelaskan cara membacanya saat membangun antarmuka; `.pen` tetap sumber kebenaran untuk komposisi per layar. Wireframe di `design/wireframes-store.html` mengikat isi dan struktur, bukan warna atau bentuk.

Dunia visualnya adalah **pasar pagi yang rapi**: kertas krem hangat (`#F7F5EF`), hijau daun tua (`#1B5C45`), jingga kunyit (`#BE5A2B`) untuk penanda kecil, dan kartu putih bertepi tipis dengan sudut membulat. Tidak ada buku kas, garis mistar, atau sudut siku seperti versi sebelumnya. Hijau tetap warna utama dan memegang wilayah nyata: logo, tombol utama, tab aktif, harga yang ditandai, dan panel "Diantar setiap hari". Jingga hanya untuk eyebrow, status menunggu pembayaran, dan penekanan kecil — bukan warna tombol.

Tipografinya dua suara. **Fraunces** menulis judul dan angka besar (judul sapaan, nama produk di halaman detail, nomor pesanan); **Plus Jakarta Sans** menulis semua teks antarmuka, label, harga kartu, dan meta. Bentuknya membulat lembut: kartu 16 px, kontrol 12 px, gambar utama 18 px, chip dan pil 999 px. Bayangan hanya dipakai bilah tab melayang; permukaan lain memakai garis tipis `#E3DFD3`, bukan elevasi.

## Colors

### Primary
- **Brand `#1B5C45`** — logo, tombol utama, tab aktif, tautan penting, label stok tersedia, panel pengiriman.
- **Brand deep `#133B2C`** — panel "Diantar setiap hari" di beranda dan keadaan hover tombol utama.
- **Brand soft `#E6EEE7`** — latar tab aktif, pil stok, tombol tambah kecil, catatan gratis ongkir.

### Secondary
- **Accent `#BE5A2B`** — eyebrow ("Pagi ini di pasar"), angka keranjang, status "Menunggu pembayaran", catatan batas waktu.
- **Accent soft `#FBEEE5`** — latar catatan waktu dan status menunggu.

### Neutral
- **Bg `#F7F5EF`** — halaman dan kertas dasar.
- **Surface `#FFFFFF`** — semua kartu, input, bilah tab, bilah aksi.
- **Surface 2 `#EDEAE1`** — kerangka memuat, pil "Habis", catatan sekunder, avatar.
- **Ink `#17241C`** — teks utama.
- **Ink 2 `#586A5F`** — teks sekunder dan label.
- **Ink 3 `#6F7D73`** — meta, petunjuk, harga satuan.
- **Border `#E3DFD3`** — garis kartu, pemisah, tepi input.
- **Danger `#A6392A` / danger soft `#FBEDE8`** — stok habis mendadak, pembayaran gagal.

### Named rules
**The Green-Owns-Action Rule.** Hijau mengisi aksi utama dan wilayah aktif. Jangan memakai jingga untuk tombol utama; jingga hanya penanda.

**The One-Border Rule.** Permukaan dipisahkan oleh 1 px `border`. Bayangan hanya untuk bilah tab melayang dan dialog.

## Typography

- **Display / judul halaman:** Fraunces 600, 22–27 px (40 px di desktop untuk sapaan beranda), line-height 1.16–1.2.
- **Judul sapaan beranda:** Bricolage Grotesque 600, clamp 26–38 px, tracking -0.035em. Hanya untuk h1 beranda; Fraunces tetap untuk judul halaman lain dan angka besar.
- **Section title:** Plus Jakarta Sans 700, 13 px. Dipakai untuk "Kategori", "Ringkasan", "Pilih ukuran", "Barang".
- **Body:** Plus Jakarta Sans 400, 12–12.5 px, line-height 1.5. Deskripsi produk 12.5 px.
- **Meta:** 10.5–11 px, `ink-3`. Tanggal, satuan, jumlah stok, "4 kategori".
- **Eyebrow:** 10.5 px, 700, uppercase, tracking 0.06–0.08em, warna accent.
- **Harga:** bold 12–13 px di kartu; 23 px Fraunces di detail; 15–16 px di total. Semua angka memakai `tabular-nums`.

Aturan: jangan menulis harga dengan Fraunces di kartu kecil; Fraunces hanya untuk harga utama di halaman detail dan angka besar. Tidak ada huruf mono di dunia ini.

## Layout

- **Ponsel (acuan 390 px):** gutter 20 px, jarak antar-bagian 26 px, app bar 66 px, bilah tab melayang 58 px + padding bawah 10 px + safe area.
- **Desktop (≥1024 px):** halaman maksimal 1120 px; kategori dan produk unggulan menjadi 4 kolom; detail produk dua kolom (galeri kiri, informasi kanan); checkout dan keranjang dua kolom (isi kiri, ringkasan kanan). Bilah tab ponsel disembunyikan; navigasi teks muncul di app bar.
- **Halaman turunan** (detail, keranjang, checkout, masuk, daftar, detail pesanan) memakai app bar dengan tombol kembali 36 px dan tanpa bilah tab, kecuali daftar pesanan/alamat/akun yang tetap memakai tab.
- **Checkout** selalu dua langkah: alamat & pengiriman, lalu pembayaran. Satu keputusan per layar.

## Elevation & Depth

Permukaan datar. Kedalaman datang dari urutan kartu dan garis tepi. Satu-satunya bayangan adalah bilah tab melayang (`0 6px 20px rgba(23,36,28,0.16)`) dan panel dialog. Jangan menambah `box-shadow` pada kartu produk, ringkasan, atau input.

## Shapes

- Kartu: 16 px; kartu kecil/ringkasan: 14 px.
- Kontrol, input, tombol: 12 px.
- Tombol tambah kecil: 9 px.
- Gambar utama detail: 18 px; thumbnail: 12 px.
- Chip, pil status, badge: 999 px.
- Tab: 46 px tinggi, radius 23 px di dalam pil 58 px radius 29 px.

## Components

### App bar
Logo 38 px radius 13 px berisi ikon ikan cream, nama toko 15 px bold, lokasi 10.5 px `ink-2`. Aksi kanan: tombol cari dan keranjang 38 px (36 px di halaman turunan), radius 12 px, putih, border 1 px. Halaman turunan memakai tombol kembali 36 px dan judul 15 px bold.

### Kartu produk
Gambar rasio 4:3, nama 13 px bold (satu baris), harga 12.5 px bold dengan awalan "dari" hanya di beranda, satuan 10 px `ink-3`, tombol tambah 30 px radius 9 px `brand-soft`. Produk habis: gambar diredupkan, pil "Habis" di kiri atas, teks `ink-2`, tombol `surface-2`.

### Chip filter
Tinggi 30 px, radius penuh, border 1 px. Aktif: isi `brand`, teks cream, 700. Baris chip boleh digulir horizontal di ponsel; jangan membungkus ke dua baris.

### Bilah tab
Pil putih 58 px, radius 29 px, padding 6/8 px, bayangan lembut. Empat tab sama lebar, tinggi 46 px, radius 23 px. Aktif: `brand-soft` + ikon/teks `brand` bold 9.5 px. Nonaktif: `ink-2`. Badge keranjang jingga 17 px di ikon.

### Tombol
- Primer: tinggi 48 px, radius 12 px, `brand`, teks cream 13.5 px bold. Dipakai untuk "Tambah ke keranjang", "Checkout", "Lanjut ke pembayaran", "Bayar", "Masuk", "Daftar".
- Sekunder: putih, border 1 px, teks ink. Dipakai untuk "Belanja lagi", "Daftar akun baru", "Simpan data".
- Kecil: 32–40 px, radius 8–11 px, untuk aksi di kartu (Ubah, Hapus, Jadikan utama).
- Nonaktif: opacity 55%, kursor `not-allowed`.

### Input dan field
Tinggi 46 px, radius 12 px, border 1 px, fokus `brand` + ring 3 px `rgba(27,92,69,0.1)`. Label 11.5 px bold `ink-2`, petunjuk 10.5 px `ink-3`. Textarea catatan 74 px.

### Catatan keadaan
Kotak radius 14 px dengan ikon bulat 26 px:
- Gratis ongkir: `brand-soft` + teks brand.
- Waktu bayar: `accent-soft` + teks accent.
- Stok habis mendadak / pembayaran gagal: `danger-soft` + teks danger.
- Informasi netral: `surface-2` + teks `ink-2`.

### Keadaan kosong dan memuat
Kosong: ikon 68 px dalam lingkaran `surface-2`, judul 16 px bold, teks 11.5 px `ink-3`, tombol primer 44 px. Memuat: kerangka `surface-2` berdenyut, ditambah baris "Memuat produk…" 10.5 px dengan spinner. Jangan memakai spinner layar penuh.

## Do's and Don'ts

### Do
- **Do** pakai token warna di `globals.css`; jangan menulis hex baru di komponen.
- **Do** pertahankan kartu putih, border 1 px, radius 16 px, dan gutter 20 px di ponsel.
- **Do** pakai Fraunces hanya untuk judul dan angka besar; Plus Jakarta Sans untuk sisanya.
- **Do** tampilkan harga, stok, dan status habis di tempat yang sama seperti `.pen`.
- **Do** biarkan hijau memegang aksi dan wilayah aktif.
- **Do** pakai bilah tab melayang di halaman utama dan sembunyikan di alur checkout.

### Don't
- **Don't** mengembalikan dunia buku kas: tanpa garis mistar hijau, tanpa sudut 0 px, tanpa huruf Courier.
- **Don't** menambah warna baru, gradien, atau bayangan kartu.
- **Don't** memakai jingga untuk tombol utama atau teks panjang.
- **Don't** menaruh dua aksi utama dalam satu layar; satu tombol primer per layar.
- **Don't** mengarang angka toko, ulasan, atau klaim; data katalog dan pesanan masih contoh sampai Fase 2–4.

## Implementation map

| Layar `.pen` | Rute | Komponen |
|---|---|---|
| 01 Beranda | `/` | `app/(store)/page.tsx` |
| 02 Daftar produk | `/products` | `_components/product-browser.tsx` |
| 03 Detail produk | `/products/[slug]` | `_components/product-detail.tsx` |
| 04 Keranjang | `/cart` | `_components/cart-view.tsx` |
| 05 Checkout alamat | `/checkout` | `_components/checkout-form.tsx` |
| 06 Checkout pembayaran | `/checkout/payment` | `_components/payment-view.tsx` |
| 07 Hasil pembayaran | `/checkout/result` | `_components/payment-result-view.tsx` |
| 08 Masuk | `/login` | `_components/auth-form.tsx` |
| 09 Daftar akun | `/register` | `_components/auth-form.tsx` |
| 10 Riwayat pesanan | `/account/orders` | `_components/orders-view.tsx` |
| 11 Detail pesanan | `/account/orders/[orderNumber]` | halaman server |
| 12 Alamat | `/account/addresses` | `_components/address-list.tsx` |
| 13 Profil | `/account` | `_components/profile-view.tsx` |
| 14–18 Keadaan kosong/memuat | rute yang sama | `EmptyState`, `loading.tsx`, skeleton |
| 19–23 Keadaan khusus | alur yang sama | catatan danger/amber dan `?order=` |

## Motion

Pindah halaman terasa seperti satu lembar kertas bergeser menutup lembar sebelumnya, bukan halaman berkedip.

- **Arah mengikuti navigasi.** Turun ke halaman yang lebih dalam (`/` → `/products` → `/products/[slug]`) menggeser lembar baru masuk dari kanan sambil lembar lama keluar ke kiri; kembali membalik arahnya. Bilah tab dan bilah atas selalu menyamping (fade 8 px), karena tab bukan tempat yang lebih dalam.
- **Bilah jadi jangkar.** `store-bar` dan `store-tabbar` dipaku lewat `view-transition-name`; posisinya tidak ikut bergeser, hanya isinya bertukar dengan crossfade. Yang bergerak hanya tubuh halaman.
- **Durasi.** 320 ms masuk, 240 ms keluar di ponsel (geser penuh selebar layar, `--ease`); di ≥1024 px menjadi 64 px + fade karena layar jauh lebih lebar. Lateral 220 ms.
- **Lembar harus opak.** Pembungkus di `(store)/template.tsx` memakai `bg-bg`; tanpa latar sendiri, dua halaman akan saling tembus.
- **Reduced motion** mempertahankan crossfade dan membuang seluruh pergeseran (`--pt-slide`, `--pt-leave`, `--pt-lift` = 0).

Implementasi: `src/app/(store)/template.tsx` (pembungkus `ViewTransition`), `_components/transition-link.tsx` (menebak arah dari kedalaman URL; jangan pakai `next/link` langsung di permukaan toko), dan blok `--pt-*` di `globals.css`.
