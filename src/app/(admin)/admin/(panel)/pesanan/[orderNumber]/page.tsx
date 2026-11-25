import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Ban,
  CheckCircle2,
  Clock,
  CreditCard,
  MapPin,
  MessageCircle,
  Phone,
  RotateCcw,
  Truck,
} from "lucide-react";

import { requireAdmin } from "@/lib/admin-guard";
import { getAdminOrder } from "@/lib/admin-orders";
import type { OrderStatus } from "@/lib/order-status";
import { rupiah } from "@/lib/store-data";

import { ActionForm } from "../../_components/action-form";
import {
  Badge,
  Card,
  CardBody,
  CardHead,
  EmptyNote,
  btnDanger,
  btnSecondary,
  inputClass,
} from "../../_components/ui";
import { changeOrderStatus } from "../actions";
import { CopyOrderItems } from "./_components/copy-order-items";

export const instant = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}): Promise<Metadata> {
  const { orderNumber } = await params;
  return { title: `Pesanan ${orderNumber}` };
}

function statusTone(status: OrderStatus): "muted" | "warn" | undefined {
  if (status === "paid_late" || status === "pending_payment") return "warn";
  if (status === "cancelled" || status === "expired" || status === "refunded") return "muted";
  return undefined;
}

function actorLabel(value: string): string {
  if (value === "system:midtrans") return "Sistem · Midtrans";
  if (value === "system:cron") return "Sistem · penjadwal";
  return value;
}

