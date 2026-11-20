import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Check, Fish, MessageCircle, ShieldCheck } from "lucide-react";

import { getSession } from "@/lib/auth";
import { storeFacts } from "@/lib/store-data";

import { AdminLoginForm } from "./login-form";

export const instant = false;

export default async function AdminLoginPage() {
  // Sesi membaca cookie dan jam sekarang: jangan ikut diprerender.
  await connection();

  const session = await getSession("admin");
  if (session) redirect("/admin");

  return (
    <div className="admin-shell">
      <main className="grid min-h-dvh lg:grid-cols-[620px_minmax(0,1fr)]">
        <section className="relative hidden flex-col justify-between overflow-hidden bg-[linear-gradient(165deg,#0A5636_0%,#12855A_100%)] p-12 text-white lg:flex">
          <div className="flex items-center gap-3">
            <span className="grid h-[38px] w-[38px] place-items-center rounded-[11px] bg-white text-green-700">
              <Fish size={22} strokeWidth={1.9} />
            </span>
            <span>
              <span className="block text-[16px] font-bold leading-tight">
                {storeFacts.name}
              </span>
              <span className="block text-[11px] text-white/70">Admin toko</span>
            </span>
          </div>

          <div className="max-w-[32ch]">
            <h1 className="text-[38px] font-bold leading-[1.16] tracking-[-1.2px]">
              Pesanan, stok, dan laporan dalam satu layar.
            </h1>
            <p className="mt-3.5 text-[13.5px] leading-relaxed text-white/80">
              Area khusus admin. Pesanan dari WhatsApp dan toko daring masuk ke satu daftar, jadi
              pagi tidak dimulai dengan menggulir chat.
            </p>

            <ul className="mt-7 flex flex-col gap-3">
              {[
                "Siapkan pesanan tanpa membuka chat satu per satu",
                "Stok per varian selalu akurat setelah pembayaran",
                "Omzet harian dan laporan bulanan tanpa hitung manual",
              ].map((text) => (
                <li key={text} className="flex items-center gap-2.5 text-[12.5px] text-white/85">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/15">
                    <Check size={11} strokeWidth={2.4} />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3.5">
            <span className="grid h-[26px] w-[26px] place-items-center rounded-full bg-white/20">
              <span className="h-2 w-2 rounded-full bg-white" />
            </span>
            <span>
              <span className="block text-[12.5px] font-semibold">Toko sedang buka</span>
              <span className="block text-[11px] text-white/70">
                Pesanan masuk sampai 16.00 WIB · diantar sore ini
              </span>
            </span>
          </div>
        </section>

        <section className="flex flex-col justify-between bg-surface px-6 py-10 sm:px-16">
          <div className="hidden justify-end gap-2 text-[12px] lg:flex">
            <span className="text-ink-3">Butuh akses admin?</span>
            <span className="font-semibold text-green-700">{storeFacts.phone}</span>
          </div>

          <div className="mx-auto w-full max-w-[392px] py-10">
            <h2 className="text-[27px] font-bold leading-tight tracking-[-0.8px] text-ink">
              Masuk ke area admin
            </h2>
            <p className="mt-2 text-[12.5px] leading-relaxed text-ink-2">
              Gunakan nomor WhatsApp dan sandi yang diberikan pemilik toko.
            </p>

            <AdminLoginForm />

            <div className="mt-5 flex gap-2.5 rounded-[10px] bg-bg px-3.5 py-3 text-[11px] leading-relaxed text-ink-2">
              <ShieldCheck size={14} strokeWidth={1.9} className="mt-0.5 shrink-0 text-ink-3" />
              Tidak ada pendaftaran sendiri. Akun dibuat dari layar Pengguna admin setelah masuk.
            </div>

            <div className="mt-6 flex items-center gap-2.5">
              <span className="h-px flex-1 bg-line" />
              <span className="text-[10.5px] text-ink-3">Akun dibuat dari layar Pengguna admin</span>
              <span className="h-px flex-1 bg-line" />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-ink-3">
            <span>© 2026 {storeFacts.name} · {storeFacts.area}</span>
            <span className="flex items-center gap-1.5">
              <MessageCircle size={12} strokeWidth={1.9} />
              Panduan admin
            </span>
          </div>
        </section>
      </main>
    </div>
  );
}
