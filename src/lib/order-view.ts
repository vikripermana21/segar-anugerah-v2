/**
 * Query pesanan untuk halaman pembeli. Semua query difilter `customer_id`
 * supaya pembeli tidak bisa membuka pesanan orang lain.
 */
import { and, desc, eq, inArray, lt, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { order, orderItem, orderStatusHistory } from "@/db/schema";
import type { AddressSnapshot } from "./orders";
import { orderStatusMeta, type OrderStatus } from "./order-status";

export type OrderPage = {
  orders: OrderSummary[];
  /** Cursor untuk halaman berikutnya, null bila sudah habis. */
  nextCursor: string | null;
};

export type OrderSummary = {
  number: string;
  status: OrderStatus;
  paymentMethod: string | null;
  createdLabel: string;
  dateLabel: string;
  itemCount: number;
  total: number;
};

export type OrderDetail = OrderSummary & {
  subtotal: number;
  shippingFee: number;
  shippingDiscount: number;
  deliveryDateLabel: string;
  expiresLabel: string | null;
  paymentMethod: string | null;
  paidLabel: string | null;
  note: string | null;
  address: AddressSnapshot;
  items: { key: string; name: string; variant: string; quantity: number; lineTotal: number }[];
  timeline: { time: string; label: string }[];
};

const dateTime = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const dateOnly = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  day: "numeric",
  month: "short",
  year: "numeric",
});

const clock = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  hour: "2-digit",
  minute: "2-digit",
});

const deliveryFormat = new Intl.DateTimeFormat("id-ID", {
  timeZone: "UTC",
  weekday: "long",
  day: "numeric",
  month: "short",
  year: "numeric",
});

function dateTimeLabel(value: Date): string {
  return `${dateTime.format(value)} WIB`;
}

function deliveryLabel(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return deliveryFormat.format(new Date(Date.UTC(year, month - 1, day)));
}

const PAGE_SIZE = 20;

type Cursor = { createdAt: Date; id: string };

function encodeCursor(row: { createdAt: Date; id: string }): string {
  return Buffer.from(`${row.createdAt.getTime()}|${row.id}`).toString("base64url");
}

function decodeCursor(value: string | null | undefined): Cursor | null {
  if (!value) return null;
  try {
    const [ms, id] = Buffer.from(value, "base64url").toString("utf8").split("|");
    const time = Number(ms);
    if (!Number.isFinite(time) || !id) return null;
    return { createdAt: new Date(time), id };
  } catch {
    return null;
  }
}

/**
 * Riwayat pesanan dengan keyset pagination. Cursor memakai `created_at` + `id`
 * supaya halaman tidak bergeser saat ada pesanan baru masuk.
 */
export async function listCustomerOrders(
  customerId: string,
  options: { statuses?: OrderStatus[]; cursor?: string | null; limit?: number } = {},
): Promise<OrderPage> {
  const limit = Math.min(Math.max(options.limit ?? PAGE_SIZE, 1), 50);
  const cursor = decodeCursor(options.cursor);

  const filters = [eq(order.customerId, customerId)];
  if (options.statuses?.length) filters.push(inArray(order.status, options.statuses));
  if (cursor) {
    filters.push(
      or(
        lt(order.createdAt, cursor.createdAt),
        and(eq(order.createdAt, cursor.createdAt), lt(order.id, cursor.id)),
      )!,
    );
  }

  const rows = await db
    .select({
      id: order.id,
      number: order.orderNumber,
      status: order.status,
      createdAt: order.createdAt,
      total: order.total,
      paymentMethod: order.paymentMethod,
      itemCount: sql<number>`(select count(*) from ${orderItem} where ${orderItem.orderId} = ${order.id})`,
    })
    .from(order)
    .where(and(...filters))
    .orderBy(desc(order.createdAt), desc(order.id))
    .limit(limit + 1);

  const page = rows.slice(0, limit);
  const last = page.at(-1);

  return {
    orders: page.map((row) => ({
      number: row.number,
      status: row.status as OrderStatus,
      paymentMethod: row.paymentMethod,
      createdLabel: dateTimeLabel(row.createdAt),
      dateLabel: dateOnly.format(row.createdAt),
      itemCount: Number(row.itemCount),
      total: row.total,
    })),
    nextCursor: rows.length > limit && last ? encodeCursor(last) : null,
  };
}

export async function getCustomerOrder(
  customerId: string,
  orderNumber: string,
): Promise<OrderDetail | null> {
  const rows = await db
    .select()
    .from(order)
    .where(and(eq(order.orderNumber, orderNumber), eq(order.customerId, customerId)))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  const [items, history] = await Promise.all([
    db
      .select()
      .from(orderItem)
      .where(eq(orderItem.orderId, row.id))
      .orderBy(orderItem.createdAt),
    db
      .select()
      .from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, row.id))
      .orderBy(orderStatusHistory.createdAt),
  ]);

  const status = row.status as OrderStatus;
  const pending = status === "pending_payment";

  return {
    number: row.orderNumber,
    status,
    paymentMethod: row.paymentMethod,
    createdLabel: dateTimeLabel(row.createdAt),
    dateLabel: dateOnly.format(row.createdAt),
    itemCount: items.length,
    total: row.total,
    subtotal: row.subtotal,
    shippingFee: row.shippingFee,
    shippingDiscount: row.shippingDiscount,
    deliveryDateLabel: deliveryLabel(row.deliveryDate),
    expiresLabel: pending ? dateTimeLabel(row.expiresAt) : null,
    paidLabel: row.paidAt ? dateTimeLabel(row.paidAt) : null,
    note: row.notes,
    address: row.addressSnapshot as AddressSnapshot,
    items: items.map((item) => ({
      key: item.id,
      name: item.productName,
      variant: item.variantLabel,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
    })),
    timeline: history.map((step) => ({
      time: clock.format(step.createdAt),
      label:
        step.note ??
        `${orderStatusMeta[step.toStatus as OrderStatus]?.label ?? step.toStatus}`,
    })),
  };
}
