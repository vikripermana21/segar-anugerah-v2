import type { NextConfig } from "next";

/**
 * Foto produk dilayani dari R2. Tanpa host ini, `next/image` menolak
 * mengoptimalkan URL absolut dari bucket.
 */
function r2ImagePatterns(): URL[] {
  const base = process.env.R2_PUBLIC_BASE_URL?.trim();
  if (!base) return [];

  try {
    return [new URL(`${base.replace(/\/+$/, "")}/**`)];
  } catch {
    console.warn("R2_PUBLIC_BASE_URL tidak valid; gambar R2 tidak diizinkan.");
    return [];
  }
}

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns: r2ImagePatterns(),
  },
  // Lencana pengembang menutupi baris pertama halaman saat tangkapan layar
  // review diambil. Kesalahan kompilasi tetap muncul tanpa lencana ini.
  devIndicators: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
