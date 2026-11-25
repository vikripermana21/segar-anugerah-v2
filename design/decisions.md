# Catatan keputusan — wireframe toko Segar Anugerah

## 2026-11-19 · Layar toko digambar; layar admin belum
- Decided by: pemilik (jawaban atas pertanyaan cakupan)
- Why: toko dipakai dari ponsel; PRD §2.3 menetapkan mobile-first dan checkout harus nyaman di layar 360 px
- Rejected: menggambar toko dan admin bersamaan, karena struktur toko belum disetujui
- Rests on: PRD §2.3, §4.2

## 2026-11-19 · Teks di dalam wireframe berbahasa Indonesia
- Decided by: pemilik
- Why: PRD §4.3 dan README menetapkan teks antarmuka berbahasa Indonesia, sedangkan nama rute, tabel, dan berkas berbahasa Inggris
- Rejected: label berbahasa Inggris
- Rests on: PRD §4.3, README

## 2026-11-19 · Navigasi mobile memakai empat tab bawah: Beranda, Produk, Keranjang, Akun
- Decided by: Hermes (default) — pemilik belum menjawab
- Why: PRD tidak menetapkan navigasi mobile; empat tab memetakan rute utama toko tanpa menu tersembunyi
- Rejected: menu laci, deretan tautan di header
- Rests on: PRD §3.4

## 2026-11-19 · Checkout dipisah dua layar: alamat & pengiriman, lalu pembayaran
- Decided by: Hermes (default)
- Why: PRD §4.1 meminta satu keputusan per layar; §4.2 mencantumkan dua layar checkout
- Rejected: satu halaman checkout panjang
- Rests on: PRD §4.1, §4.2

## 2026-11-19 · Metode pembayaran tidak dipilih di layar checkout
- Decided by: Hermes (default)
- Why: Snap menampilkan dan memilih metode; layar toko hanya membawa ringkasan dan tombol bayar
- Rejected: daftar metode pembayaran sendiri di dalam toko
- Rests on: PRD §3.5

## 2026-11-19 · Pemilih varian berupa baris radio dengan harga dan stok tiap ukuran
- Decided by: Hermes (default)
- Why: kriteria PRD menuntut harga tiap varian terlihat bersamaan; chip hanya memuat label
- Rejected: chip ukuran, menu turun
- Rests on: PRD §2.2 1.2

## 2026-11-19 · Harga di kartu produk adalah harga varian terendah, ditulis dengan awalan "dari"
- Decided by: Hermes (default)
- Why: PRD §2.2 1.1 meminta nama, harga terendah, satuan, dan foto utama pada daftar produk
- Rejected: menampilkan rentang harga
- Rests on: PRD §2.2 1.1

## 2026-11-19 · Harga varian di layar detail digambar lebih besar daripada nama produk
- Decided by: Hermes (default)
- Why: keputusan di layar itu adalah membeli pada harga tersebut, jadi harga harus mendarat lebih dulu
- Rejected: nama produk sebagai teks terbesar
- Rests on: PRD §4.1

## 2026-11-19 · Bagian "Keadaan khusus" memuat tiga layar di luar 13 layar PRD §4.2
- Decided by: Hermes (default)
- Why: PRD §4.3 menetapkan keadaan kosong dan stok habis; memperbaiki strukturnya paling murah sebelum desain visual
- Rejected: menyerahkan seluruh keadaan ke /fortify setelah struktur dibekukan
- Rests on: PRD §4.3, §2.2 3.1

## 2026-11-19 · Status pesanan di layar pembeli memakai istilah Indonesia
- Decided by: Hermes (default)
- Why: teks antarmuka berbahasa Indonesia, sementara nama status di database tetap Inggris
- Rejected: menampilkan pending_payment dan paid_late apa adanya
- Rests on: PRD §4.3

## 2026-11-19 · Ikon kurang pada stepper jumlah dan ikon pembuka baris navigasi digambar sebagai placeholder
- Decided by: Hermes (default)
- Why: kit wireframe hanya menyediakan chevron, search, check, ×, plus, bell, camera, alert, panah kiri, dan info
- Rejected: memakai karakter teks sebagai ikon kontrol
- Rests on: design-system.css

## 2026-11-19 · Mekanisme pemilih varian dipertahankan baris radio; tiga temuan diperbaiki
- Decided by: pemilik (menyetujui perbaikan yang diajukan)
- Why: kapsul berharga terukur butuh 398 px di ruang 358 px sehingga membungkus dua baris, dan harga tiap varian tidak lagi terbaca bersamaan; perbaikan yang disetujui tidak mengubah mekanismenya
- Rejected: mengganti baris radio dengan kapsul, dan menunda perbaikan sampai kit diperbarui
- Rests on: design/evaluation-variant-picker.md, PRD §2.2 1.2

