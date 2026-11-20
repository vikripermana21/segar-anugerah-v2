"""comps_admin — the admin shell and its atoms (1280px desktop)."""
import tokens as T

AW = T.ADMIN_W        # 1280
SB = T.SIDEBAR_W      # 232
PAD = T.ADMIN_PAD     # 32
CX = SB + PAD         # 264
CWID = AW - SB - 2 * PAD   # 984
TOPBAR = 64

NAV = [
    ("", [("Dashboard", "layout-dashboard", "dashboard")]),
    ("Pesanan", [("Daftar pesanan", "receipt", "pesanan")]),
    ("Katalog", [("Produk", "package", "produk"), ("Kategori", "tag", "kategori")]),
    ("Pengiriman", [("Zona ongkir", "truck", "zona")]),
    ("Toko", [("Pengaturan", "settings", "pengaturan"),
              ("Pengguna admin", "users", "pengguna"),
              ("Laporan", "chart-column", "laporan")]),
]


def shell(d, title, active, note=None, h=900, w=AW, user="Rina Kusuma"):
    """Sidebar + topbar; returns (x, y, content width) for the pane."""
    d.rect("page", 0, 0, w, h, fill=T.PAPER)
    # ── sidebar
    d.rect("sidebar", 0, 0, SB, h, fill=T.PAPER_UP)
    d.rect("sidebar/rule", SB - 1, 0, 1, h, fill=T.RULE)
    d.text("brand", 28, 26, "Segar Anugerah", "subhead")
    d.note("brand/note", 28, 52, "ledger admin · cilandak", color=T.INK_OUT, size=8.5)

    y = 92
    for group, items in NAV:
        if group:
            d.note("nav/group", 28, y + 6, group, color=T.INK_OUT, size=8.5)
            y += 18
        else:
            y += 2
        for label, icon, key in items:
            on = key == active
            if on:
                d.rect("nav/on", 0, y - 6, SB - 1, 38, fill=T.GREEN_WASH)
                d.rect("nav/edge", 0, y - 6, 3, 38, fill=T.GREEN)
            d.icon(icon, 36, y + 13, 16, T.GREEN if on else T.INK_OUT)
            d.text("nav/" + key, 56, y + 4, label, "body",
                   color=T.GREEN if on else T.INK)
            y += 38
        y += 14

    # ── topbar
    d.rect("topbar", SB, 0, w - SB, TOPBAR, fill=T.PAPER)
    d.rect("topbar/rule", SB, TOPBAR - 1, w - SB, 1, fill=T.RULE)
    d.text("topbar/title", CX, 22, title, "title")
    if note:
        d.note("topbar/note", CX, 48, note, color=T.INK_OUT, size=8.5)
    # right cluster
    d.text("user", w - PAD - 170, 24, user, "body", color=T.INK_2, width=126, align="right")
    d.rect("user/av", w - PAD - 32, 19, 28, 28, fill=T.GREEN_WASH, stroke=T.GREEN, strokeWeight=1)
    d.text("user/init", w - PAD - 32, 24, "RK", "note-b", color=T.GREEN, width=28, align="center")
    d.note("user/out", w - PAD - 190, 33, "keluar", color=T.INK_OUT, size=9, align="right")
    return CX, TOPBAR + PAD, w - SB - 2 * PAD


def section(d, x, y, w, title, note=None):
    d.ink_rule(x, y, w)
    d.text("sec", x, y + 14, title, "subhead")
    if note:
        d.note("sec/note", x + w, y + 22, note, color=T.INK_OUT, size=8.5, align="right")
    return y + 44


def table(d, x, y, w, cols, rows, row_h=46, head_h=34, density="normal", pick=None):
    """cols: [(label, width, align)]; rows: [[cell, …]] (str or ('stamp', txt, tone))."""
    tot = sum(c[1] for c in cols)
    if tot != w:
        k = w / tot
        cols = [(l, cw * k, a) for l, cw, a in cols]
    GUT = 14                      # every column keeps a gutter on its right
    # header
    d.rect("th/rule", x, y + head_h - 1, w, 1, fill=T.INK)
    cx = x
    for label, cw, align in cols:
        if not label:
            cx += cw
            continue
        box = cw - GUT
        size = 8.5
        need = len(label) * (0.6 * size + 1.2)
        if need > box:
            size = max(6.5, (box - len(label) * 1.2) / (len(label) * 0.6))
        d.note("th", cx, y + 16, label, color=T.INK_2, size=size, align=align,
               **({"width": box} if align == "right" else {}))
        cx += cw
    y += head_h
    for ri, r in enumerate(rows):
        if pick is not None and ri == pick:
            d.rect("td/pick", x - 12, y, w + 24, row_h, fill=T.GREEN_WASH)
        cx = x
        for (label, cw, align), cell in zip(cols, r):
            box = cw - 14
            if isinstance(cell, tuple) and cell[0] == "btn":
                A_btn = 84
                btn(d, cx, y + 9, A_btn, 28, cell[1], "secondary", size=12)
            elif isinstance(cell, tuple) and cell[0] == "":
                pass
            elif isinstance(cell, tuple) and cell[0] == "stamp":
                _stamp_cell(d, cx, y, cw, cell[1], cell[2])
            elif isinstance(cell, tuple) and cell[0] == "strong":
                d.text("td", cx, y + 14, cell[1], "lead", width=box if align == "right" else None,
                       align=align)
            elif isinstance(cell, tuple) and cell[0] == "num":
                d.text("td", cx, y + 14, cell[1], "body", width=box if align == "right" else None,
                       align=align)
            elif isinstance(cell, tuple) and cell[0] == "thumb":
                d.img("td/img", cell[1], cx, y + 7, 30, 30)
            elif isinstance(cell, tuple) and cell[0] == "alert":
                d.text("td", cx, y + 14, cell[1], "body-s", color=T.STAMP,
                       width=box if align == "right" else None, align=align)
            elif isinstance(cell, tuple) and cell[0] == "num2":
                d.text("td", cx, y + 14, cell[1], "body", width=box if align == "right" else None,
                       align=align)
            elif isinstance(cell, tuple) and cell[0] == "muted":
                d.text("td", cx, y + 14, cell[1], "body-s", color=T.INK_OUT,
                       width=box if align == "right" else None, align=align)
            else:
                d.text("td", cx, y + 14, str(cell), "body-s",
                       width=box if align == "right" else None, align=align)
            cx += cw
        y += row_h
        d.hline(x, y, w)
    return y


