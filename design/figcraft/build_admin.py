"""build_admin — the admin board (14 screens, 1280 / 1024 / 390).

Run:  python3 build_admin.py
"""
import os
import tokens as T
import figlib as F
import comps as C
import comps_admin as A
from comps_admin import AW, SB, PAD, CX, CWID, TOPBAR
import build_store as BS     # the phone shell (appbar, filters) is shared

DIR = os.path.dirname(os.path.abspath(__file__))
d = F.Doc()
SCREENS = []
_cur = {}


def screen(name, w, h, fill=T.PAPER):
    s = d.frame(name, _cur["x"], _cur["y"], w, h, fill=fill, clip=True)
    prev = d.default_parent
    d.set_default_parent(s)
    SCREENS.append((name, _cur["x"], _cur["y"], w, h))

    def close():
        d.set_default_parent(prev)
        _cur["y"] += h + 140
    return s, close


def switch(d, x, y, on=True, label=None):
    d.rect("sw", x, y, 46, 26, fill=T.GREEN if on else T.PAPER,
           stroke=T.GREEN if on else T.INK_OUT, strokeWeight=2)
    d.rect("sw/knob", x + (22 if on else 4), y + 4, 18, 18,
           fill=T.ON_BAND if on else T.INK_OUT)
    if label:
        d.text("sw/l", x + 60, y + 4, label, "body")
    return y + 26


def bars(d, x, y, w, rows, maxv=None, bar_h=10):
    maxv = maxv or max(v for _, v, _ in rows)
    for label, v, txt in rows:
        d.note("b/l", x, y + bar_h / 2 + 4, label, color=T.INK_2, size=8.5)
        track_x = x + 76
        track_w = w - 76 - 130
        d.rect("b/track", track_x, y, track_w, bar_h, fill=T.GREEN_WASH)
        d.rect("b/fill", track_x, y, track_w * v / maxv, bar_h, fill=T.GREEN)
        d.text("b/v", x + w - 130, y - 2, txt, "body", width=130, align="right")
        y += bar_h + 20
    return y


# ══════════════════════════════════════════════════ Masuk ════════════════
def s_masuk():
    _, close = screen("a01-masuk", AW, 800)
    d.rect("band", 0, 0, 460, 800, fill=T.GREEN)
    d.note("band/n", 56, 64, "ledger admin · cilandak", color="#CFE3D8", size=9)
    d.text("band/t", 56, 92, "Segar", "display", color=T.ON_BAND)
    d.text("band/t2", 56, 142, "Anugerah", "display", color=T.ON_BAND)
    d.para("band/p", 56, 220, "Buku kas toko: pesanan masuk di atas kertas, "
           "setiap perubahan dicatat dengan waktunya.", "body", 320, color="#CFE3D8")
    d.note("band/f", 56, 740, "hanya akun yang dibuat dari dalam aplikasi", color="#CFE3D8",
           size=9)

    x, w = 620, 420
    d.note("eyebrow", x, 220, "masuk", color=T.INK_OUT, size=9)
    d.text("t", x, 238, "Masuk ke area admin", "title")
    d.para("p", x, 288, "Tidak ada pendaftaran sendiri; akun admin dibuat dari dalam aplikasi.",
           "body", w, color=T.INK_2)
    y = 340
    y = A.field(d, x, y, w, "Nomor WhatsApp", value="08123456789") + 20
    y = A.field(d, x, y, w, "Sandi", value="••••••••", error=True) + 12
    d.note("err", x, y + 8, "sandi salah · percobaan ke-3 dari 5", color=T.STAMP, size=9)
    y += 26
    A.btn(d, x, y, w, 48, "Masuk", "primary")
    d.note("reset", x, y + 80, "lupa sandi? hubungi admin lain", color=T.INK_OUT, size=8.5)
    close()


