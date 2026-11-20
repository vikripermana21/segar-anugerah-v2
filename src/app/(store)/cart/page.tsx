import type { Metadata } from "next";
import { PageBar } from "../_components/app-bar";
import CartView, { CartCount } from "../_components/cart-view";

export const metadata: Metadata = {
  title: "Keranjang",
};

export default function CartPage() {
  return (
    <div className="min-h-dvh">
      <PageBar title="Keranjang" backHref="/products" right={<CartCount />} />
      <CartView />
    </div>
  );
}
