"""build_store — the buyer-facing board (23 screens, 390px).

Run:  python3 build_store.py
Writes scripts/store.json, out/store.figcraft, previews/store/*.png
"""
import os, subprocess
import tokens as T
import figlib as F
from figlib import photo
import comps as C
from comps import G, CW, W

DIR = os.path.dirname(os.path.abspath(__file__))
d = F.Doc()

PRODUCTS = [
    ("01", "nila",    "Ikan Nila",    "IKAN · PER KG · STOK 12",  "Rp 45.000", "add",  False, None),
    ("02", "gurame",  "Ikan Gurame",  "IKAN · PER KG · STOK 5",   "Rp 62.000", "add",  False, None),
    ("03", "kembung", "Ikan Kembung", "IKAN · PER KG",            "Rp 38.000", "add",  True,  "HABIS"),
    ("04", "udang",   "Udang Segar",  "IKAN · PER KG · STOK 6",   "Rp 95.000", "add",  False, None),
    ("05", "lele",    "Ikan Lele",    "IKAN · PER KG · STOK 30",  "Rp 32.000", "add",  False, None),
    ("06", "mas",     "Ikan Mas",     "IKAN · PER KG · STOK 18",  "Rp 40.000", "add",  False, None),
]

SCREENS = []           # (name, x, y, w, h)
_cur = {}


def screen(name, h, fill=T.PAPER):
    """Open a screen frame; returns (frame, close())."""
    x, y = _cur["x"], _cur["y"]
    s = d.frame(name, x, y, W, h, fill=fill, clip=True)
    prev = d.default_parent
    d.set_default_parent(s)
    SCREENS.append((name, x, y, W, h))

    def close():
        d.set_default_parent(prev)
        _cur["y"] += h + 120
    return s, close


def search_box(y, placeholder="Cari ikan atau sayur", value=None):
    d.rect("search", G, y, CW, 44, fill=T.PAPER, stroke=T.RULE, strokeWeight=1)
    d.icon("search", G + 22, y + 22, 16, T.INK_OUT)
    if value:
        d.text("search/v", G + 42, y + 12, value, "body")
    else:
        d.text("search/p", G + 42, y + 12, placeholder, "body", color=T.INK_OUT)
    return y + 44


def filter_tabs(y, items, active, w=CW):
    x = G
    d.hline(G, y + 34, w)
    for it in items:
        on = it == active
        col = T.GREEN if on else T.INK_2
        d.note("filter/" + it, x, y + 16, it, color=col, bold=on, size=9.5)
        tw = len(it) * 7.4
        if on:
            d.rect("filter/on", x - 2, y + 32, tw + 6, 2, fill=T.GREEN)
        x += tw + 22
    return y + 36


def money_block(y, rows, total_label="Total", total="Rp 106.000", rule_top=True):
    if rule_top:
        d.hline(G, y, CW)
        y += 12
    for lab, val, kind in rows:
        if kind == "strong":
            d.text("m/l", G, y + 4, lab, "total")
            d.text("m/v", G, y + 4, val, "total", width=CW, align="right")
            y += 34
        else:
            d.text("m/l", G, y + 3, lab, "body", color=T.INK_2)
            d.text("m/v", G, y + 3, val, "body",
                   color=T.INK_OUT if kind == "muted" else T.INK,
                   width=CW, align="right")
            y += 24
    return y


