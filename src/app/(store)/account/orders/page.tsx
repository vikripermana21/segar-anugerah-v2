import type { Metadata } from "next";
import { PageBar } from "../../_components/app-bar";
import OrdersView from "../../_components/orders-view";

export const metadata: Metadata = {
  title: "Pesanan saya",
};

export default function OrdersPage() {
  return (
    <div className="min-h-dvh">
      <PageBar title="Pesanan saya" backHref="/account" />
      <OrdersView />
    </div>
  );
}
