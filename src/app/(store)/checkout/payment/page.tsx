import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { requireCustomer } from "@/lib/customer-guard";
import { findArea, getCustomerAddress } from "@/lib/checkout-data";
import type { AddressRow, DeliveryArea } from "@/lib/address-types";

import { PageBar } from "../../_components/app-bar";
import PaymentView, { type PaymentCheckout } from "../../_components/payment-view";

export const metadata: Metadata = {
  title: "Pembayaran",
};

type SearchParams = Promise<{
  address?: string;
  kecamatan?: string;
  city?: string;
  note?: string;
  order?: string;
}>;

export default async function PaymentPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  // Pesanan contoh (belum tersambung database) tetap bisa dibuka ulang.
  let checkout: PaymentCheckout | null = null;
  if (!params.order) {
    const session = await requireCustomer("/checkout");
    const [address, area]: [AddressRow | null, DeliveryArea | null] = await Promise.all([
      params.address ? getCustomerAddress(session.id, params.address) : Promise.resolve(null),
      params.kecamatan && params.city
        ? findArea(params.kecamatan, params.city)
        : Promise.resolve(null),
    ]);
    if (!address || !area) redirect("/checkout");
    checkout = { address, area };
  }

  return (
    <div className="min-h-dvh">
      <PageBar title="Pembayaran" backHref="/checkout" />
      <Suspense
        fallback={
          <main className="page pt-2">
            <div className="h-[160px] animate-pulse rounded-2xl bg-surface-2" />
          </main>
        }
      >
        <PaymentView checkout={checkout} />
      </Suspense>
    </div>
  );
}