# ══════════════════════════════════════════════════ Dashboard ════════════
def s_dashboard():
    _, close = screen("a02-dashboard", AW, 916)
    x, y, w = A.shell(d, "Dashboard", "dashboard", "kamis, 19 november 2026 · 15.40 wib")
    y = A.metrics(d, x, y, w, [
        ("PERLU DISIAPKAN", "4", "2 sudah dibayar pagi ini"),
        ("SUDAH DIBAYAR HARI INI", "6", "dari 12 pesanan masuk"),
        ("OMZET HARI INI", "Rp 4.250.000", "pesanan selesai saja"),
    ])
    y += 18
    d.rect("co", x, y, w, 76, fill=T.PAPER, stroke=T.STAMP, strokeWeight=2)
    d.icon("triangle-alert", x + 22, y + 24, 16, T.STAMP)
    d.text("co/t", x + 44, y + 12, "1 pesanan perlu ditinjau", "lead", color=T.STAMP)
    d.text("co/x", x + 44, y + 34, "SA-261113-8812 dibayar setelah kedaluwarsa. Stoknya "
           "mungkin sudah terjual; periksa sebelum menyiapkan.", "body-s", color=T.INK_2,
           width=w - 220)
    A.btn(d, x + w - 108, y + 22, 88, 32, "Buka", "secondary")
    y += 96

    y = A.section(d, x, y, w, "Pesanan perlu disiapkan", "4 pesanan")
    cols = [("NOMOR", 170, "left"), ("DIBAYAR", 100, "left"), ("PEMBELI", 260, "left"),
            ("BARANG", 80, "right"), ("TOTAL", 150, "right"), ("", 130, "right")]
    rows = [
        ["SA-261119-4821", "14.04", "Dewi Lestari", ("num", "2"), ("num", "Rp 106.000"),
         ("stamp", "dibayar", "paid")],
        ["SA-261119-3390", "13.47", "Warung Bu Nani", ("num", "5"), ("num", "Rp 412.000"),
         ("stamp", "dibayar", "paid")],
        ["SA-261119-1204", "—", "Bagus Prakoso", ("num", "1"), ("num", "Rp 45.000"),
         ("stamp", "menunggu", "wait")],
    ]
    y = A.table(d, x, y, w, cols, rows)
    d.note("more", x, y + 16, "menampilkan 3 dari 4 pesanan", color=T.INK_OUT, size=8.5)
    y += 44

    y = A.section(d, x, y, w, "Tujuh hari terakhir", "omzet pesanan selesai")
    rows = [("13 Nov", 3980, "Rp 3.980.000"), ("14 Nov", 1870, "Rp 1.870.000"),
            ("15 Nov", 4620, "Rp 4.620.000"), ("16 Nov", 2930, "Rp 2.930.000"),
            ("17 Nov", 3640, "Rp 3.640.000"), ("18 Nov", 4010, "Rp 4.010.000"),
            ("19 Nov", 4250, "Rp 4.250.000")]
    bars(d, x, y + 4, w - 40, rows)
    close()


# ══════════════════════════════════════════════════ Daftar pesanan ═══════
def s_pesanan(w=AW, name="a03-pesanan", h=880, narrow=False):
    _, close = screen(name, w, h)
    x, y, ww = A.shell(d, "Pesanan", "pesanan",
                       "7 hari terakhir · 43 pesanan", w=w)
    d.rect("search", x, y, 340, 42, fill=T.PAPER, stroke=T.RULE, strokeWeight=1)
    d.icon("search", x + 22, y + 21, 15, T.INK_OUT)
    d.text("search/p", x + 40, y + 11, "Cari nomor pesanan atau nama pembeli", "body-s",
           color=T.INK_OUT)
    A.pills(d, x + 360, y + 2, ["Semua", "Perlu disiapkan", "Dikirim", "Selesai",
                                "Batal & kedaluwarsa"], "Semua")
    d.rect("date", x + ww - 150, y, 150, 42, fill=T.PAPER, stroke=T.RULE, strokeWeight=1)
    d.text("date/v", x + ww - 138, y + 11, "7 hari terakhir", "body-s")
    d.icon("chevron-down", x + ww - 20, y + 21, 14, T.INK_2)
    y += 60

    if narrow:
        cols = [("NOMOR", 160, "left"), ("DIBUAT", 130, "left"), ("PEMBELI", 200, "left"),
                ("TOTAL", 140, "right"), ("STATUS", 150, "left"), ("", 80, "right")]
    else:
        cols = [("NOMOR", 170, "left"), ("DIBUAT", 130, "left"), ("PEMBELI", 230, "left"),
                ("BARANG", 80, "right"), ("TOTAL", 140, "right"), ("STATUS", 160, "left"),
                ("", 74, "right")]
    data = [
        ("SA-261119-4821", "19 Nov 14.02", "Dewi Lestari", "2", "Rp 106.000", "dibayar", "paid"),
        ("SA-261119-3390", "19 Nov 13.45", "Warung Bu Nani", "5", "Rp 412.000", "dibayar", "paid"),
        ("SA-261119-1204", "19 Nov 12.41", "Bagus Prakoso", "1", "Rp 45.000", "menunggu pembayaran", "wait"),
        ("SA-261118-9921", "18 Nov 15.56", "Warung Bu Nani", "3", "Rp 186.000", "sedang diantar", "paid"),
        ("SA-261117-4410", "17 Nov 09.12", "Dewi Lestari", "2", "Rp 78.000", "selesai", "wait"),
        ("SA-261115-0473", "15 Nov 16.20", "Warung Bu Nani", "1", "Rp 45.000", "dibatalkan", "dead"),
        ("SA-261114-2205", "14 Nov 10.05", "Dewi Lestari", "2", "Rp 106.000", "kedaluwarsa", "dead"),
        ("SA-261113-8812", "13 Nov 11.32", "Bagus Prakoso", "3", "Rp 220.000", "perlu ditinjau", "alert"),
        ("SA-261112-6640", "12 Nov 09.58", "Warung Bu Nani", "2", "Rp 186.000", "dana dikembalikan", "dead"),
    ]
    rows = []
    for no, made, buyer, items, total, st, tone in data:
        r = [no, made, buyer]
        if not narrow:
            r.append(("num", items))
        r += [("num", total), ("stamp", st, tone), ("", "")]
        rows.append(r)
    y = A.table(d, x, y, sum(c[1] for c in cols), cols, rows)

    d.note("pager", x, y + 22, "menampilkan 1–9 dari 43 pesanan", color=T.INK_OUT, size=8.5)
    d.rect("pg/off", x + ww - 200, y + 6, 96, 34, fill=T.PAPER, stroke=T.RULE, strokeWeight=1)
    d.text("pg/off/t", x + ww - 200, y + 15, "Sebelumnya", "lead", color=T.INK_OUT,
           width=96, align="center")
    A.btn(d, x + ww - 96, y + 6, 96, 34, "Berikutnya", "secondary")
    close()


