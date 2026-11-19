import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import bcrypt from "bcryptjs";
import { and, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";

import { db } from "@/db";
import { adminUser, customer, session } from "@/db/schema";

export const CUSTOMER_COOKIE = "sa_customer";
export const ADMIN_COOKIE = "sa_admin";
const SESSION_DAYS = 30;
const BCRYPT_ROUNDS = 10;

export type SessionSubject = "customer" | "admin";

export function normalizePhone(input: string): string {
  const digits = input.replace(/[^\d+]/g, "");
  if (digits.startsWith("+62")) return "0" + digits.slice(3);
  if (digits.startsWith("62")) return "0" + digits.slice(2);
  return digits;
}

export function isValidPhone(phone: string): boolean {
  return /^08\d{8,12}$/.test(phone);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function cookieName(subject: SessionSubject): string {
  return subject === "admin" ? ADMIN_COOKIE : CUSTOMER_COOKIE;
}

/** Membuat sesi di database dan menaruh token mentah di cookie httpOnly. */
export async function createSession(subject: SessionSubject, subjectId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await db.insert(session).values({
    tokenHash: hashToken(token),
    subjectType: subject,
    subjectId,
    expiresAt,
  });

  const store = await cookies();
  store.set(cookieName(subject), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export type SessionUser =
  | { type: "customer"; id: string; name: string; phone: string }
  | { type: "admin"; id: string; name: string; phone: string };

/** Membaca sesi aktif. Mengembalikan null bila tidak ada atau kedaluwarsa. */
export async function getSession(subject: SessionSubject): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(cookieName(subject))?.value;
  if (!token) return null;

  const rows = await db
    .select()
    .from(session)
    .where(and(eq(session.tokenHash, hashToken(token)), gt(session.expiresAt, new Date())))
    .limit(1);

  const row = rows[0];
  if (!row || row.subjectType !== subject) return null;

  if (subject === "admin") {
    const found = await db
      .select()
      .from(adminUser)
      .where(and(eq(adminUser.id, row.subjectId), eq(adminUser.isActive, true)))
      .limit(1);
    const admin = found[0];
    if (!admin) return null;
    return { type: "admin", id: admin.id, name: admin.name, phone: admin.phone };
  }

  const found = await db
    .select()
    .from(customer)
    .where(and(eq(customer.id, row.subjectId), eq(customer.isActive, true)))
    .limit(1);
  const buyer = found[0];
  if (!buyer) return null;
  return { type: "customer", id: buyer.id, name: buyer.name, phone: buyer.phone };
}

export async function destroySession(subject: SessionSubject): Promise<void> {
  const store = await cookies();
  const token = store.get(cookieName(subject))?.value;
  if (token) {
    await db.delete(session).where(eq(session.tokenHash, hashToken(token)));
  }
  store.delete(cookieName(subject));
}

/** Dipakai middleware: hanya memeriksa keberadaan cookie, bukan validitas database. */
export function hasSessionCookie(subject: SessionSubject, value: string | undefined): boolean {
  return Boolean(value && value.length >= 32);
}

export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
