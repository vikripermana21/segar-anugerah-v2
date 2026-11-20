import { eq } from "drizzle-orm";
import type { Metadata } from "next";

import { db } from "@/db";
import { customer } from "@/db/schema";
import { requireCustomer } from "@/lib/customer-guard";

import { PageBar } from "../_components/app-bar";
import ProfileView, { type ProfileCustomer } from "../_components/profile-view";

export const metadata: Metadata = {
  title: "Akun",
};

function memberSinceLabel(date: Date): string {
  const label = new Intl.DateTimeFormat("id-ID", {
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date);
  return `Pelanggan sejak ${label}`;
}

export default async function AccountPage() {
  const session = await requireCustomer("/account");

  const rows = await db
    .select({ name: customer.name, phone: customer.phone, createdAt: customer.createdAt })
    .from(customer)
    .where(eq(customer.id, session.id))
    .limit(1);

  const buyer = rows[0];
  if (!buyer) return null;

  const profile: ProfileCustomer = {
    name: buyer.name,
    phone: buyer.phone,
    memberSince: memberSinceLabel(buyer.createdAt),
  };

  return (
    <div className="min-h-dvh">
      <PageBar title="Akun" backHref="/" />
      <ProfileView customer={profile} />
    </div>
  );
}
