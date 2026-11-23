/**
 * Memindahkan foto contoh di public/products ke Cloudflare R2, lalu
 * memperbarui URL di database. Jalankan: pnpm storage:upload
 *
 * Aman diulang: kunci objek tetap (`products/seed/<nama>`), jadi unggahan
 * kedua menimpa berkas yang sama dan URL tidak berubah.
 */
import { config } from "dotenv";

config({ path: ".env.local" });
config();

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

async function main() {
  const { readdir, readFile } = await import("node:fs/promises");
  const path = await import("node:path");
  const { eq } = await import("drizzle-orm");
  const { db } = await import("../src/db");
  const { category, productImage } = await import("../src/db/schema");
  const { isR2Configured, putR2Object } = await import("../src/lib/r2");

  if (!isR2Configured()) {
    throw new Error(
      "R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_BASE_URL wajib diisi.",
    );
  }

  const folder = path.join(process.cwd(), "public", "products");
  const files = (await readdir(folder)).filter((file) => CONTENT_TYPES[path.extname(file).toLowerCase()]);

  if (files.length === 0) {
    console.log("Tidak ada foto di public/products.");
    return;
  }

  let imagesUpdated = 0;
  let categoriesUpdated = 0;

  for (const file of files) {
    const contentType = CONTENT_TYPES[path.extname(file).toLowerCase()];
    const key = `products/seed/${file}`;
    const body = new Uint8Array(await readFile(path.join(folder, file)));

    const publicUrl = await putR2Object(key, body, contentType);
    const oldUrl = `/products/${file}`;

    const images = await db
      .update(productImage)
      .set({ url: publicUrl })
      .where(eq(productImage.url, oldUrl))
      .returning({ id: productImage.id });

    const categories = await db
      .update(category)
      .set({ imageUrl: publicUrl })
      .where(eq(category.imageUrl, oldUrl))
      .returning({ id: category.id });

    imagesUpdated += images.length;
    categoriesUpdated += categories.length;

    console.log(`${file} → ${publicUrl} (${images.length} foto, ${categories.length} kategori)`);
  }

  console.log(
    `Selesai: ${files.length} berkas diunggah, ${imagesUpdated} baris foto dan ${categoriesUpdated} kategori diperbarui.`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
