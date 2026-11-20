import type { Metadata } from "next";
import { Suspense } from "react";
import PaymentResultView from "../../_components/payment-result-view";

export const metadata: Metadata = {
  title: "Pembayaran",
};

export default function PaymentResultPage() {
  return (
    <Suspense
      fallback={
        <div className="page pt-6">
          <div className="h-[300px] animate-pulse rounded-2xl bg-surface-2" />
        </div>
      }
    >
      <PaymentResultView />
    </Suspense>
  );
}
