"""figlib — drawing helpers over the FigCraft command script.

Every emitter honours Doc.default_parent, so page coordinates are child
coordinates and the container-origin bug cannot happen.
"""
import json, math, os, re, subprocess

import tokens as T

DIR = os.path.dirname(os.path.abspath(__file__))
CLI = os.path.expanduser("~/.local/bin/figcraft-cli")
ICON_DIR = os.path.join(DIR, "assets", "icons")
PHOTO_DIR = os.path.join(DIR, "assets", "photos")

# cap-centre calibration, measured on "HN38" at 100px (see probe in README)
CAP = {"Archivo": 0.5325, "Courier Prime": 0.3925}


# ───────────────────────────────────────────── lucide parsing ────────────
_NA = {"M": 2, "L": 2, "H": 1, "V": 1, "C": 6, "S": 4, "Q": 4, "T": 2, "A": 7, "Z": 0}
_TOK = re.compile(r"[MmLlHhVvCcSsQqTtAaZz]|[-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?")


def _num(v):
    s = "%.4f" % v
    return (s.rstrip("0").rstrip(".") if "." in s else s) or "0"


def _arc_points(x1, y1, rx, ry, phi_deg, fa, fs, x2, y2, n=16):
    phi = math.radians(phi_deg); cp, sp = math.cos(phi), math.sin(phi)
    rx, ry = abs(rx), abs(ry)
    if rx == 0 or ry == 0:
        return [(x2, y2)]
    dx2, dy2 = (x1 - x2) / 2, (y1 - y2) / 2
    x1p, y1p = cp * dx2 + sp * dy2, -sp * dx2 + cp * dy2
    lam = x1p ** 2 / rx ** 2 + y1p ** 2 / ry ** 2
    if lam > 1:
        k = math.sqrt(lam); rx, ry = rx * k, ry * k
    num = rx ** 2 * ry ** 2 - rx ** 2 * y1p ** 2 - ry ** 2 * x1p ** 2
    den = rx ** 2 * y1p ** 2 + ry ** 2 * x1p ** 2
    co = (1 if fa != fs else -1) * math.sqrt(max(0.0, num / den)) if den else 0.0
    cxp, cyp = co * rx * y1p / ry, -co * ry * x1p / rx
    cx = cp * cxp - sp * cyp + (x1 + x2) / 2
    cy = sp * cxp + cp * cyp + (y1 + y2) / 2
    t1 = math.atan2((y1 - cy) / ry, (x1 - cx) / rx)
    t2 = math.atan2((y2 - cy) / ry, (x2 - cx) / rx)
    dt = t2 - t1
    if fs and dt < 0: dt += 2 * math.pi
    if not fs and dt > 0: dt -= 2 * math.pi
    return [(cx + rx * math.cos(t) * cp - ry * math.sin(t) * sp,
             cy + rx * math.cos(t) * sp + ry * math.sin(t) * cp)
            for t in (t1 + dt * k / n for k in range(n + 1))]


def _absolutize(d):
    toks = _TOK.findall(d)
    i, out = 0, []
    x = y = sx = sy = 0.0
    cmd = None
    while i < len(toks):
        if toks[i].isalpha():
            cmd = toks[i]; i += 1
            if cmd in "Zz":
                out.append("Z"); x, y = sx, sy; continue
        n = _NA[cmd.upper()]
        args = [float(t) for t in toks[i:i + n]]; i += n
        rel = cmd.islower(); C = cmd.upper()
        if C == "M":
            nx, ny = (x + args[0], y + args[1]) if rel else (args[0], args[1])
            x, y, sx, sy = nx, ny, nx, ny
            out.append(f"M{_num(x)} {_num(y)}"); cmd = "l" if rel else "L"; continue
        if C == "L":
            x, y = (x + args[0], y + args[1]) if rel else (args[0], args[1])
            out.append(f"L{_num(x)} {_num(y)}")
        elif C == "H":
            x = x + args[0] if rel else args[0]
            out.append(f"L{_num(x)} {_num(y)}")
        elif C == "V":
            y = y + args[0] if rel else args[0]
            out.append(f"L{_num(x)} {_num(y)}")
        elif C in ("C", "S", "Q", "T"):
            pts = []
            for k in range(0, n, 2):
                px, py = args[k], args[k + 1]
                pts += [(x + px, y + py) if rel else (px, py)]
            x, y = pts[-1]
            out.append(C + " ".join(f"{_num(a)} {_num(b)}" for a, b in pts))
        elif C == "A":
            ex, ey = (x + args[5], y + args[6]) if rel else (args[5], args[6])
            out.append(f"A{_num(args[0])} {_num(args[1])} {_num(args[2])} "
                       f"{int(args[3])} {int(args[4])} {_num(ex)} {_num(ey)}")
            x, y = ex, ey
    return " ".join(out)


