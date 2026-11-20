import type { Metadata } from "next";

import { requireCustomer } from "@/lib/customer-guard";
import { listCustomerOrders } from "@/lib/order-view";
import { orderFilters } from "@/lib/order-status";

import { PageBar } from "../../_components/app-bar";
import OrdersView from "../../_components/orders-view";

export const metadata: Metadata = {
  title: "Pesanan saya",
};

type SearchParams = Promise<{ status?: string }>;

export default async function OrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const { status } = await searchParams;
  const filter = orderFilters.find((item) => item.key === status) ?? orderFilters[0];

  const session = await requireCustomer("/account/orders");
  const page = await listCustomerOrders(session.id, { statuses: filter.statuses });

  return (
    <div className="min-h-dvh">
      <PageBar title="Pesanan saya" backHref="/account" />
      <OrdersView
        initialOrders={page.orders}
        initialCursor={page.nextCursor}
        initialFilter={filter.key}
      />
    </div>
  );
}
