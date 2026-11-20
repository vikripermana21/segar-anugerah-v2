"""Fetch product photography (key-free) into assets/photos.

Source: Openverse (api.openverse.org) — no key, generous anonymous limits.
Falls back to Wikimedia Commons' search API when Openverse has no usable hit.

Usage:  python3 fetch_photos.py [--force]
Writes assets/photos/<slug>.jpg plus assets/photos/_contact.png (labelled).
"""
import json, os, subprocess, sys, urllib.parse

DIR = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(DIR, "assets", "photos")
UA = "SegarAnugerahDesign/1.0 (UI mockup build)"

TARGETS = {
    "nila":    "tilapia fresh fish",
    "gurame":  "carp fish whole",
    "kembung": "mackerel fish",
    "udang":   "raw shrimp prawn",
    "lele":    "catfish",
    "mas":     "carp market fish",
    "kangkung": "water spinach",
    "bayam":   "spinach leaves",
    "cabai":   "red chilli peppers",
    "bawang":  "shallots",
    "telur":   "chicken eggs",
    "toko":    "vegetable market indonesia",
    "pasar":   "fish market indonesia",
    "sayur":   "vegetables market",
    "dapur":   "spices market",
}


def curl_json(url):
    r = subprocess.run(["curl", "-sSL", "-A", UA, "--max-time", "60", url],
                       capture_output=True, text=True)
    try:
        return json.loads(r.stdout)
    except Exception:
        return {}


def openverse(term, n=12):
    url = ("https://api.openverse.org/v1/images/?" +
           urllib.parse.urlencode({"q": term, "page_size": n, "mature": "false"}))
    d = curl_json(url)
    out = []
    for r in d.get("results", []):
        u = r.get("url")
        if not u:
            continue
        out.append({"title": r.get("title") or r.get("foreign_landing_url", "")[:60],
                    "url": u, "w": r.get("width") or 0, "h": r.get("height") or 0})
    return out


def commons(term, n=8):
    url = ("https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode({
        "action": "query", "format": "json", "generator": "search",
        "gsrsearch": f"filetype:bitmap {term}", "gsrnamespace": "6", "gsrlimit": str(n),
        "prop": "imageinfo", "iiprop": "url|size|mime", "iiurlwidth": "1400"}))
    d = curl_json(url)
    out = []
    for p in ((d.get("query") or {}).get("pages") or {}).values():
        ii = (p.get("imageinfo") or [{}])[0]
        if ii.get("mime") not in ("image/jpeg", "image/png"):
            continue
        out.append({"title": p.get("title", ""), "url": ii.get("thumburl") or ii.get("url"),
                    "w": ii.get("width") or 0, "h": ii.get("height") or 0})
    return out


def download(url, dest):
    subprocess.run(["curl", "-sSL", "-A", UA, "--max-time", "120", "-o", dest, url], check=False)
    return os.path.exists(dest) and os.path.getsize(dest) > 20000


def main():
    force = "--force" in sys.argv
    os.makedirs(OUT, exist_ok=True)
    manifest = {}
    for slug, term in TARGETS.items():
        dest = os.path.join(OUT, f"{slug}.jpg")
        if os.path.exists(dest) and not force:
            print("have", slug); manifest[slug] = "cached"; continue
        got = None
        for src in (openverse, commons):
            try:
                hits = src(term)
            except Exception as e:
                print(" ", src.__name__, "failed", e); continue
            for h in hits:
                if not h["url"]:
                    continue
                if not download(h["url"], dest):
                    continue
                try:
                    from PIL import Image
                    im = Image.open(dest).convert("RGB")
                    if min(im.size) < 480:
                        raise ValueError("too small")
                    im.thumbnail((1400, 1400))
                    im.save(dest, "JPEG", quality=86, optimize=True)
                    got = h["title"]
                    break
                except Exception as e:
                    print("  skip", str(h["title"])[:40], e)
            if got:
                break
        manifest[slug] = got
        print(f"{slug:10s} <- {got}")

    from PIL import Image, ImageDraw
    files = sorted(f for f in os.listdir(OUT) if f.endswith(".jpg"))
    if not files:
        print("no photos"); return
    tw, th, cols = 260, 210, 4
    rows = (len(files) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * tw, rows * (th + 24)), "#ffffff")
    d = ImageDraw.Draw(sheet)
    for i, f in enumerate(files):
        im = Image.open(os.path.join(OUT, f)).convert("RGB")
        im.thumbnail((tw - 8, th - 8))
        x, y = (i % cols) * tw, (i // cols) * (th + 24)
        sheet.paste(im, (x + 4, y + 4))
        d.text((x + 4, y + th + 4), f"{f}  {im.size[0]}x{im.size[1]}", fill="#111111")
    sheet.save(os.path.join(OUT, "_contact.png"))
    json.dump(manifest, open(os.path.join(OUT, "manifest.json"), "w"), indent=1)
    print("sheet:", os.path.join(OUT, "_contact.png"))


if __name__ == "__main__":
    main()
