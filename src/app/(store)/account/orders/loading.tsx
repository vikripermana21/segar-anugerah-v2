import CartButton from "../../_components/cart-button";
import { PageBar } from "../../_components/app-bar";

export default function OrdersLoading() {
  return (
    <div className="min-h-dvh">
      <PageBar title="Pesanan saya" backHref="/account" right={<CartButton size={36} />} />
      <main className="page pb-[calc(84px+env(safe-area-inset-bottom))] pt-1">
        <div className="flex gap-1.5">
          {[54, 92, 68, 62].map((width, index) => (
            <span
              key={index}
              className="h-[29px] animate-pulse rounded-full bg-surface-2"
              style={{ width }}
            />
          ))}
        </div>
        <p className="mt-4 flex items-center gap-2 text-[10.5px] text-ink-3">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-ink-3 border-t-transparent" />
          Memuat pesanan…
        </p>
        <div className="mt-3 space-y-2.5">
          {[0, 1, 2].map((index) => (
            <div key={index} className="rounded-[15px] border border-border bg-surface p-3.5">
              <div className="flex items-center justify-between">
                <span className="h-3 w-28 animate-pulse rounded bg-surface-2" />
                <span className="h-[18px] w-24 animate-pulse rounded-full bg-surface-2" />
              </div>
              <span className="mt-2 block h-2.5 w-24 animate-pulse rounded bg-surface-2" />
              <span className="mt-3 block h-3 w-16 animate-pulse rounded bg-surface-2" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