## 2026-11-19 · Keadaan nonaktif radio varian diperbaiki di artefak, bukan menunggu kit
- Decided by: Hermes (default)
- Why: kit tidak punya aturan `.choice input:disabled`, jadi baris habis tampak bisa ditekan; membiarkannya membuat wireframe berbohong tentang keadaannya
- Rejected: menunggu aturan kit ditambahkan lewat /include lebih dulu
- Rests on: design-system.css, design/evaluation-variant-picker.md

## 2026-11-19 · Layar admin digambar pada lebar 1280 px dengan sidebar sembilan rute dalam empat kelompok
- Decided by: pemilik (meminta layar admin dikerjakan lebih dulu) — lebar dan pengelompokan default Hermes
- Why: admin dipakai dari laptop; sembilan rute dikelompokkan mengikuti pekerjaan admin (pesanan, katalog, pengiriman, toko) supaya tidak jadi daftar sembilan tautan sejajar
- Rejected: lebar 1024 px, dan navigasi tanpa pengelompokan
- Rests on: PRD §2.3, §3.4

## 2026-11-19 · Data di layar admin adalah data contoh
- Decided by: pemilik ("gunakan data dummy dulu")
- Why: katalog dan pesanan asli belum ada; angka contoh membuat keputusan struktur bisa dinilai tanpa menunggu data sungguhan
- Rejected: menunggu data asli sebelum menggambar
- Rests on: PRD §8 (isi katalog minimal), permintaan pemilik

## 2026-11-19 · Daftar pesanan dan daftar produk dipaginasi
- Decided by: Hermes (default)
- Why: sepuluh pesanan sehari berarti daftar memanjang tanpa paginasi; PRD tidak menetapkannya
- Rejected: satu daftar panjang tanpa batas
- Rests on: PRD §2.3 kapasitas awal 50 pesanan/hari

## 2026-11-19 · Prototype admin hanya memindahkan layar, tanpa simulasi status
- Decided by: Hermes (default)
- Why: perubahan status butuh keadaan sungguhan; prototype klik-tembus tidak boleh berpura-pura mengubah data
- Rejected: membuat layar terpisah untuk tiap status pesanan
- Rests on: PRD §2.1 Alur B

## 2026-11-19 · Tombol Ekspor dihapus dari layar Laporan
- Decided by: Hermes (default)
- Why: PRD menempatkan ekspor Excel di luar MVP, jadi tombolnya akan menjanjikan hal yang belum ada
- Rejected: menggambar tombol dengan label "belum tersedia"
- Rests on: PRD §1.3

## 2026-11-19 · Status bawaan digambar sebagai teks biasa, pengecualian sebagai stempel
- Decided by: Hermes (default)
- Why: sembilan baris berstempel "Aktif" mengubah kolom status jadi hiasan; pembaca harus bisa menemukan pengecualian dalam satu pandangan
- Rejected: stempel di setiap baris tabel katalog dan zona
- Rests on: design-system.css (stamp = tanda keadaan)

## 2026-11-19 · Deck 12 slide dibangun dengan reveal.js dan warna brand lama
- Decided by: pemilik (format, tampilan, dan tujuan slide) — jumlah slide default Hermes
- Why: ruang sepuluh menit untuk pemilik dan dua rekan, dan warna brand dari design/tokens.css dipilih supaya ruangan mengenali tokonya
- Rejected: tema netral Intent, dan kartu PowerPoint atau Google Slides
- Rests on: design/deck-struktur-segar-anugerah.html, permintaan pemilik

## 2026-11-19 · Deck berakhir pada permintaan masukan, bukan persetujuan
- Decided by: pemilik (memilih "memahami strukturnya dan memberi masukan bebas")
- Why: rapatnya untuk menilai struktur, jadi slide terakhir menyebut masukan yang berguna dan yang belum perlu, bukan meminta tanda tangan
- Rejected: menutup dengan persetujuan struktur sebelum Fase 2
- Rests on: design/deck-struktur-segar-anugerah.html

## 2026-11-19 · Deck memuat dua layar admin dari sebelas yang ada
- Decided by: Hermes (default)
- Why: sepuluh menit hanya cukup untuk pekerjaan admin yang paling sering dipakai, yaitu dashboard pagi dan memproses satu pesanan; sisanya ada di papan wireframe
- Rejected: memasukkan katalog, zona ongkir, pengaturan, dan laporan sebagai slide sendiri
- Rests on: design/wireframes-admin.html

## 2026-11-19 · Sembilan keadaan yang belum tercover dilengkapi lebih dulu
- Decided by: pemilik ("gas cover dulu")
- Why: PRD §4.3, §6.1, §8, §3.5, dan §2.2 5.3 menyebut keadaan yang tidak punya frame; melengkapinya sebelum rapat membuat struktur dinilai utuh
- Rejected: membawa papan apa adanya dan menyebut gap-nya di slide terakhir
- Rests on: design/wireframe-coverage.md

## 2026-11-19 · Deck dikoreksi setelah papan bertambah
- Decided by: Hermes (default)
- Why: subjudul menyebut 27 layar dan satu butir menyatakan lebar 1024 px dan tampilan ponsel belum digambar; keduanya tidak lagi benar setelah keadaan dilengkapi
- Rejected: membiarkan angka dan butir lama karena deck sudah "selesai"
- Rests on: design/deck-struktur-segar-anugerah.html, design/wireframe-coverage.md

