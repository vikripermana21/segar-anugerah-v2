"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import type { ActionState } from "@/lib/action-state";

import { btnPrimary, inputClass } from "./ui";

/** Sisi terpanjang foto setelah dikecilkan di browser. */
const MAX_DIMENSION = 2000;
const QUALITY = 0.88;
const MAX_SOURCE_BYTES = 25 * 1024 * 1024;

type Stage = "idle" | "preparing" | "uploading" | "saving";

const stageLabel: Record<Exclude<Stage, "idle">, string> = {
  preparing: "Menyiapkan foto…",
  uploading: "Mengunggah ke R2…",
  saving: "Menyimpan…",
};

function isAccepted(type: string): boolean {
  return type === "image/jpeg" || type === "image/png" || type === "image/webp";
}

/**
 * Mengubah berkas apa pun yang bisa didekode browser menjadi WebP yang lebih
 * kecil. Foto ponsel kerap 4–8 MB; batas PUT presigned kita 10 MB, jadi
 * pengecilan menjaga unggahan tetap cepat di jaringan seluler.
 */
async function prepareImage(file: File): Promise<{ blob: Blob; contentType: string }> {
  if (isAccepted(file.type) && file.size <= 1.5 * 1024 * 1024) {
    return { blob: file, contentType: file.type };
  }

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) {
    throw new Error("Foto tidak bisa dibaca. Pakai format JPG, PNG, atau WebP.");
  }

  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("Browser tidak bisa mengolah foto ini.");
  }

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/webp", QUALITY);
  });

  if (!blob) throw new Error("Foto gagal dikecilkan. Coba berkas lain.");

  return { blob, contentType: "image/webp" };
}

export function ImageUploadForm({
  productId,
  action,
}: {
  productId: string;
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const busy = stage !== "idle";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const form = event.currentTarget;
    const file = fileRef.current?.files?.[0];
    const alt = String(new FormData(form).get("alt") ?? "").trim();

    setError(null);
    setOk(null);

    if (!file) {
      setError("Pilih berkas foto dulu.");
      return;
    }

    if (file.size > MAX_SOURCE_BYTES) {
      setError("Berkas terlalu besar. Maksimal 25 MB sebelum dikecilkan.");
      return;
    }

    try {
      setStage("preparing");
      const { blob, contentType } = await prepareImage(file);

      setStage("uploading");
      const presign = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, contentType, size: blob.size }),
      });

      const signed = (await presign.json().catch(() => null)) as
        | { ok: true; uploadUrl: string; publicUrl: string; message?: undefined }
        | { ok: false; message: string }
        | null;

      if (!signed) throw new Error("Jawaban server tidak valid.");
      if (!signed.ok) throw new Error(signed.message);

      const put = await fetch(signed.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: blob,
      });

      if (!put.ok) throw new Error(`R2 menolak unggahan (${put.status}).`);

      setStage("saving");
      const data = new FormData();
      data.set("productId", productId);
      data.set("url", signed.publicUrl);
      data.set("alt", alt);

      const result = await action({}, data);
      if (result.error) throw new Error(result.error);

      form.reset();
      setOk(result.ok ?? "Foto ditambah.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Foto gagal diunggah.");
    } finally {
      setStage("idle");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="admin-label">
        Berkas foto
        <input
          ref={fileRef}
          name="file"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          required
          className={inputClass}
        />
      </label>

      <label className="admin-label">
        Teks alternatif
        <input name="alt" placeholder="Ikan nila segar" className={inputClass} />
      </label>

      {error ? (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : null}

      {ok ? <p className="text-sm text-emerald-700">{ok}</p> : null}

      <button type="submit" disabled={busy} className={btnPrimary}>
        {busy ? stageLabel[stage] : "Unggah foto"}
      </button>
    </form>
  );
}
