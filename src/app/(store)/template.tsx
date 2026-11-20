import { ViewTransition } from "react";

/**
 * Template remount tiap kali rute berganti, jadi ViewTransition di sini
 * benar-benar keluar dan masuk pada setiap navigasi toko.
 *
 * Semua rute memakai fade + lift. Hanya halaman keranjang yang bergeser
 * menyamping (nav-forward / nav-back), karena keranjang terasa seperti
 * lembar terpisah dari alur belanja.
 *
 * Lembar halaman diberi latar sendiri supaya yang bergeser adalah satu helai
 * kertas, bukan teks transparan di atas halaman sebelumnya.
 */
const directional = {
  "nav-forward": "nav-forward",
  "nav-back": "nav-back",
  "nav-fade": "nav-fade",
  default: "nav-fade",
};

export default function StoreTemplate({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition
      enter={directional}
      exit={directional}
      update={directional}
      default="nav-fade"
    >
      <div className="min-h-dvh bg-bg">{children}</div>
    </ViewTransition>
  );
}