def _stamp_cell(d, x, y, w, text, tone="wait"):
    col = {"paid": T.GREEN, "wait": T.INK_2, "alert": T.STAMP, "dead": T.INK_OUT}[tone]
    d.rect("st/dot", x, y + 20, 7, 7, fill=col if tone in ("paid", "alert") else T.PAPER,
           stroke=col, strokeWeight=1.5)
    d.note("st", x + 14, y + 24, text, color=col, bold=(tone == "alert"), size=8.5)


def metrics(d, x, y, w, items):
    """A ruled strip of figures, not cards."""
    d.ink_rule(x, y, w)
    n = len(items)
    cw = w / n
    for i, (label, value, note) in enumerate(items):
        cx = x + i * cw
        d.note("m/l", cx, y + 26, label, color=T.INK_2, size=8.5)
        d.text("m/v", cx, y + 38, value, "price-lg")
        if note:
            d.note("m/n", cx, y + 82, note, color=T.INK_OUT, size=8.5)
        if i:
            d.vline(cx - 24, y + 16, 74)
    return y + (108 if any(n for _, _, n in items) else 92)


def btn(d, x, y, w, h, label, kind="primary", icon=None, size=13):
    if kind == "primary":
        d.rect("btn", x, y, w, h, fill=T.GREEN)
        fg = T.ON_BAND
    elif kind == "secondary":
        d.rect("btn", x, y, w, h, fill=T.PAPER, stroke=T.INK, strokeWeight=2)
        fg = T.INK
    elif kind == "danger":
        d.rect("btn", x, y, w, h, fill=T.PAPER, stroke=T.STAMP, strokeWeight=2)
        fg = T.STAMP
    else:
        fg = T.INK
    if icon:
        d.icon(icon, x + 20, y + h / 2, 15, fg)
        d.text("btn/t", x + 34, y + (h - 16) / 2 - 3, label, "lead", color=fg)
    else:
        d.text("btn/t", x, y + (h - 16) / 2 - 3, label, "lead", color=fg,
               width=w, align="center")
    return y + h


def field(d, x, y, w, label, value=None, hint=None, placeholder=None,
          h=42, disabled=False, select=False, error=False):
    d.note("f/l", x, y + 6, label, color=T.INK_2, size=8.5, bold=True)
    top = y + 18
    d.rect("f/box", x, top, w, h,
           fill=T.GREEN_WASH if disabled else T.PAPER,
           stroke=T.STAMP if error else T.RULE, strokeWeight=2 if error else 1)
    if select:
        d.text("f/v", x + 12, top + 11, value or placeholder or "", "body",
               color=T.INK_OUT if not value else T.INK)
        d.icon("chevron-down", x + w - 20, top + h / 2, 14, T.INK_2)
    elif value:
        d.text("f/v", x + 12, top + 11, value, "body",
               color=T.INK_OUT if disabled else T.INK)
    elif placeholder:
        d.text("f/p", x + 12, top + 11, placeholder, "body", color=T.INK_OUT)
    if hint:
        d.note("f/h", x, top + h + 14, hint, color=T.INK_OUT, size=8)
        return top + h + 24
    return top + h


def pills(d, x, y, items, active):
    """Filter chips are ruled mono labels with an underline, never pills."""
    d.hline(x, y + 28, sum(len(i) * 7.2 + 26 for i in items) - 8)
    cx = x
    for it in items:
        on = it == active
        col = T.GREEN if on else T.INK_2
        d.note("pill/" + it, cx, y + 12, it, color=col, bold=on, size=9)
        tw = len(it) * 7.2
        if on:
            d.rect("pill/on", cx - 2, y + 26, tw + 6, 3, fill=T.GREEN)
        cx += tw + 26
    return y + 34


def callout(d, x, y, w, title, text, tone="ink", icon="info", h=None):
    h = h or (64 if not text else 74)
    d.rect("co", x, y, w, h, fill=T.GREEN_WASH if tone == "accent" else T.PAPER,
           stroke=T.STAMP if tone == "error" else (T.GREEN if tone == "accent" else T.RULE),
           strokeWeight=1.5 if tone != "error" else 2)
    d.icon(icon, x + 22, y + 22, 16, T.STAMP if tone == "error" else T.GREEN)
    d.text("co/t", x + 44, y + 12, title, "lead",
           color=T.STAMP if tone == "error" else T.INK)
    if text:
        d.text("co/x", x + 44, y + 34, text, "body-s", color=T.INK_2, width=w - 60)
    return y + h


def panel(d, x, y, w, h, title=None, note=None):
    d.rect("panel", x, y, w, h, fill=T.PAPER_UP, stroke=T.RULE, strokeWeight=1)
    if title:
        d.text("panel/t", x + 18, y + 16, title, "subhead")
    if note:
        d.note("panel/n", x + w - 18, y + 22, note, color=T.INK_OUT, size=8.5, align="right")
    return x + 18, y + (52 if title else 18), w - 36
