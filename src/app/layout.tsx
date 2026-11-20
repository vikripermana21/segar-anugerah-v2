import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const display = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const hero = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Segar Anugerah — Ikan & sayur segar, diantar hari ini",
    template: "%s · Segar Anugerah",
  },
  description:
    "Ikan dan sayur segar dari Segar Anugerah, Cilandak. Pesan sebelum pukul 16.00 WIB dan dikirim hari itu juga oleh kurir toko.",
};

export const viewport: Viewport = {
  themeColor: "#f7f5ef",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      className={`${sans.variable} ${display.variable} ${hero.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