## 2026-11-19 · Dunia visual v2 adalah buku kas toko yang berjalan
- Decided by: pemilik (memilih kartu "Buku Kas Toko" dari gulir concept-seed; hijau tetap warna utama)
- Why: pembeda toko adalah langganan tetap warung dan restoran yang diantar sendiri, dan buku kas adalah benda yang membuat "toko yang sama setiap hari" terbaca tanpa satu pun klaim
- Rejected: papan nama cat minyak (kandidat peringkat satu, ditawarkan sebagai pilihan impeccable), enam instrumen kokpit (penantang yang menang di kejelasan), dan lima penantang lain yang kalah di identifikasi pembaca
- Rests on: design/evaluation-variant-picker.md, .impeccable/surfaces/src-app-store-page-tsx.md

## 2026-11-19 · Beranda toko dibangun code-led tanpa comp
- Decided by: Hermes (default)
- Why: sesi ini tidak punya pembuat gambar, jadi comp tidak bisa dibuat; sketsa viewport pertama pada kartu yang dipilih menjadi komposisi yang harus dipenuhi build
- Rejected: menunda build sampai comp tersedia
- Rests on: .impeccable/decision/first-viewport-assigned.html, src/app/(store)/page.tsx

## 2026-11-19 · "Baris" pada saldo dan badge berarti satu varian, bukan satu unit
- Decided by: Hermes (default)
- Why: halaman sendiri memakai "baris" untuk baris barang (kepala daftar, blok pesan ulang), dan pembeli langganan yang memesan dua unit satu varian adalah kasus normal toko ini
- Rejected: mengganti kata menjadi "barang" dan menghitung unit
- Rests on: src/app/(store)/cart.tsx, src/app/(store)/saldo-bar.tsx

## 2026-11-19 · Sapuan gerak "menulis" mengikuti urutan penulisan, bukan posisi baris
- Decided by: Hermes (default)
- Why: jeda yang dikunci ke posisi baris membuat tambah satu baris di baris bawah mulai terlambat dan umur penanda memotong animasinya sendiri; penanda juga dipisah per sumber agar sapuan hanya mengenai baris yang benar-benar ditulis
- Rejected: menyapu seluruh blok sekaligus tanpa urutan, dan menerima sapuan yang terpotong
- Rests on: src/app/(store)/cart.tsx, src/app/globals.css

## 2026-11-19 · Tarif zona di beranda ditandai contoh
- Decided by: pemilik (tarif ditunda ke Fase 2 pada 19 Nov)
- Why: kontrak permukaan menyatakan tarif belum diputuskan, jadi menampilkannya sebagai angka pasti akan jadi klaim yang tidak berdasar
- Rejected: menghapus blok zona dari beranda
- Rests on: src/app/(store)/page.tsx, docs/PRD.md §9.2

## 2026-11-19 · Dunia visual toko diganti mengikuti design/segar-anugerah-client.pen
- Decided by: pemilik (meminta rombak desain mengacu ke berkas `.pen` klien)
- Why: `.pen` menetapkan pasar pagi — krem, hijau tua, kartu putih membulat, Fraunces + Plus Jakarta Sans — dan mencakup 23 layar termasuk keadaan kosong, memuat, stok habis, dan pembayaran gagal
- Rejected: mempertahankan dunia buku kas (Archivo + Courier, sudut 0 px, garis mistar) yang sudah dibangun di beranda
- Rests on: design/segar-anugerah-client.pen, DESIGN.md, src/app/(store)/*


## 2026-11-25 · Isi pesanan `paid` tidak bisa diubah admin
- Decided by: pemilik
- Why: perubahan isi mengubah total dan nominal Midtrans; pembatalan lalu pesanan baru adalah jalur yang bisa diaudit
- Rejected: mode ubah isi pesanan di layar detail admin
- Rests on: docs/PRD.md §9.2, design/wireframes-admin-open-questions.md

## 2026-11-25 · Pembatalan admin mencakup `paid`, `out_for_delivery`, dan `paid_late`
- Decided by: pemilik (mengikuti rekomendasi)
- Why: barang bisa batal sebelum selesai; `paid_late` perlu jalur refund tanpa menyentuh stok karena cron kedaluwarsa sudah mengembalikannya
- Rejected: membatasi pembatalan hanya pada `paid`
- Rests on: docs/PRD.md §2.1 Alur B, §2.2 5.3

## 2026-11-25 · Omzet laporan memakai waktu transisi ke `completed`
- Decided by: pemilik
- Why: pesanan dihitung sebagai penjualan saat selesai, bukan saat dibayar; `order_status_history` menyimpan waktu itu
- Rejected: memakai `orders.paid_at` atau `orders.updated_at`
- Rests on: docs/PRD.md §2.2 5.6
