"""Segar Anugerah — design tokens (SOURCE OF TRUTH).

Read from ../../DESIGN.md ("The Running Ledger") and emitted to tokens.json.
Never re-type a hex in a builder: add it here first.
"""
import json, os

DIR = os.path.dirname(os.path.abspath(__file__))

# ── colour: paper, one green, ink, one red stamp ─────────────────────────
GREEN       = "#008043"   # ledger green — band, rules, primary action
GREEN_DEEP  = "#00512c"   # pressed primary only
GREEN_WASH  = "#EDF4F0"   # rgba(0,128,67,.07) flattened on paper
RULE        = "#B4CDC0"   # green hairline (rgba(0,128,67,.34) on paper)
PAPER       = "#f7f8f4"
PAPER_UP    = "#fcfdfa"   # lifted sheet (repeat block, admin sidebar)
INK         = "#16233a"
INK_2       = "#4a5a54"
INK_OUT     = "#64736b"
STAMP       = "#b3261e"
ON_BAND     = "#f7f8f4"
WHITE       = "#ffffff"

# ── type ────────────────────────────────────────────────────────────────
SANS   = "Archivo"
MONO   = "Courier Prime"

# name: (size, style, lineHeight, letterSpacing, color)
TYPE = {
    "display":   (46, "ExtraBold", 46, -1.6, INK),
    "headline":  (30, "ExtraBold", 32, -1.05, INK),
    "title":     (22, "ExtraBold", 26, -0.44, INK),
    "subhead":   (17, "Bold", 22, -0.17, INK),
    "lead":      (15, "SemiBold", 22, 0, INK),
    "body":      (14, "Regular", 22, 0, INK),
    "body-s":    (13, "Regular", 20, 0, INK_2),
    "price":     (19, "Bold", 22, -0.4, INK),
    "price-lg":  (30, "ExtraBold", 32, -1.0, INK),
    "price-xl":  (38, "ExtraBold", 40, -1.3, INK),
    "total":     (24, "ExtraBold", 26, -0.7, INK),
    "note":      (10, "Regular", 14, 1.2, INK_2),
    "note-b":    (10, "Bold", 14, 1.2, INK_2),
    "note-lg":   (11, "Bold", 15, 1.32, INK_2),
}

# ── metrics ─────────────────────────────────────────────────────────────
U = 4                       # spacing unit
GUTTER = 20                 # phone page gutter
PHONE_W = 390
TABBAR_H = 62
BAND_H = 96
ADMIN_W = 1280
SIDEBAR_W = 232
ADMIN_PAD = 32
ROW_H = 64                  # ledger row
CTRL = 36                   # add control / qty button
TOKENS = dict(
    colors=dict(brand=GREEN, brandDeep=GREEN_DEEP, wash=GREEN_WASH, rule=RULE,
                paper=PAPER, paperUp=PAPER_UP, ink=INK, ink2=INK_2, inkOut=INK_OUT,
                stamp=STAMP, onBrand=ON_BAND),
    type={k: dict(size=v[0], style=v[1], lineHeight=v[2], letterSpacing=v[3], color=v[4])
          for k, v in TYPE.items()},
    space=dict(unit=U, gutter=GUTTER),
    layout=dict(phoneW=PHONE_W, tabbarH=TABBAR_H, bandH=BAND_H,
                adminW=ADMIN_W, sidebarW=SIDEBAR_W, adminPad=ADMIN_PAD, rowH=ROW_H),
)

if __name__ == "__main__":
    with open(os.path.join(DIR, "tokens.json"), "w") as f:
        json.dump(TOKENS, f, indent=1)
    print("wrote", os.path.join(DIR, "tokens.json"))
