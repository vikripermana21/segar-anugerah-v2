/** Ubah judul menjadi slug URL: "Ikan Nila Segar" → "ikan-nila-segar". */
export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return base || "produk";
}

/**
 * Cari slug unik dengan menambahkan akhiran angka bila sudah dipakai.
 * `taken` berisi slug yang sudah ada di database.
 */
export function uniqueSlug(desired: string, taken: Set<string>): string {
  if (!taken.has(desired)) return desired;

  for (let n = 2; n < 1000; n += 1) {
    const candidate = `${desired}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }

  return `${desired}-${Date.now().toString(36)}`;
}
