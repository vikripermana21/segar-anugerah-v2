"use client";

import Link from "./transition-link";
import { useActionState, useEffect, useState } from "react";
import { ChevronRight, ClipboardList, Eye, EyeOff, MapPin } from "lucide-react";
import type { ActionState } from "@/lib/action-state";
import { changePassword, updateProfile } from "../_actions/account";
import { customerLogout } from "../_actions/auth";
import TabBar from "./tab-bar";

const initialState: ActionState = {};

export type ProfileCustomer = {
  name: string;
  phone: string;
  memberSince: string;
};

export default function ProfileView({ customer }: { customer: ProfileCustomer }) {
  const [profileState, profileAction, profilePending] = useActionState(
    updateProfile,
    initialState,
  );
  const [passwordState, passwordAction, passwordPending] = useActionState(
    changePassword,
    initialState,
  );
  const [name, setName] = useState(customer.name);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    if (!passwordState.ok) return;
    // Kolom sandi dikosongkan setelah server menyimpan.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPassword("");
    setNewPassword("");
  }, [passwordState]);

  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <>
      <main className="page pb-[calc(84px+env(safe-area-inset-bottom))] pt-1 lg:pb-16">
        <div className="mx-auto max-w-[760px]">
          <div className="flex items-center gap-3">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand-soft text-[18px] font-bold text-brand">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-bold">{name}</p>
              <p className="mt-0.5 truncate text-[10.5px] text-ink-3">
                {customer.phone} · {customer.memberSince}
              </p>
            </div>
          </div>

          <div className="mt-3.5 space-y-3 lg:grid lg:grid-cols-2 lg:items-start lg:gap-3 lg:space-y-0">
            <form action={profileAction} className="rounded-2xl border border-border bg-surface p-4">
              <h2 className="text-[12.5px] font-bold">Data akun</h2>
              <div className="mt-3 space-y-3">
                <div>
                  <label htmlFor="profile-name" className="label block">
                    Nama
                  </label>
                  <input
                    id="profile-name"
                    name="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="field mt-1.5"
                  />
                </div>
                <div>
                  <label htmlFor="profile-phone" className="label block">
                    Nomor WhatsApp
                  </label>
                  <input
                    id="profile-phone"
                    value={customer.phone}
                    readOnly
                    className="field mt-1.5 bg-surface text-ink-2"
                  />
                  <p className="mt-1.5 text-[10.5px] leading-[1.45] text-ink-3">
                    Nomor ini dipakai untuk masuk. Hubungi admin untuk mengubahnya.
                  </p>
                </div>
              </div>
              {profileState.error ? (
                <p role="alert" className="mt-2 text-[11px] font-semibold text-danger">
                  {profileState.error}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={profilePending}
                className="btn-secondary mt-3 min-h-[40px] w-full rounded-[11px] text-[12px]"
              >
                {profilePending ? "Menyimpan…" : profileState.ok ? "Tersimpan" : "Simpan data"}
              </button>
            </form>

            <form action={passwordAction} className="rounded-2xl border border-border bg-surface p-4">
              <h2 className="text-[12.5px] font-bold">Ganti sandi</h2>
              <div className="mt-3 space-y-3">
                <div>
                  <label htmlFor="current-password" className="label block">
                    Sandi sekarang
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      id="current-password"
                      name="current"
                      type={showCurrent ? "text" : "password"}
                      value={currentPassword}
                      onChange={(event) => setCurrentPassword(event.target.value)}
                      className="field pr-11"
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent((value) => !value)}
                      aria-label={showCurrent ? "Sembunyikan sandi" : "Tampilkan sandi"}
                      className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-ink-3 hover:bg-surface-2"
                    >
                      {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="new-password" className="label block">
                    Sandi baru
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      id="new-password"
                      name="next"
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      className="field pr-11"
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew((value) => !value)}
                      aria-label={showNew ? "Sembunyikan sandi" : "Tampilkan sandi"}
                      className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-ink-3 hover:bg-surface-2"
                    >
                      {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="mt-1.5 text-[10.5px] leading-[1.45] text-ink-3">
                    Minimal 8 karakter.
                  </p>
                </div>
              </div>
              {passwordState.error ? (
                <p role="alert" className="mt-2 text-[11px] font-semibold text-danger">
                  {passwordState.error}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={passwordPending}
                className="btn-secondary mt-3 min-h-[40px] w-full rounded-[11px] text-[12px]"
              >
                {passwordPending
                  ? "Menyimpan…"
                  : passwordState.ok
                    ? "Sandi tersimpan"
                    : "Simpan sandi"}
              </button>
            </form>
          </div>

          <nav className="mt-3 overflow-hidden rounded-2xl border border-border bg-surface">
            <Link
              href="/account/orders"
              className="flex items-center gap-3 border-b border-border px-3.5 py-3 text-[12.5px] font-semibold"
            >
              <ClipboardList size={16} className="text-ink-2" />
              Pesanan saya
              <ChevronRight size={15} className="ml-auto text-ink-3" />
            </Link>
            <Link
              href="/account/addresses"
              className="flex items-center gap-3 px-3.5 py-3 text-[12.5px] font-semibold"
            >
              <MapPin size={16} className="text-ink-2" />
              Alamat saya
              <ChevronRight size={15} className="ml-auto text-ink-3" />
            </Link>
          </nav>

          <form action={customerLogout}>
            <button type="submit" className="btn-secondary mt-3 h-11 min-h-11 w-full rounded-[11px] text-[13px]">
              Keluar
            </button>
          </form>
        </div>
      </main>

      <TabBar />
    </>
  );
}