function waHref(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const international = digits.startsWith("0") ? `62${digits.slice(1)}` : digits;
  return `https://wa.me/${international}`;
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  await requireAdmin();

  const { orderNumber } = await params;
  const order = await getAdminOrder(orderNumber);
  if (!order) notFound();

  const copyText = order.items
    .map((item) => `${item.quantity} x ${item.name} ${item.variant}`)
    .join("\n");

  return (
    <>
      <Link href="/admin/pesanan" className="admin-link">
        ← Semua pesanan
      </Link>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="admin-h1">{order.number}</h1>
          <p className="admin-sub">
            Dibuat {order.createdAtLabel} · {order.customer.name} · {order.customer.phone}
          </p>
        </div>
        <Badge tone={statusTone(order.status)}>{order.statusLabel}</Badge>
      </div>

      {order.status === "paid_late" ? (
        <div className="admin-alert mt-4">
          <Clock size={18} strokeWidth={2} className="text-amber-600" />
          <div>
            <p className="text-[12.5px] font-semibold text-ink">
              Pembayaran masuk setelah pesanan kedaluwarsa
            </p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-ink-2">
              Stok sudah dikembalikan saat kedaluwarsa. Hubungi pembeli lewat WhatsApp, lalu
              catat dana dikembalikan setelah refund dilakukan di dashboard Midtrans. Jangan
              mengubah stok lagi.
            </p>
          </div>
        </div>
      ) : null}

      {order.status === "pending_payment" && order.paymentMethod === "whatsapp" ? (
        <div className="admin-alert mt-4">
          <Clock size={18} strokeWidth={2} className="text-amber-600" />
          <div>
            <p className="text-[12.5px] font-semibold text-ink">
              Menunggu konfirmasi transfer bank
            </p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-ink-2">
              Batas konfirmasi {order.expiresAtLabel}. Setelah itu pesanan dibatalkan otomatis
              dan stok dikembalikan. Hubungi pembeli lewat WhatsApp sebelum menandai dibayar.
            </p>
          </div>
        </div>
      ) : null}

      <div className="admin-split mt-5">
        <div className="flex min-w-0 flex-col gap-4">
          <Card>
            <CardHead
              title="Barang yang disiapkan"
              note={`${order.items.length} baris · dikirim ${order.deliveryDateLabel}`}
              action={<CopyOrderItems text={copyText} />}
            />

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Barang</th>
                    <th>Jumlah</th>
                    <th>Harga</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <span className="block font-medium text-ink">{item.name}</span>
                        <span className="admin-muted">{item.variant}</span>
                      </td>
                      <td className="tabular">{item.quantity}</td>
                      <td className="tabular whitespace-nowrap">{rupiah(item.unitPrice)}</td>
                      <td className="tabular whitespace-nowrap font-semibold text-ink">
                        {rupiah(item.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-line-soft px-5 py-4">
              <dl className="ml-auto flex w-full max-w-[320px] flex-col gap-2">
                <div className="flex items-center justify-between gap-3 text-[12.5px] text-ink-2">
                  <dt>Subtotal</dt>
                  <dd className="tabular font-medium text-ink">{rupiah(order.subtotal)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 text-[12.5px] text-ink-2">
                  <dt>Ongkir{order.zoneName ? ` · ${order.zoneName}` : ""}</dt>
                  <dd className="tabular font-medium text-ink">{rupiah(order.shippingFee)}</dd>
                </div>
                {order.shippingDiscount > 0 ? (
                  <div className="flex items-center justify-between gap-3 text-[12.5px] text-ink-2">
                    <dt>Potongan gratis ongkir</dt>
                    <dd className="tabular font-medium text-green-700">
                      −{rupiah(order.shippingDiscount)}
                    </dd>
                  </div>
                ) : null}
                <div className="mt-1 flex items-center justify-between gap-3 border-t border-line-soft pt-2.5 text-[13px]">
                  <dt className="font-semibold text-ink">Total dibayar</dt>
                  <dd className="tabular font-bold text-ink">{rupiah(order.total)}</dd>
                </div>
              </dl>
            </div>
          </Card>

          <Card>
            <CardHead title="Riwayat status" note="Perubahan terakhir di bawah" />
            <div className="admin-card-body">
              {order.history.length === 0 ? (
                <EmptyNote>Belum ada riwayat status.</EmptyNote>
              ) : (
                <ol className="flex flex-col">
                  {order.history.map((step, index) => {
                    const last = index === order.history.length - 1;
                    return (
                      <li key={step.id} className="flex gap-3">
                        <div className="flex w-2.5 flex-col items-center">
                          <span
                            className={`mt-1 h-[9px] w-[9px] shrink-0 rounded-full ${
                              last ? "border-[1.5px] border-green-600" : "bg-green-600"
                            }`}
                            aria-hidden="true"
                          />
                          {last ? null : <span className="w-px flex-1 bg-line-soft" />}
                        </div>
                        <div className={`min-w-0 flex-1 ${last ? "" : "pb-4"}`}>
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <p
                              className={`text-[12.5px] ${
                                last ? "font-semibold text-ink" : "font-medium text-ink-2"
                              }`}
                            >
                              {step.toLabel}
                            </p>
                            <p className="admin-muted">{step.timeLabel}</p>
                          </div>
                          <p className="mt-0.5 text-[10.5px] text-ink-3">
                            {actorLabel(step.changedBy)}
                            {step.note ? ` · ${step.note}` : ""}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <Card>
            <CardHead title="Aksi" note={order.statusNote} />
            <CardBody>
              <div className="flex flex-col gap-2.5">
                {order.actions.confirm ? (
                  <ActionForm
                    action={changeOrderStatus}
                    submitLabel="Tandai sudah dibayar"
                    pendingLabel="Mengonfirmasi…"
                    className="flex flex-col gap-2"
                  >
                    <input type="hidden" name="orderNumber" value={order.number} />
                    <input type="hidden" name="action" value="confirm" />
                    <p className="rounded-lg bg-surface-2 px-3 py-2 text-[10.5px] leading-relaxed text-ink-3">
                      Pastikan transfer sudah masuk sebelum menandai dibayar. Batas konfirmasi{" "}
                      {order.expiresAtLabel}.
                    </p>
                  </ActionForm>
                ) : null}

                {order.actions.dispatch ? (
                  <ActionForm
                    action={changeOrderStatus}
                    submitLabel="Sedang diantar"
                    pendingLabel="Mengubah status…"
                    className="flex flex-col gap-2"
                  >
                    <input type="hidden" name="orderNumber" value={order.number} />
                    <input type="hidden" name="action" value="dispatch" />
                    <p className="text-[11px] leading-relaxed text-ink-3">
                      Ubah setelah barang diserahkan ke kurir.
                    </p>
                  </ActionForm>
                ) : null}

                {order.actions.complete ? (
                  <ActionForm
                    action={changeOrderStatus}
                    submitLabel="Selesai"
                    pendingLabel="Menyelesaikan…"
                    className="flex flex-col gap-2"
                  >
                    <input type="hidden" name="orderNumber" value={order.number} />
                    <input type="hidden" name="action" value="complete" />
                    <p className="text-[11px] leading-relaxed text-ink-3">
                      Tandai setelah barang diterima pembeli.
                    </p>
                  </ActionForm>
                ) : null}

                {order.actions.refund ? (
                  <ActionForm
                    action={changeOrderStatus}
                    submitLabel="Catat dana dikembalikan"
                    pendingLabel="Mencatat…"
                    className="flex flex-col gap-2"
                  >
                    <input type="hidden" name="orderNumber" value={order.number} />
                    <input type="hidden" name="action" value="refund" />
                    <p className="rounded-lg bg-surface-2 px-3 py-2 text-[10.5px] leading-relaxed text-ink-3">
                      Kembalikan dana manual di dashboard Midtrans dulu. Tombol ini hanya
                      mencatat status.
                    </p>
                  </ActionForm>
                ) : null}

                {order.actions.cancel ? (
                  <details className="rounded-[9px] border border-danger-200">
                    <summary className="flex cursor-pointer items-center gap-2 px-3 py-2.5 text-[12px] font-semibold text-danger-600">
                      <Ban size={14} strokeWidth={2} />
                      Batalkan pesanan
                    </summary>
                    <div className="border-t border-danger-200 p-3">
                      <ActionForm
                        action={changeOrderStatus}
                        submitLabel="Batalkan pesanan"
                        pendingLabel="Membatalkan…"
                        submitClassName={`${btnDanger} w-full`}
                        className="flex flex-col gap-2"
                      >
                        <input type="hidden" name="orderNumber" value={order.number} />
                        <input type="hidden" name="action" value="cancel" />
                        <label className="admin-label">
                          Alasan pembatalan
                          <textarea
                            name="reason"
                            required
                            minLength={3}
                            maxLength={300}
                            rows={3}
                            placeholder="Mis. pembeli meminta batal lewat WhatsApp"
                            className={inputClass}
                          />
                        </label>
                        <p className="text-[10.5px] leading-relaxed text-ink-3">
                          Stok dikembalikan otomatis. Alasan tampil di riwayat pesanan.
                        </p>
                      </ActionForm>
                    </div>
                  </details>
                ) : null}

                {!order.actions.confirm &&
                !order.actions.dispatch &&
                !order.actions.complete &&
                !order.actions.cancel &&
                !order.actions.refund ? (
                  <EmptyNote>Tidak ada aksi untuk status ini.</EmptyNote>
                ) : null}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHead title="Pengiriman" />
            <CardBody>
              <p className="text-[12.5px] font-semibold text-ink">
                {order.address.recipientName}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-ink-2">
                <Phone size={12} strokeWidth={2} />
                {order.address.phone}
              </p>
              <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-ink-2">
                <MapPin size={13} strokeWidth={2} className="mt-0.5 shrink-0" />
                <span>
                  {order.address.addressLine}
                  {order.address.kelurahan ? `, ${order.address.kelurahan}` : ""}
                  {`, ${order.address.kecamatan}, ${order.address.city}`}
                  {order.address.postalCode ? ` ${order.address.postalCode}` : ""}
                </span>
              </p>
              {order.address.notes ? (
                <p className="mt-2 rounded-lg bg-surface-2 px-3 py-2 text-[10.5px] leading-relaxed text-ink-2">
                  Catatan alamat: {order.address.notes}
                </p>
              ) : null}
              {order.notes ? (
                <p className="mt-2 rounded-lg bg-surface-2 px-3 py-2 text-[10.5px] leading-relaxed text-ink-2">
                  Catatan pembeli: {order.notes}
                </p>
              ) : null}
              <p className="mt-3 text-[11px] font-semibold text-ink-2">
                Dikirim {order.deliveryDateLabel}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={waHref(order.customer.phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${btnSecondary} admin-btn-sm`}
                >
                  <MessageCircle size={14} strokeWidth={2} />
                  WhatsApp pembeli
                </a>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHead title="Pembayaran" />
            <CardBody>
              <dl className="flex flex-col gap-2 text-[12px]">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-ink-2">Metode</dt>
                  <dd className="font-medium text-ink">
                    {order.paymentMethod === "whatsapp"
                      ? "Transfer bank (WhatsApp)"
                      : (order.paymentMethod ?? "—")}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-ink-2">Dibayar</dt>
                  <dd className="text-right font-medium text-ink">{order.paidAtLabel ?? "—"}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-ink-2">Kedaluwarsa</dt>
                  <dd className="text-right font-medium text-ink">{order.expiresAtLabel}</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="shrink-0 text-ink-2">Midtrans</dt>
                  <dd className="break-all text-right font-mono text-[10.5px] text-ink-3">
                    {order.midtransOrderId}
                  </dd>
                </div>
                {order.midtransTransactionId ? (
                  <div className="flex items-start justify-between gap-3">
                    <dt className="shrink-0 text-ink-2">Transaksi</dt>
                    <dd className="break-all text-right font-mono text-[10.5px] text-ink-3">
                      {order.midtransTransactionId}
                    </dd>
                  </div>
                ) : null}
              </dl>

              {order.cancelledReason ? (
                <p className="mt-3 rounded-lg bg-danger-50 px-3 py-2 text-[10.5px] leading-relaxed text-danger-600">
                  Alasan batal: {order.cancelledReason}
                </p>
              ) : null}

              {order.events.length > 0 ? (
                <div className="mt-3 border-t border-line-soft pt-3">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-2">
                    <CreditCard size={13} strokeWidth={2} />
                    Notifikasi Midtrans
                  </p>
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {order.events.slice(0, 4).map((event) => (
                      <li key={event.id} className="text-[10.5px] leading-relaxed text-ink-3">
                        <span className="font-medium text-ink-2">{event.eventType}</span>
                        {event.transactionId ? ` · ${event.transactionId}` : ""} ·{" "}
                        {event.signatureValid ? "tanda tangan sah" : "tanda tangan gagal"} ·{" "}
                        {event.createdLabel}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </CardBody>
          </Card>

          <div className="flex flex-wrap gap-2">
            <Link href="/admin/pesanan?status=perlu-disiapkan" className={`${btnSecondary} admin-btn-sm`}>
              <Truck size={14} strokeWidth={2} />
              Perlu disiapkan
            </Link>
            <Link href="/admin/pesanan?status=selesai" className={`${btnSecondary} admin-btn-sm`}>
              <CheckCircle2 size={14} strokeWidth={2} />
              Selesai
            </Link>
            <Link href="/admin/pesanan?status=ditutup" className={`${btnSecondary} admin-btn-sm`}>
              <RotateCcw size={14} strokeWidth={2} />
              Dibatalkan
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