def _bbox(d):
    toks = _TOK.findall(d)
    i, pts = 0, []
    x = y = 0.0
    cmd = None
    while i < len(toks):
        if toks[i].isalpha():
            cmd = toks[i]; i += 1
            if cmd in "Zz": continue
        n = _NA[cmd.upper()]
        args = [float(t) for t in toks[i:i + n]]; i += n
        rel = cmd.islower(); C = cmd.upper()
        if C == "M" or C == "L":
            nx, ny = (x + args[0], y + args[1]) if rel else (args[0], args[1])
            x, y = nx, ny; pts.append((x, y))
        elif C == "H":
            x = x + args[0] if rel else args[0]; pts.append((x, y))
        elif C == "V":
            y = y + args[0] if rel else args[0]; pts.append((x, y))
        elif C in ("C", "S", "Q", "T"):
            for k in range(0, n, 2):
                px, py = args[k], args[k + 1]
                pts.append((x + px, y + py) if rel else (px, py))
            x, y = (x + args[-2], y + args[-1]) if rel else (args[-2], args[-1])
        elif C == "A":
            ex, ey = (x + args[5], y + args[6]) if rel else (args[5], args[6])
            pts += _arc_points(x, y, args[0], args[1], args[2], int(args[3]), int(args[4]), ex, ey)
            x, y = ex, ey
    if not pts:
        return (0, 0, 24, 24)
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    return (min(xs), min(ys), max(xs), max(ys))


_SHAPE = re.compile(r"<(path|circle|ellipse|rect|line|polyline|polygon)\b([^>]*?)/?>")


def _shape_to_d(tag, a):
    if tag == "path":
        return a.get("d")
    if tag == "circle":
        cx, cy, r = float(a["cx"]), float(a["cy"]), float(a["r"])
        return f"M{cx-r} {cy} a{r} {r} 0 1 0 {2*r} 0 a{r} {r} 0 1 0 {-2*r} 0 Z"
    if tag == "ellipse":
        cx, cy = float(a["cx"]), float(a["cy"]); rx, ry = float(a["rx"]), float(a["ry"])
        return f"M{cx-rx} {cy} a{rx} {ry} 0 1 0 {2*rx} 0 a{rx} {ry} 0 1 0 {-2*rx} 0 Z"
    if tag == "rect":
        x, y = float(a.get("x", 0)), float(a.get("y", 0))
        w, h = float(a["width"]), float(a["height"]); rx = float(a.get("rx", 0) or 0)
        if rx <= 0:
            return f"M{x} {y} H{x+w} V{y+h} H{x} Z"
        return (f"M{x+rx} {y} H{x+w-rx} A{rx} {rx} 0 0 1 {x+w} {y+rx} V{y+h-rx} "
                f"A{rx} {rx} 0 0 1 {x+w-rx} {y+h} H{x+rx} A{rx} {rx} 0 0 1 {x} {y+h-rx} "
                f"V{y+rx} A{rx} {rx} 0 0 1 {x+rx} {y} Z")
    if tag == "line":
        return f"M{a['x1']} {a['y1']} L{a['x2']} {a['y2']}"
    if tag in ("polyline", "polygon"):
        nums = re.findall(r"[-+]?[0-9]*\.?[0-9]+", a["points"])
        pr = list(zip(nums[0::2], nums[1::2]))
        return "M" + " L".join(f"{u} {v}" for u, v in pr) + (" Z" if tag == "polygon" else "")
    return None


_ICON_CACHE = {}


