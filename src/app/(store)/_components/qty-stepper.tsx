"use client";

import { Minus, Plus } from "lucide-react";

export default function QtyStepper({
  value,
  onChange,
  max,
  min = 1,
  size = "sm",
  label = "jumlah",
}: {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  min?: number;
  size?: "sm" | "md";
  label?: string;
}) {
  const dimension = size === "md" ? 32 : 26;
  const icon = size === "md" ? 15 : 12;
  const atMax = typeof max === "number" && value >= max;

  return (
    <div className="flex items-center gap-2" role="group" aria-label={`Ubah ${label}`}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={`Kurangi ${label}`}
        className="grid place-items-center rounded-[9px] border border-border bg-surface text-ink transition-colors hover:bg-surface-2 disabled:opacity-40"
        style={{ width: dimension, height: dimension }}
      >
        <Minus size={icon} strokeWidth={2.1} />
      </button>
      <span className={`tabular min-w-[18px] text-center font-bold ${size === "md" ? "text-[13.5px]" : "text-[12px]"}`}>
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={atMax}
        aria-label={`Tambah ${label}`}
        className="grid place-items-center rounded-[9px] border border-border bg-surface text-ink transition-colors hover:bg-surface-2 disabled:opacity-40"
        style={{ width: dimension, height: dimension }}
      >
        <Plus size={icon} strokeWidth={2.1} />
      </button>
    </div>
  );
}