def s_pesanan_1024():
    s_pesanan(w=1024, name="a13-pesanan-1024", h=880, narrow=True)


def s_pesanan_ponsel():
    W = T.PHONE_W
    _, close = screen("a14-pesanan-ponsel", W, 780)
    C.appbar(d, "Pesanan", back=False, icons=(), cart=0)
    y = 76
    y = BS.filter_tabs(y, ["Semua", "Disiapkan", "Dikirim", "Selesai"], "Semua")
    d.note("n", 20, y + 18, "3 dari 42 pesanan", color=T.INK_OUT, size=8.5)
    y += 32
    cards = [("SA-261119-4821", "dibayar", "Dewi Lestari · 14.02", "Rp 106.000"),
             ("SA-261119-3390", "dibayar", "Warung Bu Nani · 13.45", "Rp 412.000"),
             ("SA-261118-9921", "sedang diantar", "Warung Bu Nani · kemarin 15.56", "Rp 186.000")]
    for no, st, meta, total in cards:
        d.rect("card", 20, y, 350, 116, fill=T.PAPER, stroke=T.RULE, strokeWeight=1)
        d.text("c/no", 34, y + 12, no, "lead")
        C.status(d, 34, y + 38, st, "paid")
        d.note("c/meta", 34, y + 58, meta, color=T.INK_2, size=8.5, orig=True)
        d.text("c/t", 34, y + 70, total, "price")
        A.btn(d, 250, y + 68, 106, 34, "Buka", "secondary")
        y += 128
    close()


# ══════════════════════════════════════════════════ Detail pesanan ═══════
def s_detail_pesanan():
    _, close = screen("a04-detail-pesanan", AW, 872)
    x, y, w = A.shell(d, "Pesanan SA-261119-4821", "pesanan")
    # action row
    d.icon("arrow-left", x + 8, y + 14, 18, T.INK)
    d.text("no", x + 34, y + 2, "SA-261119-4821", "title")
    d.rect("st", x + 246, y + 6, 78, 24, fill=T.PAPER, stroke=T.GREEN, strokeWeight=2)
    d.note("st/t", x + 254, y + 22, "dibayar", color=T.GREEN, bold=True, size=9)
    A.btn(d, x + w - 300, y - 6, 148, 40, "Tandai diantar", "primary")
    A.btn(d, x + w - 140, y - 6, 140, 40, "Batalkan", "danger")
    y += 60

    lw, rw = 596, w - 596 - 28
    lx, rx = x, x + lw + 28

    ly = A.section(d, lx, y, lw, "Barang yang disiapkan")
    cols = [("BARANG", 220, "left"), ("VARIAN", 100, "left"), ("HARGA", 120, "right"),
            ("JUMLAH", 80, "right"), ("SUBTOTAL", 74, "right")]
    A.table(d, lx, ly, lw, cols, [["Ikan Nila", "1 kg", ("num", "Rp 45.000"), ("num", "2"),
                                   ("num", "Rp 90.000")],
                                  ["Kangkung", "1 ikat", ("num", "Rp 8.000"), ("num", "2"),
                                   ("num", "Rp 16.000")]], row_h=44)
    ly += 44 + 92

    ly = A.section(d, lx, ly, lw, "Ringkasan")
    for lab, val, strong in [("Subtotal", "Rp 106.000", False), ("Ongkir Cilandak", "Rp 15.000", False),
                             ("Potongan gratis ongkir", "−Rp 15.000", False),
                             ("Total dibayar", "Rp 106.000", True)]:
        d.text("s/l", lx, ly, lab, "lead" if strong else "body",
               color=T.INK if strong else T.INK_2)
        d.text("s/v", lx, ly, val, "lead" if strong else "body",
               width=lw, align="right")
        ly += 28
    ly += 20

    ly = A.section(d, lx, ly, lw, "Riwayat status", "pelaku ikut dicatat")
    for t, ev, who in [("14.02", "Dibuat oleh pembeli", "system"),
                       ("14.04", "Pembayaran diterima (QRIS)", "system"),
                       ]:
        d.note("h/t", lx, ly + 8, t, color=T.INK_OUT, size=8.5)
        d.text("h/e", lx + 62, ly, ev, "body-s")
        d.note("h/w", lx + lw, ly + 8, who, color=T.INK_OUT, size=8.5, align="right")
        d.hline(lx + 62, ly + 24, lw - 62)
        ly += 30

    # right column
    ry = y
    px, py, pw = A.panel(d, rx, ry, rw, 200, "Pengiriman")
    d.text("p/n", px, py, "Dewi Lestari · 08123456789", "lead")
    d.text("p/a", px, py + 24, "Jl. Melati No. 12, RT 04/RW 02, Cilandak, "
           "Jakarta Selatan 12430", "body-s", color=T.INK_2, width=pw)
    d.note("p/c", px, py + 76, "catatan: pagar hijau, titip ke penjaga", color=T.INK_OUT, size=8)
    d.hline(px, py + 94, pw)
    for i, (lab, val) in enumerate([("Tanggal kirim", "Hari ini"), ("Zona", "Jakarta Selatan"),
                                    ("Kurir", "Diantar manual")]):
        d.note("p/l", px, py + 112 + i * 22, lab, color=T.INK_OUT, size=8.5)
        d.text("p/v", px, py + 104 + i * 22, val, "body-s", width=pw, align="right")

    ry += 220
    px, py, pw = A.panel(d, rx, ry, rw, 190, "Pembayaran")
    for i, (lab, val) in enumerate([("Metode", "QRIS"), ("Dibayar", "19 Nov, 14.04"),
                                    ("Midtrans", "8f21…c4a7")]):
        d.note("q/l", px, py + 8 + i * 22, lab, color=T.INK_OUT, size=8.5)
        d.text("q/v", px, py + i * 22, val, "body-s", width=pw, align="right")
    A.btn(d, px, py + 84, pw, 34, "Periksa status ke Midtrans", "secondary")
    A.btn(d, px, py + 126, pw, 34, "Catat pengembalian dana", "secondary")

    ry += 210
    A.callout(d, rx, ry, rw, "Pembatalan mengembalikan stok",
              "Pesanan yang sudah selesai tidak punya tombol ini.")
    close()


