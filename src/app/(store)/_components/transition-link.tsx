"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";

type AnchorProps = ComponentProps<typeof Link>;

const CART_PATH = "/cart";

/** Jalur tujuan tanpa query/hash, agar perbandingan rute tetap bersih. */
function pathOf(href: AnchorProps["href"], fallback: string) {
  const raw = typeof href === "string" ? href : (href.pathname ?? fallback);
  return raw.split(/[?#]/)[0];
}

/**
 * Link yang menandai jenis transisi halaman.
 *
 * Halaman keranjang satu-satunya yang memakai geser: masuk ke /cart bergerak
 * maju, keluar dari /cart bergerak mundur. Rute lain memakai fade + lift.
 */
export default function TransitionLink({ href, transitionTypes, ...rest }: AnchorProps) {
  const pathname = usePathname();

  let types = transitionTypes;

  if (!types) {
    const target = pathOf(href, pathname);
    const onCart = pathname === CART_PATH;

    if (target === CART_PATH && !onCart) {
      types = ["nav-forward"];
    } else if (onCart && target !== CART_PATH) {
      types = ["nav-back"];
    } else {
      types = ["nav-fade"];
    }
  }

  return <Link href={href} transitionTypes={types} {...rest} />;
}
