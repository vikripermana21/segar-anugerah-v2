import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[520px] flex-col justify-center px-5 py-16">
      <p className="text-[10.5px] font-bold tracking-[0.08em] text-accent uppercase">
        Halaman tidak ditemukan
      </p>
      <h1 className="mt-1.5 font-display text-[30px] font-semibold leading-tight">
        Halaman ini tidak ada di etalase.
      </h1>
      <p className="mt-3 text-[12.5px] leading-relaxed text-ink-2">
        Alamatnya tidak tercatat, atau sudah dipindahkan. Semua barang hari ini ada di beranda.
      </p>
      <div className="mt-8 flex flex-wrap gap-2.5">
        <Link href="/" className="btn-primary">
          Kembali ke beranda
        </Link>
        <Link href="/products" className="btn-secondary">
          Lihat produk
        </Link>
      </div>
    </main>
  );
}
