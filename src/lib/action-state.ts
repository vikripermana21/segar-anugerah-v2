/** Bentuk hasil aksi form admin yang seragam. */
export type ActionState = { error?: string; ok?: string };

/** Pesan untuk pelanggaran constraint Postgres yang umum di form admin. */
export function pgMessage(error: unknown, fallback = "Gagal menyimpan. Coba lagi."): string {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "";

  if (code === "23505") return "Data itu sudah ada. Pakai nama atau nomor lain.";
  if (code === "23503") return "Data ini masih dipakai di tempat lain.";
  if (code === "23502") return "Ada kolom wajib yang kosong.";

  return fallback;
}
