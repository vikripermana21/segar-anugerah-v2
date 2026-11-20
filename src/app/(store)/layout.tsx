import { getCatalog, getStoreSettings } from "@/lib/catalog";

import { CartProvider } from "./cart";

export const instant = false;

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [{ products }, settings] = await Promise.all([getCatalog(), getStoreSettings()]);

  return (
    <CartProvider products={products} settings={settings}>
      {children}
    </CartProvider>
  );
}
