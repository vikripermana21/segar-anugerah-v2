# Segar Anugerah — FigCraft design boards

High-fidelity UI built in FigCraft from `../wireframes-store.html` and
`../wireframes-admin.html`, dressed in the design system in `../../../DESIGN.md`
("The Running Ledger": paper, one green, ink, one red stamp, Archivo + Courier Prime).

## Deliverables

| File | What |
|---|---|
| `out/store.figcraft` | 23 buyer screens, 390 px wide |
| `out/admin.figcraft` | 14 admin screens (1280 px, plus a 1024 and a 390 variant) |
| `previews/store/*.png` | one PNG per screen, 2× |
| `previews/admin/*.png` | one PNG per screen, 2× |
| `previews/store-sheet.png` | contact sheet |
| `previews/admin-sheet.png` | contact sheet |

Open a `.figcraft` in FigCraft and every screen is a top-level frame; layers are
named after their role (`row/name`, `band/wordmark`, `btn/t`), so they stay
editable.

## Rebuild

```bash
python3 build_store.py      # -> scripts/store.json, out/store.figcraft
python3 build_admin.py      # -> scripts/admin.json, out/admin.figcraft
python3 preview.py out/store.figcraft previews/store
python3 preview.py out/admin.figcraft previews/admin
python3 sheet.py            # contact sheets
```

`build_*.py` is a generator: it emits a FigCraft command script and runs it
headless, so a change to a component re-renders every screen deterministically.
Nothing is hand-placed.

## Files

| File | Role |
|---|---|
| `tokens.py` | SOURCE OF TRUTH for colours, type scale, spacing; writes `tokens.json` |
| `figlib.py` | FigCraft primitives: text with cap-height centring, SVGs icons, images, run/export |
| `comps.py` | store components: band, ledgers row, action bar, tab bar, fields, callouts |
| `comps_admin.py` | admin shell (sidebar + topbar), tables, metric strip, panels |
| `assets/photos/` | product photography (Wikimedia Commons / Openverse, CC) |
| `assets/icons/` | Lucide icons, parsed into single vectors at build time |
| `scripts/*.json` | generated command scripts (throwaway) |

## Design decisions worth knowing

- **Square everything.** No radius, no shadow, no dark theme — depth is a hairline
  or a 2 px ink rule. A rounded pill or a card shadow would break the world.
- **Green holds territory.** The morning band, the rules, the balance bar, the
  primary action. It is a surface, not an accent.
- **Two voices only.** Archivo (ExtraBold/Bold) writes names and figures; Courier
  Prime writes every annotation, in uppercase, monospaced and tracked. Prices are
  never set in mono; annotations are never set in Archivo.
- **`HABIS` is the only red.** Stamp red marks what is gone and nothing else, so
  the sold-out row is faded to out-ink and stamped, never hidden.
- **Filters are ruled labels, not pills.** A selected filter is green text over a
  2 px underline, which keeps the sheet square.
- **Single-select is a square inside a square**, multi-select would be a tick —
  the vocabulary stays orthogonal.
- FigCraft text is baseline-calibrated, not guessed: `CAP` in `figlib.py` holds
  the measured cap-centre factors (Archivo 0.5325, Courier Prime 0.3925 em), so
  every label centres on its optical line.

## Fonts

`Archivo` (400/500/600/700/800, static instances) and `Courier Prime`
(400/700) must be installed for the renders to match:

```bash
# Archivo variable -> static instances via fontTools, then install to ~/Library/Fonts
```

The board carries no missing-font warnings when both families are present
(`figcraft-cli info out/store.figcraft` → `missingFonts: []`).
