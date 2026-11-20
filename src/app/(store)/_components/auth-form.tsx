"use client";

import Link from "./transition-link";
import { useActionState, useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { storeFacts } from "@/lib/store-data";
import {
  customerLogin,
  customerRegister,
  type AuthState,
} from "../_actions/auth";

const initialState: AuthState = {};

export default function AuthForm({
  mode,
  next,
}: {
  mode: "login" | "register";
  next?: string;
}) {
  const [state, formAction, pending] = useActionState(
    mode === "login" ? customerLogin : customerRegister,
    initialState,
  );
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const isLogin = mode === "login";

  return (
    <main className="page pb-10 pt-4">
      <div className="mx-auto max-w-[520px]">
        <h1 className="font-display text-[27px] font-semibold leading-[1.2]">
          {isLogin ? "Masuk untuk melanjutkan" : "Buat akun"}
        </h1>
        <p className="mt-2 text-[11.5px] leading-[1.5] text-ink-2">
          {isLogin
            ? "Pesanan, alamat, dan riwayat belanja tersimpan di akun Anda."
            : "Daftar sekali, lalu pesanan dan alamat tersimpan otomatis."}
        </p>

        <form action={formAction} className="mt-5 space-y-3.5" noValidate>
          <input type="hidden" name="next" value={next ?? ""} />
          {!isLogin ? (
            <div>
              <label htmlFor="name" className="label block">
                Nama
              </label>
              <input
                id="name"
                name="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                className="field mt-1.5"
                placeholder="Nama lengkap"
              />
            </div>
          ) : null}

          <div>
            <label htmlFor="phone" className="label block">
              Nomor WhatsApp
            </label>
            <input
              id="phone"
              name="phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              inputMode="tel"
              autoComplete="tel"
              className="field mt-1.5"
              placeholder="08123456789"
            />
            <p className="mt-1.5 text-[10.5px] leading-[1.45] text-ink-3">
              {isLogin
                ? "Format 08xx, tanpa spasi atau tanda hubung."
                : "Nomor ini dipakai untuk masuk."}
            </p>
          </div>

          <div>
            <label htmlFor="password" className="label block">
              Sandi
            </label>
            <div className="relative mt-1.5">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={isLogin ? "current-password" : "new-password"}
                className="field pr-11"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-ink-3 hover:bg-surface-2"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {!isLogin ? (
              <p className="mt-1.5 text-[10.5px] leading-[1.45] text-ink-3">
                Minimal 8 karakter.
              </p>
            ) : null}
          </div>

          {state.error ? (
            <p role="alert" aria-live="polite" className="text-[11px] font-semibold text-danger">
              {state.error}
            </p>
          ) : null}
          {isLogin ? (
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10.5px] text-ink-3">Lupa sandi? Hubungi admin toko.</p>
              <a
                href={`https://wa.me/${storeFacts.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="text-[10.5px] font-bold text-brand"
              >
                Chat admin
              </a>
            </div>
          ) : null}

          <button type="submit" disabled={pending} className="btn-primary w-full">
            {pending ? (isLogin ? "Memeriksa…" : "Membuat akun…") : isLogin ? "Masuk" : "Daftar"}
          </button>

          {isLogin ? (
            <>
              <div className="flex items-center gap-2.5 py-1">
                <span className="h-px flex-1 bg-border" />
                <span className="text-[10px] text-ink-3">atau</span>
                <span className="h-px flex-1 bg-border" />
              </div>
              <Link href={`/register${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="btn-secondary w-full">
                Daftar akun baru
              </Link>
            </>
          ) : (
            <Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="btn-secondary w-full">
              Sudah punya akun? Masuk
            </Link>
          )}
        </form>

        {isLogin ? (
          <p className="mt-5 text-center text-[10px] leading-[1.5] text-ink-3">
            Dengan masuk, Anda menyetujui pesanan diproses sesuai alamat yang tersimpan.
          </p>
        ) : (
          <div className="mt-4 flex gap-2.5 rounded-xl bg-surface-2 px-3 py-2.5">
            <Lock size={14} className="mt-0.5 shrink-0 text-ink-2" />
            <p className="text-[10.5px] leading-[1.45] text-ink-2">
              Nama, nomor, dan alamat hanya dipakai untuk mengantar pesanan.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
