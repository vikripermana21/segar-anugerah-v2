"""comps — the store's shared components, drawn in the Running-Ledger world.

Phone canvas helpers assume a 390px screen with a 20px gutter; admin
helpers assume 1280px with a 232px sidebar and 32px padding.
"""
import os
import tokens as T
from figlib import photo

W = T.PHONE_W          # 390
G = T.GUTTER           # 20
CW = W - 2 * G         # 350


# ───────────────────────────────────────────── store chrome ──────────────
def band(d, eyebrow, title, meta, cart=2, h=T.BAND_H):
    d.rect("band", 0, 0, W, h, fill=T.GREEN)
    d.note("band/eyebrow", G, 22, eyebrow, color="#CFE3D8", size=9.5)
    d.text("band/wordmark", G, 30, title, "headline", color=T.ON_BAND)
    d.note("band/meta", G, h - 20, meta, color="#CFE3D8", size=9.5)
    # cart
    d.icon("shopping-basket", W - 44, 38, 22, T.ON_BAND)
    d.note("cart/n", W - 44, 62, "keranjang", color="#CFE3D8", size=9, align="center")
    if cart:
        d.rect("cart/badge", W - 40, 20, 18, 18, fill=T.ON_BAND)
        d.text("cart/badge/t", W - 40, 21, str(cart), "note-b",
               color=T.GREEN, width=18, align="center")
    # search hint on the band's right edge, left of the cart
    d.icon("search", W - 84, 38, 20, T.ON_BAND)
    return h


def notice(d, y, left, right):
    d.rect("notice", 0, y, W, 44, fill=T.GREEN_WASH)
    d.rect("notice/edge", 0, y, 3, 44, fill=T.GREEN)
    d.note("notice/l", G, y + 22, left, color=T.GREEN, bold=True, size=9.5)
    d.note("notice/r", G + 116, y + 22, right, color=T.INK_2, size=9.5)
    d.hline(0, y + 44, W)
    return y + 44


def appbar(d, title, back=True, icons=("shopping-basket",), cart=2, note=None):
    h = 56
    d.rect("appbar", 0, 0, W, h, fill=T.PAPER)
    x = G
    if back:
        d.icon("arrow-left", x + 9, h / 2, 18, T.INK)
        x += 34
    d.text("appbar/title", x, 16, title, "subhead")
    if note:
        d.note("appbar/note", x, 40, note, size=9)
    rx = W - G - 9
    for ic in reversed(icons):
        d.icon(ic, rx, h / 2, 20, T.INK)
        if ic == "shopping-basket" and cart:
            d.rect("appbar/badge", rx + 4, h / 2 - 14, 16, 16, fill=T.GREEN)
            d.text("appbar/badge/t", rx + 4, h / 2 - 13, str(cart), "note-b",
                   color=T.ON_BAND, width=16, align="center")
        rx -= 34
    d.hline(0, h - 1, W)
    return h


def tabbar(d, y, active="Beranda"):
    items = [("Beranda", "home"), ("Produk", "package"),
             ("Keranjang", "shopping-basket"), ("Akun", "user")]
    d.rect("tabbar", 0, y, W, T.TABBAR_H, fill=T.PAPER)
    d.rect("tabbar/rule", 0, y, W, 2, fill=T.INK)
    for i, (lab, ic) in enumerate(items):
        cx = W / 8 + i * (W / 4)
        on = lab == active
        col = T.GREEN if on else T.INK_2
        d.icon(ic if ic != "home" else "layout-dashboard", cx, y + 22, 18, col)
        d.note("tab/" + lab, cx - 30, y + 44, lab, color=col, bold=on,
               size=9, align="center")
    return y + T.TABBAR_H


def action_bar(d, y, label, kind="primary", second=None, icon=None):
    h = 76
    d.rect("action", 0, y, W, h, fill=T.PAPER)
    d.rect("action/rule", 0, y, W, 2, fill=T.INK)
    if second:
        btn(d, G, y + 14, 120, 48, second, "secondary")
        btn(d, G + 132, y + 14, CW - 132, 48, label, kind, icon=icon)
    else:
        btn(d, G, y + 14, CW, 48, label, kind, icon=icon)
    return y + h


