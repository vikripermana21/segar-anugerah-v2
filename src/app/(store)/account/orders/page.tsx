import type { Metadata } from "next";

import { requireCustomer } from "@/lib/customer-guard";
import { listCustomerOrders } from "@/lib/order-view";

import { PageBar } from "../../_components/app-bar";
import OrdersView from "../../_components/orders-view";

export const metadata: Metadata = {
  title: "Pesanan saya",
};

export default async function OrdersPage() {
  const session = await requireCustomer("/account/orders");
  const orders = await listCustomerOrders(session.id);

  return (
    <div className="min-h-dvh">
      <PageBar title="Pesanan saya" backHref="/account" />
      <OrdersView orders={orders} />
    </div>
  );
}
