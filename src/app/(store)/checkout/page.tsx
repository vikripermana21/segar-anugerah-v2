import type { Metadata } from "next";

import { requireCustomer } from "@/lib/customer-guard";
import { getActiveAreas, getCustomerAddresses } from "@/lib/checkout-data";

import { PageBar } from "../_components/app-bar";
import CheckoutForm from "../_components/checkout-form";

export const metadata: Metadata = {
  title: "Checkout",
};

export default async function CheckoutPage() {
  const session = await requireCustomer("/checkout");

  const [addresses, areas] = await Promise.all([
    getCustomerAddresses(session.id),
    getActiveAreas(),
  ]);

  return (
    <div className="min-h-dvh">
      <PageBar title="Checkout" backHref="/cart" backLabel="Kembali ke keranjang" />
      <CheckoutForm addresses={addresses} areas={areas} />
    </div>
  );
}
