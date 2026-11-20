"use client";

import Link from "./transition-link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Check, Phone } from "lucide-react";
import { customer, deliveryWindow, rupiah } from "@/lib/store-data";
import { useCart } from "../cart";
import { PageBar } from "./app-bar";

export default function PaymentResultView() {
  const searchParams = useSearchParams();
  const order = searchParams.get("order") ?? "SA-261119-4821";
  const total = Number(searchParams.get("total") ?? 106000);
  const paid = searchParams.get("paid") === "1";
  const { clear } = useCart();
  const [time, setTime] = useState("");
  const [delivery, setDelivery] = useState<{ shipsToday: boolean; dateLabel: string } | null>(null);

  useEffect(() => {
    if (paid) clear();
  }, [paid, clear]);

  useEffect(() => {
    const now = new Date();
    // Waktu dihitung setelah mount supaya cocok dengan jam perangkat.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTime(
      new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Jakarta",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
        .format(now)
        .replace(".", ".") + " WIB",
    );
    setDelivery(deliveryWindow(now));
  }, []);

  return (
    <div className="min-h-dvh">
      <PageBar title="Pembayaran" backHref="/account/orders" backLabel="Tutup" close />

      <main className="page pb-10 pt-2">
        <div className="mx-auto max-w-[520px]">
          <section className="flex flex-col items-center gap-2 pt-4 text-center">
            <span className="grid h-[76px] w-[76px] place-items-center rounded-full bg-brand-soft text-brand">
              <Check size={32} strokeWidth={2.2} />
            </span>
            <h1 className="mt-1 font-display text-[24px] font-semibold">Pembayaran berhasil</h1>
            <p className="max-w-[38ch] text-[11.5px] leading-[1.5] text-ink-2">
              Pesanan {order} sudah dibayar dan diteruskan ke toko.
            </p>
          </section>

          <section className="mt-4 rounded-2xl border border-border bg-surface p-4">
            <dl className="space-y-2.5">
              {[
                ["Nomor pesanan", order],
                ["Total dibayar", rupiah(Number.isFinite(total) ? total : 106000)],
                ["Metode", "QRIS"],
                ["Waktu", time || "—"],
                ["Dikirim", delivery?.shipsToday === false ? "Besok" : "Hari ini"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-3 text-[12px]"
                >
                  <dt className="text-ink-2">{label}</dt>
                  <dd className={`tabular text-right ${label === "Nomor pesanan" ? "font-bold" : "font-medium"}`}>
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <div className="mt-3 flex gap-2.5 rounded-[14px] bg-surface-2 px-3 py-3">
            <span className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full bg-white/70 text-ink-2">
              <Phone size={14} />
            </span>
            <div>
              <p className="text-[12px] font-bold text-ink-2">Kurir menghubungi sebelum antar</p>
              <p className="mt-0.5 text-[11px] leading-[1.45] text-ink-2">
                Kurir toko akan menelepon {customer.phone} sebelum mengantar. Pastikan nomor aktif.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2.5">
            <Link href="/account/orders" className="btn-primary w-full">
              Lihat pesanan
            </Link>
            <Link href="/products" className="btn-secondary w-full">
              Belanja lagi
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
