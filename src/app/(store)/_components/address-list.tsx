"use client";

import { useActionState, useEffect, useState } from "react";
import { Info, Plus, X } from "lucide-react";

import type { AddressRow, DeliveryArea } from "@/lib/address-types";
import type { ActionState } from "@/lib/action-state";

import { deleteAddress, saveAddress, setDefaultAddress } from "../_actions/address";
import { PageBar } from "./app-bar";
import TabBar from "./tab-bar";

type Draft = {
  id: string | null;
  label: string;
  recipientName: string;
  phone: string;
  addressLine: string;
  kecamatan: string;
  postalCode: string;
  notes: string;
};

function emptyDraft(areas: DeliveryArea[]): Draft {
  const first = areas[0];
  return {
    id: null,
    label: "",
    recipientName: "",
    phone: "",
    addressLine: "",
    kecamatan: first?.kecamatan ?? "",
    postalCode: "",
    notes: "",
  };
}

const initialState: ActionState = {};

export default function AddressList({
  addresses,
  areas,
}: {
  addresses: AddressRow[];
  areas: DeliveryArea[];
}) {
  const [state, formAction, pending] = useActionState(saveAddress, initialState);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(areas));

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    // Dialog ditutup setelah server menyimpan; server tetap sumber kebenaran.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (state.ok) setOpen(false);
  }, [state]);

  function startAdd() {
    setDraft(emptyDraft(areas));
    setOpen(true);
  }

  function startEdit(address: AddressRow) {
    setDraft({
      id: address.id,
      label: address.label,
      recipientName: address.recipientName,
      phone: address.phone,
      addressLine: address.addressLine,
      kecamatan: address.kecamatan,
      postalCode: address.postalCode ?? "",
      notes: address.notes ?? "",
    });
    setOpen(true);
  }

  const city = areas.find((area) => area.kecamatan === draft.kecamatan)?.city ?? "";

  return (
    <>
      <PageBar
        title="Alamat saya"
        backHref="/account"
        right={
          <button
            type="button"
            onClick={startAdd}
            aria-label="Tambah alamat"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-ink transition-colors hover:bg-brand-soft"
          >
            <Plus size={17} />
          </button>
        }
      />

      <main className="page pb-[calc(84px+env(safe-area-inset-bottom))] pt-2 lg:pb-16">
        <div className="mx-auto max-w-[760px] space-y-2.5">
          {addresses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface px-4 py-6 text-center">
              <p className="text-[12.5px] font-bold">Belum ada alamat</p>
              <p className="mx-auto mt-1 max-w-[34ch] text-[10.5px] leading-[1.5] text-ink-3">
                Tambahkan alamat pengiriman supaya pesanan bisa diantar ke tempat yang benar.
              </p>
              <button type="button" onClick={startAdd} className="btn-primary mt-3 min-h-[38px] px-4 text-[12px]">
                Tambah alamat
              </button>
            </div>
          ) : null}

          {addresses.map((address) => (
            <article
              key={address.id}
              className="rounded-2xl border border-border bg-surface p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-[13px] font-bold">{address.label}</h2>
                {address.isDefault ? (
                  <span className="pill bg-brand-soft text-brand">Utama</span>
                ) : null}
              </div>
              <p className="mt-1.5 text-[11.5px] font-semibold">
                {address.recipientName} · {address.phone}
              </p>
              <p className="mt-1 text-[10.5px] leading-[1.5] text-ink-3">
                {address.addressLine}
              </p>
              {address.notes ? (
                <p className="mt-1 text-[10.5px] leading-[1.5] text-ink-3">
                  Catatan: {address.notes}
                </p>
              ) : null}

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => startEdit(address)}
                  className="inline-flex h-8 min-w-[72px] items-center justify-center rounded-lg border border-border px-3 text-[11.5px] font-bold"
                >
                  Ubah
                </button>
                {!address.isDefault ? (
                  <form action={setDefaultAddress}>
                    <input type="hidden" name="id" value={address.id} />
                    <button type="submit" className="px-1 text-[11px] font-bold text-ink-2">
                      Jadikan utama
                    </button>
                  </form>
                ) : null}
                <form action={deleteAddress}>
                  <input type="hidden" name="id" value={address.id} />
                  <button
                    type="submit"
                    className="px-1 text-[11px] font-bold text-ink-3 hover:text-danger"
                  >
                    Hapus
                  </button>
                </form>
              </div>
            </article>
          ))}

          <p className="flex items-start gap-2 px-1 pt-1 text-[10.5px] leading-[1.45] text-ink-3">
            <Info size={13} className="mt-0.5 shrink-0" />
            Pesanan lama menyimpan salinan alamatnya sendiri, jadi menghapus alamat di sini tidak
            mengubah pesanan yang sudah dibuat.
          </p>
        </div>
      </main>

      <TabBar />

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/30 backdrop-blur-sm sm:items-center"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="address-dialog-title"
            className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-bg p-5 sm:max-w-[480px] sm:rounded-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 id="address-dialog-title" className="font-display text-[20px] font-semibold">
                {draft.id ? "Ubah alamat" : "Tambah alamat"}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Tutup"
                className="grid h-8 w-8 place-items-center rounded-lg text-ink-2 hover:bg-surface-2"
              >
                <X size={17} />
              </button>
            </div>

            <form action={formAction} className="mt-4 space-y-3">
              <input type="hidden" name="id" value={draft.id ?? ""} />
              <input type="hidden" name="city" value={city} />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="addr-label" className="label block">Label</label>
                  <input
                    id="addr-label"
                    name="label"
                    value={draft.label}
                    onChange={(event) => setDraft({ ...draft, label: event.target.value })}
                    placeholder="Rumah"
                    autoFocus
                    className="field mt-1.5"
                  />
                </div>
                <div>
                  <label htmlFor="addr-kecamatan" className="label block">Kecamatan</label>
                  <select
                    id="addr-kecamatan"
                    name="kecamatan"
                    value={draft.kecamatan}
                    onChange={(event) => setDraft({ ...draft, kecamatan: event.target.value })}
                    className="field mt-1.5"
                  >
                    {areas.map((area) => (
                      <option key={`${area.kecamatan}|${area.city}`} value={area.kecamatan}>
                        {area.kecamatan}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="addr-name" className="label block">Nama penerima</label>
                <input
                  id="addr-name"
                  name="recipientName"
                  value={draft.recipientName}
                  onChange={(event) => setDraft({ ...draft, recipientName: event.target.value })}
                  className="field mt-1.5"
                />
              </div>

              <div>
                <label htmlFor="addr-phone" className="label block">Nomor WhatsApp</label>
                <input
                  id="addr-phone"
                  name="phone"
                  value={draft.phone}
                  onChange={(event) => setDraft({ ...draft, phone: event.target.value })}
                  inputMode="tel"
                  className="field mt-1.5"
                />
              </div>

              <div>
                <label htmlFor="addr-line" className="label block">Alamat lengkap</label>
                <textarea
                  id="addr-line"
                  name="addressLine"
                  value={draft.addressLine}
                  onChange={(event) => setDraft({ ...draft, addressLine: event.target.value })}
                  rows={3}
                  placeholder="Jl. Melati No. 12, RT 04/RW 02, Cilandak, Jakarta Selatan 12430"
                  className="field mt-1.5 h-[74px] resize-none py-2.5 text-[12px]"
                />
              </div>

              <div>
                <label htmlFor="addr-notes" className="label block">Catatan (opsional)</label>
                <input
                  id="addr-notes"
                  name="notes"
                  value={draft.notes}
                  onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
                  placeholder="Contoh: pagar hijau, titip ke penjaga"
                  className="field mt-1.5"
                />
              </div>

              {state.error ? (
                <p role="alert" className="text-[11px] font-semibold text-danger">
                  {state.error}
                </p>
              ) : null}

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="btn-secondary flex-1"
                >
                  Batal
                </button>
                <button type="submit" disabled={pending} className="btn-primary flex-1">
                  {pending ? "Menyimpan…" : "Simpan alamat"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