# ───────────────────────────────────────────── store atoms ───────────────
def btn(d, x, y, w, h, label, kind="primary", icon=None, size=14,
        align="center", sub=None):
    if kind == "primary":
        d.rect("btn", x, y, w, h, fill=T.GREEN)
        fg = T.ON_BAND
    elif kind == "secondary":
        d.rect("btn", x, y, w, h, fill=T.PAPER, stroke=T.INK, strokeWeight=2)
        fg = T.INK
    elif kind == "ghost":
        fg = T.INK
    else:                                   # disabled / dead
        d.rect("btn", x, y, w, h, fill=T.PAPER, stroke=T.RULE, strokeWeight=2)
        fg = T.INK_OUT
    tx = x + (w / 2 if align == "center" else 16)
    cy = y + h / 2 - (5 if sub else 0)
    d.text("btn/t", x + (16 if align != "center" else 0), cy - 9, label, "lead",
           color=fg, width=None if align != "center" else w,
           align=align)
    if sub:
        d.note("btn/sub", x + (8 if align == "center" else 16), cy + 16, sub,
               color=fg, size=9, align=align)
    if icon:
        d.icon(icon, x + 26, y + h / 2, 18, fg)
        d.text("btn/t", x + 44, cy - 9, label, "lead", color=fg)
    return y + h


def add_ctrl(d, x, y, size=T.CTRL, icon="plus", dim=False, color=None):
    col = color or (T.INK_OUT if dim else T.GREEN)
    d.rect("add", x, y, size, size, fill=T.PAPER, stroke=col, strokeWeight=2)
    d.icon(icon, x + size / 2, y + size / 2, 14, col)


def qty_ctrl(d, x, y, n, size=T.CTRL):
    d.rect("qty", x, y, 104, size, fill=T.PAPER, stroke=T.RULE, strokeWeight=1)
    d.icon("minus", x + 18, y + size / 2, 13, T.INK, stroke=3.0)
    d.text("qty/n", x + 40, y + 9, str(n), "lead", width=24, align="center")
    d.icon("plus", x + 86, y + size / 2, 13, T.INK, stroke=3.0)
    return 104


def stamp(d, x, y, text, color=T.STAMP, rot=-4, size=9.5):
    w = 14 + len(text) * 6.4
    h = 20
    box = d.frame("stamp", x, y, w, h, fill="none", stroke=color, strokeWeight=2)
    d.text("stamp/t", 7, 3, text, "note", color=color, size=size, parent=box)
    d.setprops(box, rotation=rot)
    return w


def status(d, x, y, text, tone="paid"):
    col = {"paid": T.GREEN, "wait": T.INK_2, "done": T.INK, "dead": T.INK_OUT}[tone]
    d.rect("status/dot", x, y - 4, 7, 7, fill=col if tone in ("paid", "done") else T.PAPER,
           stroke=col, strokeWeight=1.5)
    d.note("status/t", x + 14, y, text, color=col, bold=(tone == "paid"), size=9.5)


# ───────────────────────────────────────────── store blocks ──────────────
def section(d, y, title, note=None, rule_w=CW, x=G):
    d.ink_rule(x, y, rule_w)
    d.text("sec/title", x, y + 16, title, "title")
    if note:
        d.note("sec/note", W - G, y + 26, note, size=9, align="right")
    return y + 16 + 24