def icon_path(name):
    """One absolute, measured path per icon (cached)."""
    if name in _ICON_CACHE:
        return _ICON_CACHE[name]
    svg = open(os.path.join(ICON_DIR, name + ".svg")).read()
    parts, box = [], None
    for m in _SHAPE.finditer(svg):
        attrs = dict(re.findall(r'([a-zA-Z-]+)="([^"]*)"', m.group(2)))
        d = _shape_to_d(m.group(1), attrs)
        if not d:
            continue
        d = _absolutize(d)
        parts.append(d)
        bx = _bbox(d)
        box = bx if box is None else (min(box[0], bx[0]), min(box[1], bx[1]),
                                      max(box[2], bx[2]), max(box[3], bx[3]))
    merged = " ".join(parts)
    _ICON_CACHE[name] = (merged, box or (0, 0, 24, 24))
    return _ICON_CACHE[name]


# ───────────────────────────────────────────── document ──────────────────
class Doc:
    def __init__(self):
        self.cmds = []
        self.default_parent = None
        self.sections = []

    # the ONE primitive
    _KNOWN = {"type", "x", "y", "width", "height", "parent", "index", "name",
              "text", "characters", "path", "points", "closed", "props", "select"}

    def node(self, **kw):
        parent = kw.pop("parent", None) or self.default_parent
        props = kw.pop("props", None) or {}
        # any style key (fill, stroke, clip, cornerRadius, layout…) is a node.set prop
        for k in [k for k in kw if k not in self._KNOWN]:
            props[k] = kw.pop(k)
        p = {k: v for k, v in kw.items() if v is not None}
        if props:
            p["props"] = props
        if parent:
            p["parent"] = {"$ref": parent["ref"]}
        ref = "n%d" % len(self.cmds)
        self.cmds.append({"command": "node.create", "as": ref, "params": p})
        return {"ref": ref}

    def set_default_parent(self, n):
        self.default_parent = n
        return n

    def setprops(self, node, **props):
        self.cmds.append({"command": "node.set",
                          "params": {"ids": [{"$ref": node["ref"]}], "props": props}})

    # shapes
    def rect(self, name, x, y, w, h, **kw):
        return self.node(type="rectangle", name=name, x=x, y=y, width=w, height=h, **kw)

    def ell(self, name, x, y, w, h, **kw):
        return self.node(type="ellipse", name=name, x=x, y=y, width=w, height=h, **kw)

    def frame(self, name, x, y, w, h, **kw):
        return self.node(type="frame", name=name, x=x, y=y, width=w, height=h, **kw)

    def img(self, name, photo, x, y, w, h, parent=None, mode="crop"):
        p = {"path": photo, "name": name, "x": x, "y": y, "width": w, "height": h, "mode": mode}
        par = parent or self.default_parent
        if par:
            p["parent"] = {"$ref": par["ref"]}
        ref = "n%d" % len(self.cmds)
        self.cmds.append({"command": "image.place", "as": ref, "params": p})
        return {"ref": ref}

    # ── type ─────────────────────────────────────────────────────────
    def text(self, name, x, y, s, style, parent=None, color=None, width=None,
             align="left", family=None, size=None, line_height=None, **kw):
        sz, st, lh, ls, col = T.TYPE[style]
        fam = family or T.SANS
        props = {"fontFamily": fam, "fontStyle": st, "fontSize": size or sz,
                 "lineHeight": line_height or lh, "letterSpacing": ls,
                 "fill": color or col}
        if width:
            props["textAutoResize"] = kw.pop("autoresize", "height")
        if align != "left":
            props["textAlign"] = align
        props.update(kw)
        p = {"type": "text", "name": name, "x": x, "y": y, "text": s, "props": props}
        if width:
            p["width"] = width
        par = parent or self.default_parent
        if par:
            p["parent"] = {"$ref": par["ref"]}
        ref = "n%d" % len(self.cmds)
        self.cmds.append({"command": "node.create", "as": ref, "params": p})
        return {"ref": ref}

    def label(self, name, x, cap_y, s, style, **kw):
        """Text whose cap-height centre sits on cap_y."""
        sz, st, lh, ls, col = T.TYPE[style]
        fam = kw.pop("family", None) or T.SANS
        f = CAP.get(fam, CAP["Archivo"])
        return self.text(name, x, cap_y - f * sz, s, style, family=fam, **kw)

    def para(self, name, x, top, s, style, width, **kw):
        """Wrapped paragraph: `top` is the ink top, not the line-box top."""
        sz, st, lh, ls, col = T.TYPE[style]
        fam = kw.pop("family", None) or T.SANS
        f = CAP.get(fam, CAP["Archivo"])
        # line box top = cap top + (lineHeight - capHeight)/2 approximation
        return self.text(name, x, top - (sz - f * sz) - (lh - sz) / 2, s, style,
                         width=width, family=fam, **kw)

    def note(self, name, x, cap_y, s, color=None, bold=False, size=10, align="left", **kw):
        style = "note"
        sz, st, lh, ls, col = T.TYPE[style]
        props = {"fontFamily": T.MONO, "fontStyle": "Bold" if bold else "Regular",
                 "fontSize": size, "lineHeight": lh, "letterSpacing": ls,
                 "fill": color or col,
                 "textCase": "original" if kw.pop("orig", False) else "upper"}
        props.update(kw)
        # Courier Prime is monospaced (0.6em advance): measure it, never guess
        w = len(s) * (0.6 * size + ls)
        if align == "right":
            x -= w
        elif align == "center":
            x -= w / 2
        y = cap_y - CAP[T.MONO] * size
        p = {"type": "text", "name": name, "x": x, "y": y, "text": s, "props": props}
        par = self.default_parent
        if par:
            p["parent"] = {"$ref": par["ref"]}
        ref = "n%d" % len(self.cmds)
        self.cmds.append({"command": "node.create", "as": ref, "params": p})
        return {"ref": ref}

    # ── rules ────────────────────────────────────────────────────────
    def hline(self, x, y, w, color=None, weight=1, parent=None):
        return self.rect("rule", x, y, w, weight, fill=color or T.RULE, parent=parent)

    def vline(self, x, y, h, color=None, weight=1, parent=None):
        return self.rect("rule-v", x, y, weight, h, fill=color or T.RULE, parent=parent)

    def ink_rule(self, x, y, w, weight=2, parent=None):
        return self.rect("ink-rule", x, y, w, weight, fill=T.INK, parent=parent)

    # ── icons ────────────────────────────────────────────────────────
    def icon(self, name, cx, cy, size, color, stroke=2.3, parent=None):
        d, (x0, y0, x1, y1) = icon_path(name)
        s = size / max(x1 - x0, y1 - y0)
        w = (x1 - x0) * s
        par = parent or self.default_parent
        p = {"type": "vector", "name": "icon/" + name,
             "x": cx - w / 2 - x0 * s, "y": cy - (y1 - y0) * s / 2 - y0 * s,
             "path": d, "width": w,
             "props": {"stroke": color, "strokeWeight": stroke * size / 24,
                       "strokeCap": "round", "strokeJoin": "round", "fill": "none"}}
        if par:
            p["parent"] = {"$ref": par["ref"]}
        ref = "n%d" % len(self.cmds)
        self.cmds.append({"command": "node.create", "as": ref, "params": p})
        return {"ref": ref}

    # ── output ───────────────────────────────────────────────────────
    def save(self, path):
        with open(path, "w") as f:
            json.dump(self.cmds, f, indent=1)
        return path

    def run(self, path, out, quiet=True):
        self.save(path)
        r = subprocess.run([CLI, "run", path, "--out", out],
                           capture_output=True, text=True)
        bad = [l for l in r.stdout.splitlines() if '"ok":false' in l]
        if bad or r.returncode != 0:
            print("RUN FAILED")
            for l in bad[:6]:
                print(" ", l[:400])
            print(r.stderr[-1500:])
            return False
        if not quiet:
            print(r.stdout[-400:])
        return True


# ───────────────────────────────────────────── components ────────────────
def photo(d, name, slug, x, y, w, h, parent=None):
    return d.img(name, os.path.join(PHOTO_DIR, slug + ".jpg"), x, y, w, h, parent=parent)
