import { redirect } from "next/navigation";
import { connection } from "next/server";

import { getSession, type SessionUser } from "./auth";

/**
 * Sesi pembeli yang sudah diperiksa ke database. `connection()` menahan
 * perenderan statis karena sesi membaca cookie dan jam sekarang.
 */
export async function getCustomer(): Promise<Extract<SessionUser, { type: "customer" }> | null> {
  await connection();
  const session = await getSession("customer");
  if (!session || session.type !== "customer") return null;
  return session;
}

/** Halaman akun: pembeli yang belum masuk dikirim ke form masuk. */
export async function requireCustomer(
  next = "/account",
): Promise<Extract<SessionUser, { type: "customer" }>> {
  const session = await getCustomer();
  if (!session) redirect(`/login?next=${encodeURIComponent(next)}`);
  return session;
}