# ══════════════════════════════════════════════════ Batalkan (modal) ═════
def s_batalkan():
    _, close = screen("a05-batalkan", AW, 812)
    x, y, w = A.shell(d, "Pesanan SA-261119-4821", "pesanan")
    lw = 596
    A.section(d, x, y, lw, "Barang yang disiapkan")
    cols = [("BARANG", 220, "left"), ("VARIAN", 100, "left"), ("JUMLAH", 100, "right"),
            ("SUBTOTAL", 176, "right")]
    A.table(d, x, y + 44, lw, cols, [["Ikan Nila", "1 kg", ("num", "2"), ("num", "Rp 90.000")],
                                     ["Kangkung", "1 ikat", ("num", "2"), ("num", "Rp 16.000")]],
            row_h=44)
    px, py, pw = A.panel(d, x + lw + 28, y, w - lw - 28, 150, "Pengiriman")
    d.text("p/n", px, py, "Dewi Lestari · 08123456789", "lead")
    d.text("p/a", px, py + 24, "Jl. Melati No. 12, RT 04/RW 02, Cilandak, "
           "Jakarta Selatan 12430", "body-s", color=T.INK_2, width=pw)

    d.rect("scrim", 0, 0, AW, 812, fill=T.INK, opacity=0.45)
    mx, my, mw = (AW - 560) / 2, 210, 560
    d.rect("modal", mx, my, mw, 392, fill=T.PAPER, stroke=T.INK, strokeWeight=2)
    d.text("m/t", mx + 32, my + 28, "Batalkan SA-261119-4821?", "title")
    d.para("m/p", mx + 32, my + 76, "Stok kedua barang kembali ke variannya. Pesanan yang "
           "sudah dibatalkan tidak bisa dihidupkan lagi.", "body", mw - 64, color=T.INK_2)
    d.note("m/l", mx + 32, my + 152, "alasan pembatalan · wajib", color=T.INK_2, size=8.5, bold=True)
    d.rect("m/box", mx + 32, my + 168, mw - 64, 92, fill=T.PAPER, stroke=T.RULE, strokeWeight=1)
    d.text("m/ph", mx + 44, my + 180, "Contoh: ikan nila tidak dapat dari supplier pagi ini",
           "body-s", color=T.INK_OUT)
    d.note("m/h", mx + 32, my + 278, "alasan ikut tercatat di riwayat status", color=T.INK_OUT, size=8)
    A.btn(d, mx + mw - 328, my + 312, 140, 44, "Tidak jadi", "secondary")
    A.btn(d, mx + mw - 176, my + 312, 144, 44, "Batalkan", "primary")
    close()


