# Pemilih varian di layar detail produk (wireframe toko)

## Anti-Pattern Verdict

Bersih — tidak ada pola manipulatif. Varian berstok 0 justru tetap ditampilkan, kebalikan dari scarcity buatan.

## Priority Issues

### Cosmetic

**Baris yang membawa stempel "Habis" lebih tinggi daripada baris lain**
- **What happens:** Setelah stempel keadaan dipindahkan ke sebelah labelnya, baris "3 kg" menjadi 58 px sementara dua baris lain 50 px — stempel punya tinggi minimum 24 px ditambah bingkai, sedangkan satu baris teks label hanya 20 px.
- **Why it matters:** Irama daftar jadi tidak rata tepat di satu-satunya baris yang sudah membawa penanda lain.
- **Breaks:** aesthetic and minimalist design.
- **Change:** Samakan tinggi baris, atau letakkan keadaan habis di baris harga alih-alih di baris label.

## Positive Findings

- Seluruh baris adalah elemen `<label>`: target sentuh 356 × 50 px, jauh di atas ambang minimum — tidak ada salah tekan di ponsel.
- Setiap baris membawa harga dan stoknya sendiri, sehingga perbandingan 1 kg, 2 kg, dan 3 kg selesai tanpa satu pun ketukan (lihat bagian perbandingan di bawah).
- Baris terpilih menandai dirinya sendiri dengan latar dan bingkai aksen; kontras teks di atasnya 12,8:1 untuk label dan 5,1:1 untuk baris harga pada tema terang, 11,1:1 dan 4,9:1 pada tema gelap — keduanya lolos ambang teks kecil WCAG AA.
- Baris habis menyatakan keadaannya sekali saja lewat stempel "Habis", dan radio nonaktifnya diredupkan 45% — peramban tidak lagi menampilkannya sama dengan radio yang bisa dipilih.
- Varian habis tetap terlihat dan ditandai, bukan disembunyikan, sesuai prinsip "jujur soal stok" di PRD §4.1.
- Radio bawaan peramban: pembaca layar mengumumkan satu grup dengan label tiap varian tanpa ARIA buatan.

## Perbandingan mekanisme: baris radio atau kapsul

Angka di bawah diukur di peramban pada layar 390 px, kolom isi 358 px.

| | Baris radio (sekarang) | Kapsul label saja | Kapsul berharga |
|---|---|---|---|
| Tinggi satu pilihan | 50 px | 32 px | 32 px |
| Ruang untuk 3 varian | 174 px, satu blok | 170 px, satu baris | 398 px lebar — membungkus jadi 2 baris |
| Harga per varian | terbaca bersamaan | hanya yang terpilih | terbaca, tapi tidak muat sebaris |
| Stok per varian | terbaca bersamaan | tidak terbaca | tidak terbaca (kapsul "3 kg · Rp 130.000 · Habis" sendiri 178 px) |
| Target sentuh | 356 × 50 px | 50 × 32 px | 124 × 32 px |
| Ketukan untuk membandingkan harga | 0 | 3 | 0, dengan dua baris |

**Putusan: pertahankan baris radio.** Tiga alasan, berurutan:

1. Kriteria penerimaan PRD §2.2 1.2 menuntut ketiga varian tampil dengan harganya. Kapsul yang hanya memuat label gagal memenuhi itu; kapsul yang memuat harga berhenti jadi kapsul.
2. Kapsul berharga tidak muat sebaris: 124 + 126 + 132 px ditambah jarak = 398 px, sementara ruangnya 358 px. Ia membungkus jadi dua baris dan kehilangan kerapatan yang jadi alasan memilihnya. Yang tersisa hanya penghematan 98 px dibanding daftar.
3. Tugas pembeli di layar ini adalah membandingkan berat terhadap harga — 2 kg memang lebih mahal, tetapi harganya per kg berbeda. Perbandingan butuh keduanya terlihat sekaligus; kapsul mengubahnya jadi tiga ketukan dan satu ingatan.

Kapsul menjadi pilihan yang benar bila varian tidak lagi berbeda harga, atau bila harga tiap varian ditampilkan di tempat lain pada layar yang sama.
