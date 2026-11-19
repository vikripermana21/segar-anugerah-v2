/**
 * Seed akun admin + pengaturan toko.
 * Jalankan: pnpm db:seed
 *
 * Aman dijalankan berulang: akun yang sudah ada tidak ditimpa sandinya.
 *
 * Catatan: import dilakukan dinamis setelah .env.local dimuat, karena
 * import ESM dievaluasi sebelum baris kode mana pun berjalan — kalau
 * `src/db/index.ts` diimpor di atas, DATABASE_URL belum ada.
 */
import { config } from "dotenv";

config({ path: ".env.local" });
config();

async function main() {
  const { eq } = await import("drizzle-orm");
  const { db } = await import("../src/db");
  const { adminUser, storeSetting } = await import("../src/db/schema");
  const { hashPassword, isValidPhone, normalizePhone } = await import("../src/lib/auth");

  const name = process.env.SEED_ADMIN_NAME?.trim();
  const rawPhone = process.env.SEED_ADMIN_PHONE;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!name || !rawPhone || !password) {
    throw new Error(
      "SEED_ADMIN_NAME, SEED_ADMIN_PHONE, SEED_ADMIN_PASSWORD wajib diisi di .env.local",
    );
  }

  const phone = normalizePhone(rawPhone);
  if (!isValidPhone(phone)) {
    throw new Error(`Nomor admin tidak valid: ${phone}`);
  }
  if (password.length < 8) {
    throw new Error("Sandi admin minimal 8 karakter.");
  }

  const existing = await db.select().from(adminUser).where(eq(adminUser.phone, phone)).limit(1);

  if (existing.length > 0) {
    console.log(`Admin ${phone} sudah ada — dilewati.`);
  } else {
    await db.insert(adminUser).values({
      name,
      phone,
      passwordHash: await hashPassword(password),
    });
    console.log(`Admin pertama dibuat: ${name} (${phone})`);
  }

  const settings = await db.select().from(storeSetting).limit(1);
  if (settings.length > 0) {
    console.log("Pengaturan toko sudah ada — dilewati.");
  } else {
    await db.insert(storeSetting).values({
      id: 1,
      whatsapp: phone,
      orderCutoffHour: 16,
    });
    console.log("Pengaturan toko dibuat.");
  }

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
