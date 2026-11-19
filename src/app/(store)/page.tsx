export default function StoreHomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 px-6 py-16">
      <p className="text-sm font-medium tracking-wide text-emerald-700 uppercase">Segar Anugerah</p>
      <h1 className="text-3xl font-semibold text-zinc-900">
        Ikan &amp; sayur segar, diantar ke rumah.
      </h1>
      <p className="text-zinc-600">
        Fase 1 — fondasi. Katalog, keranjang, dan pembayaran menyusul di fase berikutnya.
      </p>
      <div className="flex flex-wrap gap-3 text-sm">
        <a
          href="/admin/login"
          className="rounded-md bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800"
        >
          Masuk admin
        </a>
      </div>
    </main>
  );
}
