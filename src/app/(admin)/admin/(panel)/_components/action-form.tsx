"use client";

import { useActionState } from "react";

import type { ActionState } from "@/lib/action-state";

import { btnPrimary } from "./ui";

/**
 * Bungkus form admin dengan `useActionState` supaya pesan galat dan status
 * pending seragam. Server action menerima `(state, formData)`.
 */
export function ActionForm({
  action,
  children,
  submitLabel,
  pendingLabel = "Menyimpan…",
  className = "flex flex-col gap-3",
  resetKey,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  submitLabel: string;
  pendingLabel?: string;
  className?: string;
  resetKey?: string | number;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form key={resetKey} action={formAction} className={className}>
      {children}

      {state.error ? (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      ) : null}

      {state.ok ? <p className="text-sm text-emerald-700">{state.ok}</p> : null}

      <button type="submit" disabled={pending} className={btnPrimary}>
        {pending ? pendingLabel : submitLabel}
      </button>
    </form>
  );
}
