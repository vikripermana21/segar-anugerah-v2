"""preview — export one PNG per top-level screen frame, by name.

Usage: python3 preview.py out/store.figcraft previews/store
Names come from the document itself (top-level frames), so nothing is
hand-maintained. Junk sub-frames are never exported.
"""
import json, os, subprocess, sys

CLI = os.path.expanduser("~/.local/bin/figcraft-cli")


def main():
    if len(sys.argv) < 3:
        print(__doc__); return
    src, outdir = sys.argv[1], sys.argv[2]
    os.makedirs(outdir, exist_ok=True)
    for f in os.listdir(outdir):
        if f.endswith(".png"):
            os.remove(os.path.join(outdir, f))
    info = json.loads(subprocess.run([CLI, "info", src, "--json"],
                                     capture_output=True, text=True).stdout)
    names = []
    for pg in info.get("pages", []):
        for fr in pg.get("frames", []):
            names.append(fr if isinstance(fr, str) else fr.get("name"))
    names = [n for n in names if n]
    for n in names:
        dst = os.path.join(outdir, n + ".png")
        r = subprocess.run([CLI, "export", src, "--out", dst, "--node", n, "--scale", "2"],
                           capture_output=True, text=True)
        print(("ok  " if os.path.exists(dst) else "FAIL") , n, r.stdout.strip()[:80])
    print(len(names), "frames ->", outdir)


if __name__ == "__main__":
    main()
