import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import type { AddressRow, DeliveryArea } from "@/lib/address-types";
import { findArea, getCustomerAddress } from "@/lib/checkout-data";
import { requireCustomer } from "@/lib/customer-guard";
import { getCustomerOrder } from "@/lib/order-view";

import { PageBar } from "../../_components/app-bar";
import PaymentView from "../../_components/payment-view";

export const metadata: Metadata = {
  title: "Pembayaran",
};

type SearchParams = Promise<{
  order?: string;
  address?: string;
  kecamatan?: string;
  city?: string;
  note?: string;
}>;

export default async function PaymentPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const session = await requireCustomer(
    params.order ? `/account/orders/${params.order}` : "/checkout/payment",
  );

  let element: React.ReactNode;

  if (params.order) {
    const order = await getCustomerOrder(session.id, params.order);
    if (!order) notFound();
    if (order.status !== "pending_payment") redirect(`/account/orders/${order.number}`);
    if (order.paymentMethod === "whatsapp") {
      redirect(`/checkout/result?order=${encodeURIComponent(order.number)}`);
    }
    element = <PaymentView order={order} />;
  } else {
    const [address, area]: [AddressRow | null, DeliveryArea | null] = await Promise.all([
      params.address ? getCustomerAddress(session.id, params.address) : Promise.resolve(null),
      params.kecamatan && params.city
        ? findArea(params.kecamatan, params.city)
        : Promise.resolve(null),
    ]);
    if (!address || !area) redirect("/checkout");
    element = <PaymentView checkout={{ address, area }} note={params.note ?? ""} />;
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
        {element}
      </Suspense>
    </div>
  );
}