# ══════════════════════════════════════════════════ Produk ═══════════════
def s_produk():
    _, close = screen("a06-produk", AW, 880)
    x, y, w = A.shell(d, "Produk", "produk", "10 produk · 9 aktif")
    d.rect("search", x, y, 300, 42, fill=T.PAPER, stroke=T.RULE, strokeWeight=1)
    d.icon("search", x + 22, y + 21, 15, T.INK_OUT)
    d.text("search/p", x + 40, y + 11, "Cari nama produk", "body-s", color=T.INK_OUT)
    d.rect("cat", x + 316, y, 190, 42, fill=T.PAPER, stroke=T.RULE, strokeWeight=1)
    d.text("cat/v", x + 328, y + 11, "Semua kategori", "body-s")
    d.icon("chevron-down", x + 494, y + 21, 14, T.INK_2)
    A.pills(d, x + 524, y + 2, ["Aktif", "Nonaktif"], "Aktif")
    A.btn(d, x + w - 148, y, 148, 42, "Tambah produk", "primary")
    y += 60

    cols = [("", 54, "left"), ("NAMA", 230, "left"), ("KATEGORI", 130, "left"),
            ("VARIAN", 80, "right"), ("HARGA TERENDAH", 170, "right"), ("STOK", 80, "right"),
            ("STATUS", 130, "left"), ("", 110, "right")]
    data = [("nila", "Ikan Nila", "Ikan", "3", "Rp 45.000 / kg", "41", "aktif", "paid"),
            ("gurame", "Ikan Gurame", "Ikan", "3", "Rp 62.000 / kg", "22", "aktif", "paid"),
            ("kembung", "Ikan Kembung", "Ikan", "2", "Rp 38.000 / kg", "0", "aktif", "paid"),
            ("udang", "Udang Segar", "Ikan", "2", "Rp 95.000 / kg", "6", "aktif", "paid"),
            ("lele", "Ikan Lele", "Ikan", "2", "Rp 32.000 / kg", "30", "aktif", "paid"),
            ("kangkung", "Kangkung", "Sayur", "1", "Rp 8.000 / ikat", "48", "aktif", "paid"),
            ("bayam", "Bayam", "Sayur", "1", "Rp 7.500 / ikat", "35", "aktif", "paid"),
            ("cabai", "Cabai Merah Keriting", "Bumbu dapur", "2", "Rp 42.000 / kg", "12", "aktif", "paid"),
            ("bawang", "Bawang Merah", "Bumbu dapur", "1", "Rp 38.000 / kg", "0", "nonaktif", "dead"),
            ("telur", "Telur Ayam", "Telur", "2", "Rp 28.000 / kg", "25", "aktif", "paid")]
    rows = []
    for slug, name, cat, var, price, stock, st, tone in data:
        rows.append([("thumb", os.path.join(F.PHOTO_DIR, slug + ".jpg")),
                     ("strong", name), cat, ("num", var), ("num", price), ("num", stock),
                     ("stamp", st, tone), ("btn", "Ubah")])
    y = A.table(d, x, y, sum(c[1] for c in cols), cols, rows, row_h=48)

    d.note("pager", x, y + 20, "menampilkan 1–10 dari 10 produk", color=T.INK_OUT, size=8.5)
    d.note("hint", x + w, y + 20, "stok = jumlah semua varian", color=T.INK_OUT, size=8.5,
           align="right")
    close()


