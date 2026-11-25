"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { btnSecondary } from "../../../_components/ui";

/** Tombol salin untuk daftar barang yang dibawa kurir. */
export function CopyOrderItems({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button type="button" onClick={copy} className={`${btnSecondary} admin-btn-sm`}>
      {copied ? <Check size={14} strokeWidth={2} /> : <Copy size={14} strokeWidth={2} />}
      {copied ? "Tersalin" : "Salin daftar barang"}
      <span aria-live="polite" className="sr-only">
        {copied ? "Daftar barang tersalin." : ""}
      </span>
    </button>
  );
}