# ══════════════════════════════════════════════════ 01 Beranda ═══════════
def s_beranda():
    _, close = screen("01-beranda", 1036)
    C.band(d, "toko ikan & sayur · cilandak", "Segar Anugerah",
           "Ikan & sayur segar · antar hari ini", cart=4)
    y = C.notice(d, 96, "Gratis ongkir", "semua kecamatan · sampai 31 des 2026")

    y = C.section(d, 168, "Kategori", "04")
    tiles = [("Ikan", "pasar", "5 produk"), ("Sayur", "toko", "2 produk"),
             ("Bumbu dapur", "dapur", "2 produk"), ("Telur", "telur", "1 produk")]
    for i, (name, slug, count) in enumerate(tiles):
        tx = G + (i % 2) * 183
        ty = y + (i // 2) * 164
        photo(d, "cat/img", slug, tx, ty, 167, 104)
        d.text("cat/name", tx, ty + 120, name, "subhead")
        d.note("cat/count", tx + 167, ty + 124, count, color=T.INK_OUT, size=8.5, align="right")
        d.hline(tx, ty + 148, 167)

    y += 2 * 164 + 6
    y = C.section(d, y, "Barang hari ini", "HARGA HARI INI")
    for no, slug, name, meta, price, action, dim, st in PRODUCTS[:4]:
        y = C.ledger_row(d, y, no, slug, name, meta, price, action, dim, st)

    # footer
    fy = 872
    d.ink_rule(G, fy, CW)
    d.text("foot/name", G, fy + 16, "Segar Anugerah", "subhead")
    d.para("foot/a", G, fy + 44, "Jl. Melati No. 12, Cilandak, Jakarta Selatan 12430 · "
           "WhatsApp 0812-3456-789", "body-s", CW, color=T.INK_2)
    d.note("foot/b", G, fy + 92, "diantar setiap hari · pesan sebelum 16.00", size=9)

    # balance bar
    by = 924
    d.rect("balance", 0, by, W, 88, fill=T.GREEN)
    d.note("balance/l", G, by + 24, "keranjang · 2 barang", color="#CFE3D8", size=9)
    d.text("balance/v", G, by + 38, "Rp 106.000", "total", color=T.ON_BAND)
    C.btn(d, 210, by + 20, 160, 48, "Ke checkout", "primary")
    d.rect("balance/btn", 210, by + 20, 160, 48, fill=T.ON_BAND)
    d.text("balance/btn/t", 210, by + 34, "Ke checkout", "lead", color=T.GREEN,
           width=160, align="center")
    C.tabbar(d, 1012, "Beranda")
    close()


# ══════════════════════════════════════════════════ 02 Daftar produk ═════
def s_produk():
    _, close = screen("02-produk", 700)
    C.appbar(d, "Produk", icons=("shopping-basket",), cart=4)
    y = search_box(72, value=None)
    y = filter_tabs(y + 8, ["Semua", "Ikan", "Sayur", "Bumbu", "Telur"], "Ikan")
    d.note("count", G, y + 22, "6 produk", color=T.INK_2, size=9.5)
    d.note("sort", W - G, y + 22, "urut: urutan toko", color=T.INK_OUT, size=9, align="right")
    y += 40
    for no, slug, name, meta, price, action, dim, st in PRODUCTS:
        y = C.ledger_row(d, y, no, slug, name, meta, price, action, dim, st)
    C.tabbar(d, 638, "Produk")
    close()


# ══════════════════════════════════════════════════ 03 Detail produk ═════
def s_detail():
    _, close = screen("03-detail-produk", 1054)
    C.appbar(d, "Ikan Nila", icons=("shopping-basket",), cart=4)
    photo(d, "hero", "nila", G, 76, CW, 262)
    d.rect("hero/rule", G, 338, CW, 1, fill=T.RULE)

    ty = 352
    for i, slug in enumerate(["nila", "nila", "nila", "nila"]):
        tx = G + i * 62
        photo(d, "thumb", slug, tx, ty, 54, 54)
        d.rect("thumb/rule", tx, ty, 54, 54, fill="none",
               stroke=T.GREEN if i == 0 else T.RULE, strokeWeight=2 if i == 0 else 1)

    d.text("p/title", G, 430, "Ikan Nila", "headline")
    d.note("p/meta", G, 472, "ikan · per kg · stok 12", size=9.5)
    d.text("p/price", G, 488, "Rp 45.000", "price-lg")

    y = C.section(d, 548, "Pilih ukuran", "3 ukuran")
    variants = [("1 kg", "Rp 45.000 · stok 12", True, None),
                ("2 kg", "Rp 88.000 · stok 5", False, None),
                ("3 kg", "Rp 130.000 · stok 0", False, "HABIS")]
    for lab, sub, on, st in variants:
        d.rect("var", G, y, CW, 58, fill=T.GREEN_WASH if on else T.PAPER,
               stroke=T.GREEN if on else T.RULE, strokeWeight=2 if on else 1)
        d.rect("var/box", G + 16, y + 20, 16, 16, fill=T.PAPER,
               stroke=T.GREEN if on else T.INK_OUT, strokeWeight=1.5)
        if on:
            d.rect("var/dot", G + 20, y + 24, 8, 8, fill=T.GREEN)
        d.text("var/t", G + 46, y + 12, lab, "lead")
        d.note("var/s", G + 46, y + 34, sub, color=T.INK_2, size=9)
        if st:
            C.stamp(d, W - G - 64, y + 20, st, color=T.INK_OUT, rot=-3, size=8.5)
        y += 66

    # quantity
    y += 10
    d.hline(G, y, CW)
    y += 16
    d.text("qty/l", G, y + 8, "Jumlah", "lead")
    C.qty_ctrl(d, W - G - 104, y, 1)
    y += 52

    y = C.section(d, y, "Deskripsi")
    d.para("desc", G, y + 2, "Ikan nila segar dari kolam sendiri, dibersihkan dan "
           "disiangi sesuai permintaan. Dikirim pagi hari dengan es.", "body", CW)
    d.note("desc/note", G, y + 80, "ditimbang ulang sebelum dikirim", color=T.INK_OUT, size=8.5)
    close()


# ══════════════════════════════════════════════════ 04 Keranjang ═════════
def s_keranjang():
    _, close = screen("04-keranjang", 560)
    C.appbar(d, "Keranjang", icons=("shopping-basket",), cart=4)
    d.note("cart/count", G, 80, "2 baris · 4 barang", size=9)
    y = 100

    rows = [("nila", "Ikan Nila", "1 kg · Rp 45.000", "Rp 90.000"),
            ("kangkung", "Kangkung", "1 ikat · Rp 8.000", "Rp 16.000")]
    for slug, name, meta, price in rows:
        photo(d, "line/img", slug, G, y + 6, 56, 56)
        d.text("line/name", G + 72, y + 6, name, "lead")
        d.note("line/meta", G + 72, y + 28, meta, size=9, orig=True)
        C.qty_ctrl(d, G + 72, y + 40, 2)
        d.text("line/price", W - G - 90, y + 6, price, "price", width=90, align="right")
        d.note("line/del", W - G, y + 34, "hapus", color=T.INK_OUT, size=8.5, align="right")
        y += 76
        d.hline(G, y, CW)

    y += 20
    y = C.section(d, y, "Ringkasan")
    y = money_block(y + 8, [("Subtotal", "Rp 106.000", "strong"),
                            ("Ongkir", "dihitung di checkout", "muted")], rule_top=False)
    d.note("cart/hint", G, y + 18, "harga diperiksa ulang saat checkout", size=8.5)
    C.action_bar(d, 484, "Lanjut ke checkout")
    close()


# ══════════════════════════════════════════════════ 05 Checkout alamat ═══
def s_checkout_alamat():
    _, close = screen("05-checkout-alamat", 1004)
    C.appbar(d, "Checkout", icons=())
    d.note("step", G, 80, "langkah 1 dari 2 · alamat & pengiriman", size=9)

    y = C.section(d, 100, "Alamat pengiriman")
    d.note("addr/add", W - G, 126, "+ tambah", color=T.GREEN, bold=True, size=9, align="right")
    y = C.choice_row(d, G, y + 2, CW, "Rumah", ["Dewi Lestari · 08123456789",
                                                 "Jl. Melati No. 12, RT 04/RW 02,",
                                                 "Cilandak, Jakarta Selatan 12430"], True, tag=None)
    y += 12
    y = C.choice_row(d, G, y, CW, "Restoran", ["Dewi Lestari · 08123456789",
                                               "Jl. Raya Pasar Minggu No. 8,",
                                               "Pasar Minggu, Jakarta Selatan 12520"], False)

    y = C.section(d, y + 28, "Kecamatan kirim")
    d.rect("select", G, y, CW, 44, fill=T.PAPER, stroke=T.RULE, strokeWeight=1)
    d.text("select/v", G + 12, y + 12, "Cilandak · Jakarta Selatan", "body")
    d.icon("chevron-down", W - G - 20, y + 22, 16, T.INK_2)
    d.note("select/hint", G, y + 62, "kecamatan menentukan zona & tarif ongkir", size=8.5)
    y += 80

    y = C.section(d, y, "Catatan untuk kurir")
    d.rect("note/box", G, y, CW, 72, fill=T.PAPER, stroke=T.RULE, strokeWeight=1)
    d.text("note/ph", G + 12, y + 12, "Contoh: pagar hijau, titip ke penjaga", "body",
           color=T.INK_OUT)
    d.note("note/opt", G + 12, y + 62, "opsional", color=T.INK_OUT, size=8.5)
    y += 92

    y = C.section(d, y, "Ringkasan")
    y = money_block(y + 6, [("Subtotal", "Rp 106.000", ""),
                            ("Ongkir Cilandak", "Rp 15.000", ""),
                            ("Potongan gratis ongkir", "−Rp 15.000", "muted"),
                            ("Total", "Rp 106.000", "strong")], rule_top=False)
    y += 22
    y = C.callout(d, G, y, CW, "Gratis ongkir aktif", 
                  "Ongkir dipotong penuh sampai 31 Desember 2026.", "accent")
    C.action_bar(d, 928, "Lanjut ke pembayaran")
    close()


# ══════════════════════════════════════════════════ 06 Checkout bayar ════
def s_checkout_bayar():
    _, close = screen("06-checkout-bayar", 1012)
    C.appbar(d, "Pembayaran", icons=())
    d.note("step", G, 80, "langkah 2 dari 2 · pembayaran", size=9)

    y = 100
    d.rect("addr", G, y, CW, 68, fill=T.PAPER, stroke=T.RULE, strokeWeight=1)
    d.text("addr/t", G + 12, y + 12, "Rumah · Cilandak", "lead")
    d.note("addr/ubah", W - G - 12, y + 20, "ubah", color=T.GREEN, bold=True, size=9, align="right")
    d.text("addr/a", G + 12, y + 34, "Jl. Melati No. 12, RT 04/RW 02, Jakarta Selatan", "body-s",
           color=T.INK_2)
    y += 88

    y = C.section(d, y, "Barang")
    for name, price in [("2 × Ikan Nila 1 kg", "Rp 90.000"), ("2 × Kangkung 1 ikat", "Rp 16.000")]:
        d.text("item/l", G, y + 2, name, "body")
        d.text("item/v", G, y + 2, price, "body", width=CW, align="right")
        y += 24

    y += 16
    y = C.section(d, y, "Total")
    y = money_block(y + 6, [("Subtotal", "Rp 106.000", ""),
                            ("Ongkir Cilandak", "Rp 15.000", ""),
                            ("Potongan gratis ongkir", "−Rp 15.000", "muted"),
                            ("Bayar", "Rp 106.000", "strong")], rule_top=False)

    y += 18
    y = C.section(d, y, "Pengiriman")
    d.text("ship/v", G, y + 2, "Dikirim hari ini, 19 November 2026.", "body")
    d.note("ship/n", G, y + 26, "pesanan setelah 16.00 dikirim besok", color=T.INK_OUT, size=8.5)
    y += 48

    y = C.section(d, y, "Metode pembayaran")
    d.text("pay/v", G, y + 2, "QRIS · e-wallet · Virtual Account", "body")
    d.note("pay/n", G, y + 26, "dipilih di halaman midtrans", color=T.INK_OUT, size=8.5)
    y += 48

    y = C.callout(d, G, y, CW, "Bayar dalam 30 menit",
                  "Stok ditahan sampai 14.32 WIB. Lewat itu pesanan kedaluwarsa dan stok dilepas.")
    C.action_bar(d, 936, "Bayar Rp 106.000")
    close()


# ══════════════════════════════════════════════════ 07 Hasil bayar ═══════
def s_hasil():
    _, close = screen("07-hasil-bayar", 660)
    C.appbar(d, "Pembayaran", back=False, icons=("x",), cart=0)
    y = 96
    d.rect("ok", 155, y, 80, 80, fill=T.GREEN)
    d.icon("check", 195, y + 40, 40, T.ON_BAND, stroke=2.5)
    d.text("ok/t", G, y + 104, "Pembayaran berhasil", "headline", width=CW, align="center")
    d.note("ok/n", W / 2, y + 148, "pesanan sa-261119-4821 sudah dibayar", color=T.INK_2,
           size=9, align="center")
    # centering notes/paras needs width; do it manually
    y += 190

    rows = [("Nomor pesanan", "SA-261119-4821"), ("Total dibayar", "Rp 106.000"),
            ("Metode", "QRIS"), ("Waktu", "19 Nov 2026, 14.32"), ("Dikirim", "Hari ini")]
    d.ink_rule(G, y, CW)
    y += 14
    for lab, val in rows:
        d.text("r/l", G, y, lab, "body", color=T.INK_2)
        d.text("r/v", G, y, val, "body", width=CW, align="right")
        y += 26
    d.hline(G, y + 6, CW)
    y += 26
    y = C.callout(d, G, y, CW, "Kurir menghubungi lebih dulu",
                  "Kurir toko menelepon 08123456789 sebelum mengantar.")
    y += 20
    C.btn(d, G, y, CW, 48, "Lihat pesanan", "primary")
    C.btn(d, G, y + 58, CW, 48, "Belanja lagi", "secondary")
    close()


# ══════════════════════════════════════════════════ 08 Masuk ═════════════
def s_masuk():
    _, close = screen("08-masuk", 520)
    C.appbar(d, "Masuk", icons=())
    y = 96
    d.text("in/t", G, y, "Masuk", "headline")
    d.para("in/p", G, y + 42, "Masuk untuk menyelesaikan pesanan dan melihat riwayat.",
           "body", CW, color=T.INK_2)
    y += 74
    y = C.field(d, G, y, CW, "Nomor WhatsApp", value="08123456789",
                hint="format 08xx, tanpa spasi atau tanda hubung") + 14
    y = C.field(d, G, y, CW, "Sandi", value="••••••••", h=44) + 10
    d.note("forgot", W - G, y + 8, "lupa sandi?", color=T.GREEN, bold=True, size=9, align="right")
    y += 26
    C.btn(d, G, y, CW, 48, "Masuk", "primary")
    y += 66
    d.hline(G, y, CW)
    y += 18
    d.text("reg/l", G, y, "Belum punya akun?", "body", color=T.INK_2)
    d.text("reg/a", G, y, "Daftar", "body", color=T.GREEN, width=CW, align="right")
    close()


# ══════════════════════════════════════════════════ 09 Daftar ════════════
def s_daftar():
    _, close = screen("09-daftar", 600)
    C.appbar(d, "Daftar akun", icons=())
    y = 96
    d.text("t", G, y, "Daftar akun", "headline")
    d.para("p", G, y + 42, "Daftar sekali, lalu pesanan dan alamat tersimpan di akun Anda.",
           "body", CW, color=T.INK_2)
    y += 74
    y = C.field(d, G, y, CW, "Nama", value="Dewi Lestari") + 14
    y = C.field(d, G, y, CW, "Nomor WhatsApp", value="08123456789",
                hint="nomor ini dipakai untuk masuk") + 14
    y = C.field(d, G, y, CW, "Sandi", value="••••••••", hint="minimal 8 karakter") + 14
    y += 4
    d.note("priv", G, y + 6, "nama, nomor, dan alamat hanya dipakai untuk mengantar pesanan",
           color=T.INK_OUT, size=8.5)
    y += 26
    C.btn(d, G, y, CW, 48, "Daftar", "primary")
    y += 66
    d.text("l", G, y, "Sudah punya akun?", "body", color=T.INK_2)
    d.text("a", G, y, "Masuk", "body", color=T.GREEN, width=CW, align="right")
    close()


# ══════════════════════════════════════════════════ 10 Riwayat ═══════════
def s_riwayat():
    _, close = screen("10-riwayat", 780)
    C.appbar(d, "Pesanan saya", icons=())
    y = 76
    y = filter_tabs(y, ["Semua", "Belum bayar", "Diproses", "Dikirim", "Selesai"], "Semua")

    orders = [
        ("SA-261119-4821", "belum dibayar", "wait", "19 Nov 2026 · 2 barang",
         "Bayar dalam 18 menit, setelah itu stok dilepas.", "Rp 106.000"),
        ("SA-261116-3310", "dikirim", "paid", "16 Nov 2026 · 3 barang", None, "Rp 145.000"),
        ("SA-261110-1902", "selesai", "done", "10 Nov 2026 · 2 barang", None, "Rp 78.000"),
        ("SA-261105-0473", "dibatalkan", "dead", "5 Nov 2026 · 1 barang",
         "Alasan: stok tidak tersedia.", "Rp 45.000"),
    ]
    d.note("n", G, y + 22, "4 pesanan", color=T.INK_2, size=9.5)
    y += 42
    for no, st, tone, meta, extra, total in orders:
        d.rect("order", G, y, CW, 104 if extra else 86, fill=T.PAPER, stroke=T.RULE,
               strokeWeight=1)
        d.text("o/no", G + 14, y + 12, no, "lead")
        C.status(d, G + 14, y + 38, st, tone)
        d.note("o/meta", G + 160, y + 38, meta, color=T.INK_OUT, size=8.5)
        if extra:
            d.text("o/x", G + 14, y + 52, extra, "body-s", color=T.INK_2)
        d.text("o/t", G + 14, y + (74 if extra else 58), total, "price")
        d.icon("chevron-right", W - G - 16, y + (56 if extra else 46), 16, T.INK_2)
        y += (104 if extra else 86) + 12

    C.tabbar(d, 718, "Akun")
    close()


# ══════════════════════════════════════════════════ 11 Detail pesanan ════
def s_detail_pesanan():
    _, close = screen("11-detail-pesanan", 1010)
    C.appbar(d, "Pesanan", icons=())
    y = 80
    d.text("no", G, y, "SA-261119-4821", "headline")
    C.stamp(d, W - G - 74, y + 2, "SELESAI", color=T.INK, rot=-3, size=9)
    d.note("made", G, y + 42, "dibuat 19 nov 2026, 14.02 wib", size=9)

    y = C.section(d, y + 74, "Riwayat")
    y += 6
    for t, ev in [("14.02", "Pesanan dibuat"), ("14.04", "Pembayaran diterima lewat QRIS"),
                  ("15.10", "Sedang diantar"), ("16.45", "Selesai")]:
        d.note("h/t", G, y + 10, t, color=T.INK_OUT, size=9)
        d.text("h/e", G + 62, y + 2, ev, "body")
        d.hline(G + 62, y + 26, CW - 62)
        y += 28
    y += 14

    y = C.section(d, y, "Barang")
    for name, price in [("2 × Ikan Nila 1 kg", "Rp 90.000"), ("2 × Kangkung 1 ikat", "Rp 16.000")]:
        d.text("i/l", G, y + 2, name, "body")
        d.text("i/v", G, y + 2, price, "body", width=CW, align="right")
        y += 24
    y += 12
    y = money_block(y, [("Subtotal", "Rp 106.000", ""), ("Ongkir", "Rp 15.000", ""),
                        ("Potongan gratis ongkir", "−Rp 15.000", "muted"),
                        ("Total", "Rp 106.000", "strong")]) + 10

    y = C.section(d, y, "Alamat pengiriman")
    d.text("a/1", G, y + 2, "Rumah · Dewi Lestari", "lead")
    d.text("a/2", G, y + 26, "08123456789", "body-s", color=T.INK_2)
    d.text("a/3", G, y + 46, "Jl. Melati No. 12, RT 04/RW 02, Jakarta Selatan 12430",
           "body-s", color=T.INK_2, width=CW)
    d.note("a/4", G, y + 88, "catatan: pagar hijau, titip ke penjaga", size=8.5)
    y += 118

    y = C.section(d, y, "Pembayaran")
    d.text("p/l", G, y + 2, "Metode", "body", color=T.INK_2)
    d.text("p/v", G, y + 2, "QRIS", "body", width=CW, align="right")
    d.text("p/l2", G, y + 26, "Dibayar", "body", color=T.INK_2)
    d.text("p/v2", G, y + 26, "19 Nov 2026, 14.04", "body", width=CW, align="right")
    y += 58

    C.callout(d, G, y, CW, "Ada yang tidak sesuai?",
              "Hubungi toko di 0812-3456-789. Pembatalan dan pengembalian dana lewat admin.")
    close()


# ══════════════════════════════════════════════════ 12 Alamat ════════════
def s_alamat():
    _, close = screen("12-alamat", 600)
    C.appbar(d, "Alamat saya", icons=("plus",), cart=0)
    y = 84
    for i, (title, lines, main) in enumerate([
        ("Rumah", ["Dewi Lestari · 08123456789",
                   "Jl. Melati No. 12, RT 04/RW 02,",
                   "Cilandak, Jakarta Selatan 12430",
                   "Catatan: pagar hijau, titip ke penjaga"], True),
        ("Restoran", ["Dewi Lestari · 08123456789",
                      "Jl. Raya Pasar Minggu No. 8,",
                      "Pasar Minggu, Jakarta Selatan 12520"], False)]):
        h = 64 + 20 * len(lines)
        d.rect("addr", G, y, CW, h, fill=T.PAPER, stroke=T.GREEN if main else T.RULE,
               strokeWeight=2 if main else 1)
        d.text("addr/t", G + 14, y + 12, title, "lead")
        if main:
            d.note("addr/main", W - G - 14, y + 18, "utama", color=T.GREEN, bold=True,
                   size=9, align="right")
        cy = y + 38
        for ln in lines:
            d.text("addr/l", G + 14, cy, ln, "body-s", color=T.INK_2)
            cy += 20
        d.note("addr/edit", G + 14, y + h - 18, "ubah", color=T.GREEN, bold=True, size=9)
        d.note("addr/del", G + 74, y + h - 18, "hapus", color=T.INK_OUT, size=9)
        if not main:
            d.note("addr/set", G + 128, y + h - 18, "jadikan utama", color=T.GREEN, size=9)
        y += h + 14

    y += 6
    d.note("addr/hint", G, y, "pesanan lama menyimpan salinan alamatnya sendiri", color=T.INK_OUT,
           size=8.5)
    close()


# ══════════════════════════════════════════════════ 13 Profil ════════════
def s_profil():
    _, close = screen("13-profil", 800)
    C.appbar(d, "Akun", icons=())
    y = 84
    d.rect("av", G, y, 56, 56, fill=T.GREEN_WASH, stroke=T.GREEN, strokeWeight=1)
    d.text("av/i", G, y + 16, "DL", "subhead", color=T.GREEN, width=56, align="center")
    d.text("me/n", G + 72, y + 8, "Dewi Lestari", "subhead")
    d.note("me/p", G + 72, y + 34, "08123456789 · pelanggan sejak nov 2025", size=9)
    y += 84

    y = C.section(d, y, "Data akun")
    y = C.field(d, G, y + 2, CW, "Nama", value="Dewi Lestari") + 12
    y = C.field(d, G, y, CW, "Nomor WhatsApp", value="08123456789",
                hint="nomor ini dipakai untuk masuk") + 12
    C.btn(d, G, y, CW, 44, "Simpan data", "secondary")
    y += 62

    y = C.section(d, y, "Ganti sandi")
    y = C.field(d, G, y + 2, CW, "Sandi sekarang", value="••••••••") + 12
    y = C.field(d, G, y, CW, "Sandi baru", value="••••••••", hint="minimal 8 karakter") + 12
    C.btn(d, G, y, CW, 44, "Simpan sandi", "secondary")
    y += 66

    for lab in ("Pesanan saya", "Alamat saya", "Cara kirim dan bayar"):
        d.text("nav/l", G, y + 16, lab, "body")
        d.icon("chevron-right", W - G - 8, y + 22, 16, T.INK_2)
        d.hline(G, y + 44, CW)
        y += 44
    y += 20
    C.btn(d, G, y, CW, 44, "Keluar", "secondary")
    C.tabbar(d, 738, "Akun")
    close()


# ══════════════════════════════════════════════════ 14–18 states ═════════
def s_kosong_katalog():
    _, close = screen("14-kosong-katalog", 700)
    C.appbar(d, "Produk", icons=("shopping-basket",), cart=4)
    y = search_box(72, value="kakap")
    filter_tabs(y + 8, ["Semua", "Ikan", "Sayur", "Bumbu", "Telur"], "Semua")
    y = 250
    d.rect("empty/box", 145, y, 100, 100, fill=T.PAPER, stroke=T.RULE, strokeWeight=1)
    d.icon("search", 195, y + 50, 36, T.INK_OUT, stroke=1.5)
    d.text("empty/t", G, y + 130, "Tidak ada “kakap”", "title", width=CW, align="center")
    d.para("empty/p", G, y + 162, "Coba kata lain, atau lihat semua produk yang tersedia.",
           "body", CW, color=T.INK_2, align="center")
    C.btn(d, G + 87, y + 204, 176, 44, "Lihat semua produk", "secondary")
    C.tabbar(d, 638, "Produk")
    close()


def s_kosong_keranjang():
    _, close = screen("15-kosong-keranjang", 640)
    C.appbar(d, "Keranjang", icons=())
    y = 230
    d.rect("empty/box", 145, y, 100, 100, fill=T.PAPER, stroke=T.RULE, strokeWeight=1)
    d.icon("shopping-basket", 195, y + 50, 36, T.INK_OUT, stroke=1.5)
    d.text("t", G, y + 130, "Keranjang masih kosong", "title", width=CW, align="center")
    d.para("p", G, y + 162, "Produk yang Anda tambahkan muncul di sini. Keranjangnya "
           "tersimpan di perangkat ini.", "body", CW, color=T.INK_2, align="center")
    C.btn(d, G + 110, y + 216, 130, 44, "Lihat produk", "primary")
    C.tabbar(d, 578, "Keranjang")
    close()


def s_riwayat_kosong():
    _, close = screen("16-riwayat-kosong", 640)
    C.appbar(d, "Pesanan saya", icons=())
    y = 230
    d.rect("empty/box", 145, y, 100, 100, fill=T.PAPER, stroke=T.RULE, strokeWeight=1)
    d.icon("receipt", 195, y + 50, 36, T.INK_OUT, stroke=1.5)
    d.text("t", G, y + 130, "Belum ada pesanan", "title", width=CW, align="center")
    d.para("p", G, y + 162, "Pesanan yang sudah dibuat muncul di sini beserta statusnya.",
           "body", CW, color=T.INK_2, align="center")
    C.btn(d, G + 110, y + 216, 130, 44, "Lihat produk", "primary")
    C.tabbar(d, 578, "Akun")
    close()


def s_katalog_memuat():
    _, close = screen("17-katalog-memuat", 700)
    C.appbar(d, "Produk", icons=("shopping-basket",), cart=4)
    y = 76
    for w, h, yy in [(CW, 44, 0)]:
        d.rect("skel", G, y, CW, 44, fill=T.GREEN_WASH)
    y += 56
    x = G
    for w in (78, 64, 96, 70):
        d.rect("skel/chip", x, y, w, 20, fill=T.GREEN_WASH)
        x += w + 12
    y += 44
    d.note("loading", G, y, "memuat produk…", color=T.INK_2, size=9.5)
    y += 24
    for i in range(6):
        d.hline(G, y + 64, CW)
        d.rect("skel/img", G + 24, y + 10, 44, 44, fill=T.GREEN_WASH)
        d.rect("skel/n", G + 78, y + 18, 120, 12, fill=T.GREEN_WASH)
        d.rect("skel/m", G + 78, y + 38, 84, 8, fill=T.GREEN_WASH)
        d.rect("skel/p", W - G - 96, y + 20, 60, 16, fill=T.GREEN_WASH)
        y += 64
    C.tabbar(d, 638, "Produk")
    close()


def s_riwayat_memuat():
    _, close = screen("18-riwayat-memuat", 660)
    C.appbar(d, "Pesanan saya", icons=())
    y = 76
    x = G
    for w in (64, 88, 72):
        d.rect("skel/chip", x, y, w, 20, fill=T.GREEN_WASH)
        x += w + 12
    y += 40
    d.note("loading", G, y, "memuat pesanan…", color=T.INK_2, size=9.5)
    y += 22
    for i in range(3):
        d.rect("skel/card", G, y, CW, 86, fill=T.GREEN_WASH)
        y += 98
    C.tabbar(d, 598, "Akun")
    close()


def s_keranjang_habis():
    _, close = screen("19-keranjang-habis", 610)
    C.appbar(d, "Keranjang", icons=())
    y = 76
    y = C.callout(d, G, y, CW, "Ikan Nila 2 kg baru saja habis",
                  "Baris ini tidak dihitung ke subtotal. Hapus, atau pilih ukuran lain.",
                  "error", icon="triangle-alert")
    y += 10

    # dead row
    photo(d, "row/img", "nila", G, y + 6, 56, 56)
    d.text("row/name", G + 72, y + 6, "Ikan Nila · 2 kg", "lead", color=T.INK_OUT)
    d.note("row/meta", G + 72, y + 28, "Rp 88.000", color=T.INK_OUT, size=9, orig=True)
    C.stamp(d, G + 72, y + 40, "HABIS", color=T.STAMP, rot=-4, size=8.5)
    d.note("row/alt", G + 146, y + 48, "pilih ukuran lain", color=T.GREEN, size=9)
    d.note("row/del", W - G, y + 24, "hapus", color=T.INK_OUT, size=8.5, align="right")
    y += 76
    d.hline(G, y, CW)

    photo(d, "row/img", "kangkung", G, y + 6, 56, 56)
    d.text("row/name", G + 72, y + 6, "Kangkung", "lead")
    d.note("row/meta", G + 72, y + 28, "1 ikat · Rp 8.000", size=9, orig=True)
    C.qty_ctrl(d, G + 72, y + 40, 2)
    d.text("row/price", W - G - 90, y + 6, "Rp 16.000", "price", width=90, align="right")
    d.note("row/del", W - G, y + 34, "hapus", color=T.INK_OUT, size=8.5, align="right")
    y += 76
    d.hline(G, y, CW)

    y += 20
    y = C.section(d, y, "Ringkasan")
    y = money_block(y + 6, [("Subtotal · 1 barang", "Rp 16.000", "strong"),
                            ("Ongkir", "dihitung di checkout", "muted")], rule_top=False)
    C.action_bar(d, 534, "Lanjut ke checkout")
    close()


def s_checkout_stok_habis():
    _, close = screen("20-checkout-stok-habis", 760)
    C.appbar(d, "Pembayaran", icons=())
    d.note("step", G, 80, "langkah 2 dari 2 · pembayaran", size=9)
    y = C.callout(d, G, 96, CW, "Stok baru saja habis",
                  "Ikan Nila 1 kg tersisa 0 saat pesanan dibuat. Pesanan tidak terbentuk, "
                  "dan keranjang sudah diperbarui.", "error", icon="triangle-alert")
    y += 20
    y = C.section(d, y, "Barang")
    d.text("i/l", G, y + 2, "2 × Kangkung 1 ikat", "body")
    d.text("i/v", G, y + 2, "Rp 16.000", "body", width=CW, align="right")
    d.note("i/n", G, y + 30, "ikan nila 1 kg dikeluarkan dari keranjang", color=T.INK_OUT, size=8.5)
    y += 56
    y = C.section(d, y, "Total")
    y = money_block(y + 6, [("Subtotal", "Rp 16.000", ""), ("Ongkir Cilandak", "Rp 15.000", ""),
                            ("Potongan gratis ongkir", "−Rp 15.000", "muted"),
                            ("Bayar", "Rp 16.000", "strong")], rule_top=False)
    C.action_bar(d, 684, "Kembali ke keranjang", kind="secondary")
    close()


def s_checkout_syarat():
    _, close = screen("21-checkout-ongkir-syarat", 900)
    C.appbar(d, "Checkout", icons=())
    d.note("step", G, 80, "langkah 1 dari 2 · alamat & pengiriman", size=9)
    y = C.section(d, 100, "Alamat pengiriman")
    y = C.choice_row(d, G, y + 2, CW, "Rumah", ["Dewi Lestari · 08123456789",
                                                 "Jl. Melati No. 12, RT 04/RW 02,",
                                                 "Cilandak, Jakarta Selatan 12430"], True)
    y = C.section(d, y + 28, "Kecamatan kirim")
    d.rect("select", G, y, CW, 44, fill=T.PAPER, stroke=T.RULE, strokeWeight=1)
    d.text("select/v", G + 12, y + 12, "Cilandak · Jakarta Selatan", "body")
    d.icon("chevron-down", W - G - 20, y + 22, 16, T.INK_2)
    y += 72
    y = C.section(d, y, "Ringkasan")
    y = money_block(y + 6, [("Subtotal", "Rp 120.000", "strong"),
                            ("Ongkir Cilandak", "Rp 15.000", ""),
                            ("Total", "Rp 135.000", "strong")], rule_top=False)
    y += 18
    C.callout(d, G, y, CW, "Gratis ongkir mulai Rp 150.000",
              "Subtotal Anda Rp 120.000. Tambah Rp 30.000 lagi supaya ongkirnya dipotong penuh.",
              "accent")
    C.action_bar(d, 824, "Lanjut ke pembayaran")
    close()


def s_checkout_memproses():
    _, close = screen("22-checkout-memproses", 596)
    C.appbar(d, "Pembayaran", back=False, icons=())
    d.note("step", G, 80, "langkah 2 dari 2 · pembayaran", size=9)
    y = 100
    d.rect("addr", G, y, CW, 56, fill=T.PAPER, stroke=T.RULE, strokeWeight=1)
    d.text("addr/t", G + 12, y + 10, "Rumah · Cilandak", "lead")
    d.text("addr/a", G + 12, y + 30, "Jl. Melati No. 12, Jakarta Selatan", "body-s",
           color=T.INK_2)
    y += 76
    y = C.section(d, y, "Barang")
    for name, price in [("2 × Ikan Nila 1 kg", "Rp 90.000"), ("2 × Kangkung 1 ikat", "Rp 16.000")]:
        d.text("i/l", G, y + 2, name, "body")
        d.text("i/v", G, y + 2, price, "body", width=CW, align="right")
        y += 24
    y = money_block(y + 14, [("Bayar", "Rp 106.000", "strong")])
    y += 12
    y = C.callout(d, G, y, CW, "Pesanan sedang dibuat",
                  "Stok dikunci dalam transaksi yang sama. Jangan tutup halaman ini.")
    # disabled, processing button
    by = 520
    d.rect("action", 0, by, W, 76, fill=T.PAPER)
    d.rect("action/rule", 0, by, W, 2, fill=T.INK)
    d.rect("btn", G, by + 14, CW, 48, fill=T.PAPER, stroke=T.RULE, strokeWeight=2)
    d.ell("spin", G + 18, by + 32, 14, 14, fill="none", stroke=T.GREEN, strokeWeight=2)
    d.text("btn/t", G + 42, by + 28, "Memproses…", "lead", color=T.INK_OUT)
    close()


def s_bayar_gagal():
    _, close = screen("23-pesanan-bayar-gagal", 860)
    C.appbar(d, "Pesanan", icons=())
    y = 80
    d.text("no", G, y, "SA-261119-4821", "headline")
    C.stamp(d, W - G - 92, y + 2, "BELUM DIBAYAR", color=T.INK, rot=-3, size=8.5)
    d.note("made", G, y + 42, "dibuat 19 nov 2026, 14.02 wib", size=9)
    y += 68
    y = C.callout(d, G, y, CW, "Pembayaran belum berhasil",
                  "QRIS ditolak pada 14.06. Pesanan masih bisa dibayar selama 18 menit.",
                  "error", icon="triangle-alert")
    y += 20
    y = C.section(d, y, "Barang")
    for name, price in [("2 × Ikan Nila 1 kg", "Rp 90.000"), ("2 × Kangkung 1 ikat", "Rp 16.000")]:
        d.text("i/l", G, y + 2, name, "body")
        d.text("i/v", G, y + 2, price, "body", width=CW, align="right")
        y += 24
    y = money_block(y + 14, [("Bayar", "Rp 106.000", "strong")])
    y += 16
    y = C.section(d, y, "Pembayaran")
    d.text("p/l", G, y + 2, "Metode", "body", color=T.INK_2)
    d.text("p/v", G, y + 2, "QRIS", "body", width=CW, align="right")
    d.text("p/l2", G, y + 26, "Percobaan terakhir", "body", color=T.INK_2)
    d.text("p/v2", G, y + 26, "19 Nov 2026, 14.06", "body", width=CW, align="right")
    d.note("p/hint", G, y + 56, "stok masih ditahan sampai pesanan kedaluwarsa", color=T.INK_OUT,
           size=8.5)
    C.action_bar(d, 784, "Coba bayar lagi")
    close()


def main():
    d.set_default_parent(None)
    _cur["x"], _cur["y"] = 0, 0
    builders = [s_beranda, s_produk, s_detail, s_keranjang, s_checkout_alamat,
                s_checkout_bayar, s_hasil, s_masuk, s_daftar, s_riwayat,
                s_detail_pesanan, s_alamat, s_profil, s_kosong_katalog,
                s_kosong_keranjang, s_riwayat_kosong, s_katalog_memuat,
                s_riwayat_memuat, s_keranjang_habis, s_checkout_stok_habis,
                s_checkout_syarat, s_checkout_memproses, s_bayar_gagal]
    COLS = 4
    heights = []
    for i, fn in enumerate(builders):
        _cur["x"] = (i % COLS) * (W + 90)
        if i and i % COLS == 0:
            _cur["y"] = max(heights[-COLS:]) + 140
        elif i == 0:
            _cur["y"] = 0
        before = _cur["y"]
        fn()
        heights.append(_cur["y"])

    path = os.path.join(DIR, "scripts", "store.json")
    ok = d.run(path, os.path.join(DIR, "out", "store.figcraft"))
    print("run ok" if ok else "run failed", len(d.cmds), "steps")
    for name, x, y, w, h in SCREENS:
        print(f"  {name:26s} x={x:5d} y={y:5d} h={h}")


if __name__ == "__main__":
    main()
