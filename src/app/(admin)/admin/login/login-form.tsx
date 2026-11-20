"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, Lock, Phone } from "lucide-react";

import { adminLogin, type LoginState } from "./actions";

const initialState: LoginState = {};

export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState(adminLogin, initialState);
  const [show, setShow] = useState(false);

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      <label className="admin-label">
        Nomor WhatsApp
        <span className="flex items-center gap-2 rounded-[9px] border border-line bg-surface px-3">
          <Phone size={15} strokeWidth={1.9} className="shrink-0 text-ink-3" />
          <input
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="username"
            placeholder="08xxxxxxxxxx"
            required
            className="h-[44px] min-w-0 flex-1 bg-transparent text-[13px] font-normal text-ink outline-none placeholder:text-ink-3"
          />
        </span>
      </label>

      <label className="admin-label">
        Sandi
        <span className="flex items-center gap-2 rounded-[9px] border border-line bg-surface px-3 focus-within:border-green-600">
          <Lock size={15} strokeWidth={1.9} className="shrink-0 text-ink-3" />
          <input
            name="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            required
            className="h-[44px] min-w-0 flex-1 bg-transparent text-[13px] font-normal text-ink outline-none"
          />
          <button
            type="button"
            onClick={() => setShow((value) => !value)}
            aria-label={show ? "Sembunyikan sandi" : "Lihat sandi"}
            className="shrink-0 text-ink-3 hover:text-ink"
          >
            {show ? <EyeOff size={16} strokeWidth={1.9} /> : <Eye size={16} strokeWidth={1.9} />}
          </button>
        </span>
      </label>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[12px]">
        <label className="flex items-center gap-2 font-normal text-ink-2">
          <input type="checkbox" name="remember" defaultChecked className="admin-check-switch" />
          Ingat saya di perangkat ini
        </label>
        <span className="font-semibold text-green-700">Lupa sandi?</span>
      </div>

      {state.error ? (
        <p role="alert" className="text-[12px] text-danger-600">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="admin-btn mt-1 h-12 text-[13.5px]"
      >
        {pending ? "Memeriksa…" : "Masuk"}
        <span aria-hidden="true">→</span>
      </button>
    </form>
  );
}
