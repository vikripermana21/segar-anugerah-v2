import type { LucideIcon } from "lucide-react";
import Link from "./transition-link";
import { ArrowRight, Truck } from "lucide-react";

export function SectionTitle({
  children,
  meta,
}: {
  children: React.ReactNode;
  meta?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-[13px] font-bold">{children}</h2>
      {meta ? <span className="text-[11px] text-ink-3">{meta}</span> : null}
    </div>
  );
}

export function DisplayTitle({
  children,
  action,
  href,
  actionLabel,
}: {
  children: React.ReactNode;
  action?: string;
  href?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="font-display text-[20px] font-semibold leading-tight">{children}</h2>
      {action && href ? (
        <Link
          href={href}
          className="flex shrink-0 items-center gap-1 text-[11.5px] font-semibold text-brand"
          aria-label={actionLabel ?? action}
        >
          {action}
          <ArrowRight size={13} strokeWidth={2} />
        </Link>
      ) : null}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
  actionHref,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
  action: string;
  actionHref: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2.5 px-3 pb-6 pt-12 text-center">
      <span className="grid h-[68px] w-[68px] place-items-center rounded-full bg-surface-2 text-ink-2">
        <Icon size={28} strokeWidth={1.8} />
      </span>
      <h2 className="text-[16px] font-bold">{title}</h2>
      <p className="max-w-[34ch] text-[11.5px] leading-relaxed text-ink-3">{children}</p>
      <Link href={actionHref} className="btn-primary mt-3 min-h-[44px] min-w-[190px] text-[12.5px]">
        {action}
      </Link>
    </div>
  );
}

export function FreeShippingNote({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-brand-soft px-3 py-2.5 text-brand">
      <Truck size={15} strokeWidth={2} className="shrink-0" />
      <p className="text-[11px] font-semibold leading-snug">
        {children ?? "Gratis ongkir ke semua kecamatan · s.d. 31 Des 2026"}
      </p>
    </div>
  );
}
