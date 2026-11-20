import { redirect } from "next/navigation";
import { connection } from "next/server";

import { getSession, type SessionUser } from "./auth";

/**
 * Penjaga setiap muatan data admin. Middleware hanya memeriksa cookie;
 * fungsi ini memeriksa sesi ke database dan status akun.
 *
 * `connection()` menahan perenderan statis: sesi membaca cookie dan jam
 * sekarang, dua hal yang tidak boleh ikut diprerender.
 */
export async function requireAdmin(): Promise<Extract<SessionUser, { type: "admin" }>> {
  await connection();

  const session = await getSession("admin");
  if (!session || session.type !== "admin") redirect("/admin/login");
  return session;
}