def ledger_row(d, y, no, slug, name, meta, price, action="add", dim=False,
               stamp_text=None, h=T.ROW_H, price_w=96):
    ink = T.INK_OUT if dim else T.INK
    muted = T.INK_OUT if dim else T.INK_2
    if slug:
        p = photo(d, "row/photo", slug, G + 24, y + 10, 44, 44)
        if dim:
            d.setprops(p, opacity=0.4)
    if no:
        d.note("row/no", G, y + h / 2, no, color=T.INK_OUT, size=9)
    d.text("row/name", G + 78, y + 16, name, "lead", color=ink)
    d.note("row/meta", G + 78, y + 38, meta, color=muted, size=9)
    px = W - G - (T.CTRL + 12) - price_w
    d.text("row/price", px, y + 17, price, "price", color=ink,
           width=price_w, align="right")
    if stamp_text:
        stamp(d, px, y + 38, stamp_text, color=T.INK_OUT if dim else T.STAMP, rot=-3, size=8.5)
    if action == "add":
        add_ctrl(d, W - G - T.CTRL, y + (h - T.CTRL) / 2, dim=dim)
    elif action == "qty":
        qty_ctrl(d, W - G - 104, y + (h - T.CTRL) / 2, 2)
    elif action == "chevron":
        d.icon("chevron-right", W - G - 8, y + h / 2, 16, T.INK_2)
    elif action == "remove":
        d.icon("x", W - G - 9, y + h / 2, 16, T.INK_2)
    d.hline(G, y + h, CW)
    return y + h


def money_row(d, y, label, value, strong=False, x=G, w=CW, note_value=False):
    d.text("money/l", x, y, label, "lead" if strong else "body",
           color=T.INK if strong else T.INK_2)
    d.text("money/v", x, y, value, "lead" if strong else "body",
           color=T.INK, width=w, align="right")
    return y + (26 if strong else 24)


def field(d, x, y, w, label, value=None, hint=None, placeholder=None,
          kind="text", focus=False, error=None, h=44):
    d.note("field/label", x, y + 6, label, color=T.INK_2, size=9, bold=True)
    top = y + 20
    d.rect("field/box", x, top, w, h, fill=T.PAPER,
           stroke=T.STAMP if error else (T.GREEN if focus else T.RULE),
           strokeWeight=2 if (error or focus) else 1)
    if value:
        d.text("field/v", x + 12, top + 12, value, "body")
    elif placeholder:
        d.text("field/p", x + 12, top + 12, placeholder, "body", color=T.INK_OUT)
    if hint:
        d.note("field/hint", x, top + h + 14, hint, color=T.INK_OUT, size=8.5)
        return top + h + 22
    return top + h


def choice_row(d, x, y, w, title, lines, checked=False, h=None, tag=None):
    h = h or (34 + 18 * len(lines))
    d.rect("choice", x, y, w, h, fill=T.GREEN_WASH if checked else T.PAPER,
           stroke=T.GREEN if checked else T.RULE, strokeWeight=2 if checked else 1)
    d.rect("choice/box", x + 14, y + 16, 16, 16, fill=T.PAPER,
           stroke=T.GREEN if checked else T.INK_OUT, strokeWeight=1.5)
    if checked:
        d.rect("choice/dot", x + 18, y + 20, 8, 8, fill=T.GREEN)
    tx = x + 42
    d.text("choice/t", tx, y + 13, title, "lead")
    cy = y + 34
    for i, ln in enumerate(lines):
        d.text("choice/l", tx, cy, ln, "body-s" if i else "body-s", color=T.INK_2)
        cy += 18
    if tag:
        status(d, x + w - 70, y + 20, tag, "paid")
    return y + h


def callout(d, x, y, w, title, text, tone="ink", icon="info", h=None):
    lines = 1
    pad = 14
    h = h or (pad * 2 + 20 + (18 if text else 0))
    d.rect("callout", x, y, w, h, fill=T.GREEN_WASH if tone == "accent" else T.PAPER,
           stroke=T.STAMP if tone == "error" else (T.GREEN if tone == "accent" else T.RULE),
           strokeWeight=1.5 if tone != "error" else 2)
    d.icon(icon, x + 20, y + 20, 16, T.STAMP if tone == "error" else T.GREEN)
    d.text("callout/t", x + 40, y + pad - 2, title, "lead",
           color=T.STAMP if tone == "error" else T.INK)
    if text:
        d.para("callout/x", x + 40, y + pad + 22, text, "body-s", w - 56,
               color=T.INK_2)
    return y + h