# ══════════════════════════════════════════════════ Form produk ══════════
def s_form_produk():
    _, close = screen("a07-form-produk", AW, 936)
    x, y, w = A.shell(d, "Ubah produk · Ikan Nila", "produk")
    A.btn(d, x + w - 208, y - 6, 96, 40, "Batal", "secondary")
    A.btn(d, x + w - 100, y - 6, 100, 40, "Simpan", "primary")
    y += 52

    lw, rw = 596, w - 596 - 28
    lx, rx = x, x + lw + 28

    ly = A.section(d, lx, y, lw, "Produk")
    ly = A.field(d, lx, ly, 282, "Nama produk", value="Ikan Nila")
    A.field(d, lx + 314, ly - 60, 282, "Kategori", value="Ikan", select=True)
    ly += 22
    ly = A.field(d, lx, ly, 282, "Satuan", value="kg",
                 hint="tampil di toko sebagai “per kg”")
    A.field(d, lx + 314, ly - 84, 282, "Alamat halaman", value="ikan-nila", disabled=True,
            hint="dibuat otomatis dari nama")
    ly += 14
    d.note("desc/l", lx, ly + 6, "deskripsi", color=T.INK_2, size=8.5, bold=True)
    d.rect("desc", lx, ly + 18, lw, 84, fill=T.PAPER, stroke=T.RULE, strokeWeight=1)
    d.para("desc/t", lx + 12, ly + 32, "Ikan nila segar dari kolam sendiri, dibersihkan dan "
           "disiangi sesuai permintaan. Dikirim pagi hari dengan es.", "body-s", lw - 24)
    ly += 116
    switch(d, lx, ly, True, "Tampil di toko")
    ly += 46

    ly = A.section(d, lx, ly, lw, "Varian ukuran", "harga & stok per varian")
    A.btn(d, lx + lw - 120, ly - 38, 120, 32, "Tambah varian", "secondary")
    cols = [("LABEL", 150, "left"), ("HARGA", 150, "left"), ("STOK", 110, "left"),
            ("SKU", 186, "left")]
    rows = []
    for lab, price, stock, sku in [("1 kg", "45.000", "12", "NILA-1"),
                                   ("2 kg", "88.000", "5", "NILA-2"),
                                   ("3 kg", "130.000", "0", "NILA-3")]:
        rows.append([lab, price, ("alert" if stock == "0" else "num2", stock), sku])
    ly = A.table(d, lx, ly, lw, cols, rows, row_h=54)
    d.note("var/h", lx, ly + 18, "satu dimensi saja: ukuran atau berat", color=T.INK_OUT, size=8.5)

    # right rail
    px, py, pw = A.panel(d, rx, y, rw, 210, "Foto produk", "maks 4")
    for i, slug in enumerate(["nila", "nila", "nila"]):
        d.img("ph", os.path.join(F.PHOTO_DIR, slug + ".jpg"), px + i * 84, py, 76, 76)
        d.rect("ph/r", px + i * 84, py, 76, 76, fill="none",
               stroke=T.GREEN if i == 0 else T.RULE, strokeWeight=2 if i == 0 else 1)
        if i == 0:
            d.note("ph/main", px, py + 88, "utama", color=T.GREEN, bold=True, size=8)
    d.rect("ph/add", px + 252, py, 76, 76, fill=T.PAPER, stroke=T.RULE, strokeWeight=1)
    d.icon("plus", px + 290, py + 38, 20, T.INK_OUT)
    d.note("ph/h", px, py + 92, "jpeg · png · webp · maks 2 mb", color=T.INK_OUT, size=8)
    A.btn(d, px, py + 112, pw, 34, "Unggah foto", "secondary")

    ry = y + 232
    px, py, pw = A.panel(d, rx, ry, rw, 168, "Yang terjadi saat disimpan")
    for i, line in enumerate(["Harga baru berlaku untuk pesanan berikutnya.",
                              "Pesanan lama menyimpan salinan nama, varian, dan harga.",
                              "Menonaktifkan produk menyembunyikan dari toko tanpa menghapus riwayat."]):
        d.text("n/l", px, py + i * 38, line, "body-s", color=T.INK_2, width=pw)

    ry += 190
    A.callout(d, rx, ry, rw, "Periksa harga sebelum simpan",
              "Tidak ada riwayat perubahan harga di MVP.", "accent")
    close()


# ══════════════════════════════════════════════════ Kategori ═════════════
def s_kategori():
    _, close = screen("a08-kategori", AW, 700)
    x, y, w = A.shell(d, "Kategori", "kategori", "4 kategori · urutan menentukan beranda")
    lw, rw = 596, w - 596 - 28
    A.section(d, x, y, lw, "Kategori di toko")
    cols = [("NAMA", 180, "left"), ("SLUG", 170, "left"), ("PRODUK", 90, "right"),
            ("URUTAN", 80, "right"), ("STATUS", 76, "left")]
    rows = [["Ikan", "ikan", ("num", "5"), ("num", "1"), ("stamp", "aktif", "paid")],
            ["Sayur", "sayur", ("num", "2"), ("num", "2"), ("stamp", "aktif", "paid")],
            ["Bumbu dapur", "bumbu-dapur", ("num", "2"), ("num", "3"), ("stamp", "aktif", "paid")],
            ["Telur", "telur", ("num", "1"), ("num", "4"), ("stamp", "aktif", "paid")]]
    ty = A.table(d, x, y + 44, lw, cols, rows, row_h=52)
    d.note("h", x, ty + 18, "urutan diubah dengan angka, bukan menggeser baris",
           color=T.INK_OUT, size=8.5)

    px, py, pw = A.panel(d, x + lw + 28, y, rw, 420, "Tambah kategori")
    py = A.field(d, px, py, pw, "Nama", placeholder="Buah") + 8
    py = A.field(d, px, py, pw, "Deskripsi", placeholder="Buah potong dan buah utuh") + 8
    d.note("f/l", px, py + 6, "foto kategori", color=T.INK_2, size=8.5, bold=True)
    A.btn(d, px, py + 18, pw, 40, "Pilih foto", "secondary", icon="camera")
    py += 76
    switch(d, px, py, True, "Tampil di toko")
    py += 52
    A.btn(d, px, py, pw, 44, "Simpan kategori", "primary")
    close()


