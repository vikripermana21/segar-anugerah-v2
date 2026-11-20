"""sheet — one contact sheet per board, from the exported previews."""
import os, sys
from PIL import Image, ImageDraw

def sheet(src_dir, out, cols, thumb_w, pad=18, bg="#e9ece8", label_h=20):
    files = sorted(f for f in os.listdir(src_dir) if f.endswith(".png"))
    ims = []
    for f in files:
        im = Image.open(os.path.join(src_dir, f)).convert("RGB")
        k = thumb_w / im.width
        ims.append((f[:-4], im.resize((thumb_w, max(1, int(im.height * k))), Image.LANCZOS)))
    rows = (len(ims) + cols - 1) // cols
    row_h = [0] * rows
    for i, (_, im) in enumerate(ims):
        row_h[i // cols] = max(row_h[i // cols], im.height + label_h)
    W = cols * (thumb_w + pad) + pad
    H = sum(row_h) + pad * (rows + 1)
    sh = Image.new("RGB", (W, H), bg)
    d = ImageDraw.Draw(sh)
    y = pad
    for r in range(rows):
        x = pad
        for c in range(cols):
            i = r * cols + c
            if i >= len(ims):
                break
            name, im = ims[i]
            sh.paste(im, (x, y + label_h))
            d.text((x, y + 4), name, fill="#16233a")
            x += thumb_w + pad
        y += row_h[r] + pad
    sh.save(out)
    print(out, sh.size, len(ims), "screens")


if __name__ == "__main__":
    sheet("previews/store", "previews/store-sheet.png", cols=6, thumb_w=260)
    sheet("previews/admin", "previews/admin-sheet.png", cols=3, thumb_w=620)
