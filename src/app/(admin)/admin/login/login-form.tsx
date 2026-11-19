"use client";

import { useActionState } from "react";

import { adminLogin, type LoginState } from "./actions";

const initialState: LoginState = {};

export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState(adminLogin, initialState);

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
        Nomor WhatsApp
        <input
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="username"
          placeholder="08xxxxxxxxxx"
          required
          className="rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-emerald-600"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
        Sandi
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-emerald-600"
        />
      </label>

      {state.error ? (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-md bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
      >
        {pending ? "Memeriksa…" : "Masuk"}
      </button>
    </form>
  );
}