# ══════════════════════════════════════════════════ Zona ongkir ══════════
def s_zona():
    _, close = screen("a09-zona", AW, 720)
    x, y, w = A.shell(d, "Zona ongkir", "zona", "tarif per kecamatan · fase 2")
    lw, rw = 596, w - 596 - 28
    A.section(d, x, y, lw, "Zona", "4 aktif")
    A.btn(d, x + lw - 116, y + 4, 116, 34, "Tambah zona", "primary")
    cols = [("ZONA", 210, "left"), ("TARIF", 130, "right"), ("KECAMATAN", 110, "right"),
            ("STATUS", 146, "left")]
    rows = [["Jakarta Selatan", ("num", "Rp 15.000"), ("num", "8"), ("stamp", "aktif", "paid")],
            ["Jakarta Pusat", ("num", "Rp 18.000"), ("num", "8"), ("stamp", "aktif", "paid")],
            ["Depok", ("num", "Rp 22.000"), ("num", "6"), ("stamp", "aktif", "paid")],
            ["Tangerang Selatan", ("num", "Rp 25.000"), ("num", "7"), ("stamp", "aktif", "paid")],
            ["Bogor", ("num", "Rp 30.000"), ("num", "4"), ("stamp", "nonaktif", "dead")]]
    ty = A.table(d, x, y + 44, lw, cols, rows, row_h=52, pick=0)
    d.note("h", x, ty + 18, "satu kecamatan hanya boleh ada di satu zona aktif",
           color=T.INK_OUT, size=8.5)

    px, py, pw = A.panel(d, x + lw + 28, y, rw, 470, "Jakarta Selatan")
    d.note("k/t", px, py - 22, "Rp 15.000 · 8 kecamatan", color=T.INK_2, size=8.5, orig=True)
    d.note("k/l", px, py, "kecamatan", color=T.INK_2, size=8.5, bold=True)
    py += 16
    districts = ["Cilandak", "Pasar Minggu", "Kebayoran Baru", "Mampang Prapatan",
                 "Tebet", "Setiabudi", "Pancoran", "Jagakarsa"]
    for i, name in enumerate(districts):
        cx = px + (i % 2) * (pw / 2)
        cy = py + (i // 2) * 34
        d.text("k/i", cx, cy, name, "body-s")
        d.hline(cx, cy + 24, pw / 2 - 16)
    py += 4 * 34 + 12
    py = A.field(d, px, py, pw, "Tambah kecamatan", placeholder="Nama kecamatan",
                 hint="kecamatan yang sudah dipakai zona lain ditolak") + 10
    A.btn(d, px, py, 120, 36, "Simpan", "secondary")
    d.note("off", px + pw, py + 14, "nonaktifkan zona", color=T.STAMP, size=8.5, align="right")
    close()


# ══════════════════════════════════════════════════ Pengaturan ═══════════
def s_pengaturan():
    _, close = screen("a10-pengaturan", AW, 800)
    x, y, w = A.shell(d, "Pengaturan toko", "pengaturan", "berlaku untuk pesanan berikutnya")
    lw, rw = 596, w - 596 - 28
    ly = A.section(d, x, y, lw, "Identitas toko")
    ly = A.field(d, x, ly, 282, "Nama toko", value="Segar Anugerah")
    A.field(d, x + 314, ly - 60, 282, "Nomor WhatsApp", value="08123456789")
    ly += 22
    d.note("al/l", x, ly + 6, "alamat toko", color=T.INK_2, size=8.5, bold=True)
    d.rect("al", x, ly + 18, lw, 64, fill=T.PAPER, stroke=T.RULE, strokeWeight=1)
    d.text("al/t", x + 12, ly + 30, "Jl. Melati No. 12, Cilandak, Jakarta Selatan 12430", "body-s")
    ly += 108

    ly = A.section(d, x, ly, lw, "Pesanan")
    ly = A.field(d, x, ly, 282, "Jam cut-off pengiriman", value="16.00 WIB", select=True,
                 hint="sebelum jam ini dikirim hari itu")
    A.field(d, x + 314, ly - 84, 282, "Masa berlaku pembayaran", value="30 menit", disabled=True,
            hint="disamakan dengan Midtrans")

    px, py, pw = A.panel(d, x + lw + 28, y, rw, 300, "Gratis ongkir")
    switch(d, px, py, True, "aktif")
    py += 44
    py = A.field(d, px, py, pw, "Berlaku sampai", value="31 Desember 2026",
                 hint="setelah tanggal ini ongkir kembali normal") + 10
    py = A.field(d, px, py, pw, "Minimal belanja", value="Rp 0",
                 hint="0 berarti tanpa syarat minimal") + 12
    d.hline(px, py, pw)
    d.text("g/n", px, py + 14, "Potongan dicatat sebagai baris tersendiri di pesanan, "
           "bukan ongkir nol.", "body-s", color=T.INK_2, width=pw)

    A.callout(d, x + lw + 28, y + 322, rw, "Pengaturan tidak mengubah pesanan lama",
              "Pesanan yang sudah dibuat menyimpan tarif dan potongannya sendiri.")

    A.btn(d, x, 730, 180, 44, "Simpan pengaturan", "primary")
    A.btn(d, x + 196, 730, 100, 44, "Batal", "secondary")
    close()


# ══════════════════════════════════════════════════ Pengguna admin ═══════
def s_pengguna():
    _, close = screen("a11-pengguna", AW, 660)
    x, y, w = A.shell(d, "Pengguna admin", "pengguna", "3 akun · wewenang sama")
    lw, rw = 596, w - 596 - 28
    A.section(d, x, y, lw, "Tiga akun dengan wewenang sama")
    A.btn(d, x + lw - 132, y + 4, 132, 34, "Tambah pengguna", "primary")
    cols = [("NAMA", 190, "left"), ("NOMOR", 160, "left"), ("STATUS", 110, "left"),
            ("TERAKHIR MASUK", 136, "left")]
    rows = [[("strong", "Rina Kusuma"), "08123456789", ("stamp", "aktif", "paid"),
             ("muted", "Hari ini, 08.12")],
            [("strong", "Bagus Prakoso"), "08129876543", ("stamp", "aktif", "paid"),
             ("muted", "Kemarin, 17.40")],
            [("strong", "Sari Wulandari"), "08135551234", ("stamp", "nonaktif", "dead"),
             ("muted", "2 Nov, 09.05")]]
    ty = A.table(d, x, y + 44, lw, cols, rows, row_h=54)
    d.note("h", x, ty + 18, "akun aktif terakhir tidak bisa dinonaktifkan · dijaga di server",
           color=T.INK_OUT, size=8.5)

    px, py, pw = A.panel(d, x + lw + 28, y, rw, 320, "Tambah pengguna")
    py = A.field(d, px, py, pw, "Nama", placeholder="Nama lengkap") + 8
    py = A.field(d, px, py, pw, "Nomor WhatsApp", placeholder="08xxxxxxxxxx") + 8
    py = A.field(d, px, py, pw, "Sandi awal", value="••••••••",
                 hint="minimal 8 karakter, bisa diganti setelah masuk") + 12
    A.btn(d, px, py, pw, 44, "Buat akun", "primary")
    A.callout(d, x + lw + 28, y + 342, rw, "Tidak ada peran berbeda",
              "Kalau peran dibutuhkan nanti, kolomnya ditambahkan sebelum Fase 5.")
    close()


# ══════════════════════════════════════════════════ Laporan ══════════════
def s_laporan():
    _, close = screen("a12-laporan", AW, 940)
    x, y, w = A.shell(d, "Laporan", "laporan", "11–19 november 2026")
    A.pills(d, x, y, ["Hari ini", "7 hari", "Bulan ini", "Pilih rentang"], "Bulan ini")
    d.note("range", x + 520, y + 12, "11–19 november 2026", color=T.INK_2, size=9)
    y += 52
    y = A.metrics(d, x, y, w, [("OMZET RENTANG INI", "Rp 30.850.000", "51 pesanan selesai"),
                               ("RATA-RATA PER HARI", "Rp 3.428.000", "9 hari, pesanan selesai"),
                               ("TIDAK DIHITUNG", "4 pesanan", "batal & kedaluwarsa")])
    y += 16
    y = A.section(d, x, y, w, "Omzet per hari", "pesanan selesai saja")
    rows = [("11 Nov", 3100, "Rp 3.100.000"), ("12 Nov", 2450, "Rp 2.450.000"),
            ("13 Nov", 3980, "Rp 3.980.000"), ("14 Nov", 1870, "Rp 1.870.000"),
            ("15 Nov", 4620, "Rp 4.620.000"), ("16 Nov", 2930, "Rp 2.930.000"),
            ("17 Nov", 3640, "Rp 3.640.000"), ("18 Nov", 4010, "Rp 4.010.000"),
            ("19 Nov", 4250, "Rp 4.250.000")]
    y = bars(d, x, y + 4, w - 40, rows, maxv=4620)
    d.note("h", x, y + 10, "batal dan kedaluwarsa tidak dihitung omzet", color=T.INK_OUT, size=8.5)
    y += 40

    y = A.section(d, x, y, w, "Lima produk terlaris", "diukur dari jumlah unit")
    cols = [("PRODUK", 420, "left"), ("TERJUAL", 120, "right"), ("OMZET", 160, "right")]
    rows = [["Kangkung · 1 ikat", ("num", "54"), ("num", "Rp 432.000")],
            ["Bayam · 1 ikat", ("num", "40"), ("num", "Rp 300.000")],
            ["Ikan Nila · 1 kg", ("num", "32"), ("num", "Rp 1.440.000")],
            ["Ikan Kembung · 1 kg", ("num", "21"), ("num", "Rp 798.000")],
            ["Ikan Gurame · 1 kg", ("num", "18"), ("num", "Rp 1.116.000")]]
    A.table(d, x, y, sum(c[1] for c in cols), cols, rows, row_h=46)
    close()


def main():
    d.set_default_parent(None)
    _cur["x"], _cur["y"] = 0, 0
    builders = [s_masuk, s_dashboard, s_pesanan, s_detail_pesanan, s_batalkan,
                s_produk, s_form_produk, s_kategori, s_zona, s_pengaturan,
                s_pengguna, s_laporan, s_pesanan_1024, s_pesanan_ponsel]
    widths = [AW, AW, AW, AW, AW, AW, AW, AW, AW, AW, AW, AW, 1024, 390]
    for fn in builders:
        fn()

    path = os.path.join(DIR, "scripts", "admin.json")
    ok = d.run(path, os.path.join(DIR, "out", "admin.figcraft"))
    print("run ok" if ok else "run failed", len(d.cmds), "steps")
    for name, x, y, w, h in SCREENS:
        print(f"  {name:24s} {w}x{h} at ({x},{y})")


if __name__ == "__main__":
    main()
