# Cakupan wireframe terhadap PRD v1.1

## Layar

| Sumber | Diminta | Digambar |
|---|---|---|
| Toko, PRD §4.2 | 13 | 13 |
| Admin, PRD §4.2 | 11 | 11 |
| Keadaan toko di luar daftar layar | — | 10 |
| Keadaan admin di luar daftar layar | — | 3 |

Papan toko memuat 23 frame: 13 layar ditambah 10 keadaan, yaitu katalog tanpa hasil, keranjang kosong, riwayat pesanan kosong, katalog memuat, riwayat pesanan memuat, keranjang dengan varian habis, checkout saat stok habis, checkout saat syarat gratis ongkir belum berlaku, checkout saat pesanan sedang dibuat, dan detail pesanan setelah pembayaran gagal.

Papan admin memuat 14 frame: 11 layar ditambah dialog pembatalan, daftar pesanan pada 1024 px, dan daftar pesanan di ponsel.

## Keadaan yang PRD minta secara eksplisit

| Keadaan | PRD | Digambar di |
|---|---|---|
| Katalog kosong dan pencarian tanpa hasil | §4.3 | Katalog tanpa hasil |
| Keranjang kosong | §4.3 | Keranjang kosong |
| Riwayat pesanan kosong | §4.3 | Riwayat pesanan kosong |
| Kerangka daftar produk dan daftar pesanan | §4.3 | Katalog memuat, Riwayat pesanan memuat |
| Tombol bayar nonaktif berlabel "Memproses…" | §4.3 | Checkout — pesanan sedang dibuat |
| Stok habis saat checkout | §4.3, §2.2 3.1 | Checkout — stok baru habis |
| Pembayaran gagal dengan tautan bayar ulang | §4.3 | Detail pesanan — pembayaran gagal |
| Webhook gagal tampil sebagai perlu ditinjau | §4.3 | Dashboard admin, Daftar pesanan |
| Gratis ongkir saat syarat belum terpenuhi | §6.1 | Checkout — syarat gratis ongkir belum berlaku |
| Nomor WhatsApp dan alamat toko di situs | §8 | Kaki halaman Beranda |
| Alasan wajib saat membatalkan pesanan | §2.2 5.3 | Batalkan pesanan |
| Mencatat pengembalian dana | §3.5 | Detail pesanan admin, Daftar pesanan |
| Admin nyaman dari 1024 px dan daftar pesanan terbaca di ponsel | §2.3 | Daftar pesanan — 1024 px, Daftar pesanan — ponsel |

## Yang belum digambar

- Isi navigasi admin di ponsel: tombol menunya sudah digambar, laci atau halaman tujuannya belum. Ini keputusan pemilik, tercatat juga sebagai pertanyaan terbuka di `wireframes-admin-open-questions.md`.
- Halaman Snap Midtrans dan aplikasi kurir: milik pihak lain, bukan layar aplikasi ini (PRD §1.2, §3.5).
- Ekspor laporan dan faktur pelanggan restoran: di luar MVP (PRD §1.3, §9.2).

## Ketidaksesuaian di PRD, bukan di wireframe

Status `processing` ada di rantai status PRD §3.2, tetapi tidak ada satu pun kriteria di §2.2 5.3 yang menetapkan tombol mana yang memasukinya. Wireframe admin melompat dari dibayar langsung ke sedang diantar, mengikuti kriteria, bukan rantai status. Perlu satu keputusan: tambah tombol "Mulai siapkan", atau pakai `processing` sebagai nama status saat barang sedang disiapkan tanpa tombol sendiri.
