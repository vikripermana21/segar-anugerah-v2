import Link from "next/link";
import { Info } from "lucide-react";

import { db } from "@/db";
import { storeSetting } from "@/db/schema";

import { ActionForm } from "../_components/action-form";
import { Card, CardBody, CardHead, EmptyNote, inputClass } from "../_components/ui";
import { updateSettings } from "./actions";

export const instant = false;

function dateInputValue(value: Date | null): string {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

export default async function AdminSettingsPage() {
  const [settings] = await db.select().from(storeSetting).limit(1);

  if (!settings) {
    return (
      <>
        <h1 className="admin-h1">Pengaturan toko</h1>
        <div className="mt-6">
          <EmptyNote>
            Baris pengaturan belum ada. Jalankan <code>pnpm db:seed</code> untuk membuatnya.
          </EmptyNote>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="admin-h1">Pengaturan toko</h1>
          <p className="admin-sub">
            Berlaku untuk pesanan berikutnya, bukan pesanan yang sudah dibuat
          </p>
        </div>
        <Link href="/admin" className="admin-btn-ghost">
          Kembali ke dashboard
        </Link>
      </div>

      <ActionForm
        action={updateSettings}
        submitLabel="Simpan pengaturan"
        className="admin-split mt-5"
      >
        <div className="flex min-w-0 flex-col gap-4">
          <Card>
            <CardHead
              title="Identitas toko"
              note="Nama dan kontak yang dilihat pembeli di halaman toko"
            />
            <CardBody>
              <div className="flex flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="admin-label">
                    Nama toko
                    <input
                      name="storeName"
                      defaultValue={settings.storeName}
                      required
                      className={inputClass}
                    />
                  </label>

                  <label className="admin-label">
                    Nomor WhatsApp
                    <input
                      name="whatsapp"
                      defaultValue={settings.whatsapp ?? ""}
                      className={inputClass}
                    />
                    <span className="admin-help">Ditampilkan sebagai nomor bantuan.</span>
                  </label>
                </div>

                <label className="admin-label">
                  Alamat toko
                  <textarea
                    name="address"
                    rows={3}
                    defaultValue={settings.address ?? ""}
                    className={inputClass}
                  />
                </label>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHead title="Pesanan" note="Batas waktu yang mengatur kapan pesanan dikirim" />
            <CardBody>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="admin-label">
                  Jam cut-off pengiriman (WIB)
                  <input
                    name="orderCutoffHour"
                    type="number"
                    min={0}
                    max={23}
                    defaultValue={settings.orderCutoffHour}
                    className={inputClass}
                  />
                  <span className="admin-help">
                    Pesanan sebelum jam ini dikirim hari itu; setelahnya besok.
                  </span>
                </label>

                <label className="admin-label">
                  Masa berlaku pembayaran
                  <input
                    value="30 menit"
                    readOnly
                    aria-label="Masa berlaku pembayaran"
                    className={`${inputClass} bg-bg text-ink-3`}
                  />
                  <span className="admin-help">
                    Ditetapkan sistem dan disamakan dengan Midtrans.
                  </span>
                </label>
              </div>
            </CardBody>
          </Card>

          <p className="flex gap-2.5 rounded-[10px] border border-line px-3.5 py-3 text-[11px] leading-relaxed text-ink-3">
            <Info size={14} strokeWidth={1.9} className="mt-0.5 shrink-0" />
            Pengaturan berlaku untuk pesanan berikutnya. Pesanan yang sudah dibuat tidak berubah.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHead
              title="Gratis ongkir"
              note="Aktif untuk semua zona terlayani"
              action={
                <input
                  type="checkbox"
                  name="freeShippingActive"
                  defaultChecked={settings.freeShippingActive}
                  aria-label="Aktifkan gratis ongkir"
                  className="admin-check-switch"
                />
              }
            />
            <CardBody>
              <div className="flex flex-col gap-4">
                <label className="admin-label">
                  Berlaku sampai
                  <input
                    name="freeShippingUntil"
                    type="date"
                    defaultValue={dateInputValue(settings.freeShippingUntil)}
                    className={inputClass}
                  />
                  <span className="admin-help">
                    Kosongkan bila gratis ongkir tanpa batas tanggal. Setelah tanggal ini ongkir
                    kembali normal tanpa tindakan admin.
                  </span>
                </label>

                <label className="admin-label">
                  Minimal belanja (Rp)
                  <input
                    name="freeShippingMinSubtotal"
                    type="number"
                    min={0}
                    defaultValue={settings.freeShippingMinSubtotal}
                    className={inputClass}
                  />
                  <span className="admin-help">0 berarti tanpa syarat minimal belanja.</span>
                </label>

                <div className="h-px bg-line" />

                <p className="flex gap-2.5 text-[11px] leading-relaxed text-ink-2">
                  <Info size={13} strokeWidth={1.9} className="mt-0.5 shrink-0 text-ink-3" />
                  Potongan ongkir dicatat sebagai baris tersendiri di pesanan, bukan ongkir nol.
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      </ActionForm>
    </>
  );
}
