/**
 * Query pesanan untuk area admin. Semua fungsi di sini hanya boleh dipanggil
 * setelah `requireAdmin()` di halaman atau server action.
 */
import { and, asc, count, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";

import { db } from "@/db";
import {
  customer,
  deliveryZone,
  order,
  orderItem,
  orderStatusHistory,
  paymentEvent,
} from "@/db/schema";
import { orderStatusMeta, type OrderStatus } from "./order-status";
import { canAdminAct, type AdminOrderAction } from "./order-transitions";
import type { AddressSnapshot } from "./orders";

export const ADMIN_ORDER_PAGE_SIZE = 20;

export type AdminOrderFilterKey =
  | "semua"
  | "belum-bayar"
  | "perlu-disiapkan"
  | "perlu-ditinjau"
  | "dikirim"
  | "selesai"
  | "ditutup";

export type AdminOrderFilter = {
  key: AdminOrderFilterKey;
  label: string;
  statuses?: OrderStatus[];
};

export const adminOrderFilters: AdminOrderFilter[] = [
  { key: "semua", label: "Semua" },
  { key: "belum-bayar", label: "Belum dibayar", statuses: ["pending_payment"] },
  { key: "perlu-disiapkan", label: "Perlu disiapkan", statuses: ["paid", "processing"] },
  { key: "perlu-ditinjau", label: "Perlu ditinjau", statuses: ["paid_late"] },
  { key: "dikirim", label: "Dikirim", statuses: ["out_for_delivery"] },
  { key: "selesai", label: "Selesai", statuses: ["completed"] },
  { key: "ditutup", label: "Dibatalkan", statuses: ["cancelled", "expired", "refunded"] },
];

export function findAdminOrderFilter(key: string | undefined): AdminOrderFilter {
  return adminOrderFilters.find((item) => item.key === key) ?? adminOrderFilters[0];
}

export type AdminOrderRow = {
  id: string;
  number: string;
  status: OrderStatus;
  statusLabel: string;
  customerName: string;
  customerPhone: string;
  createdAtLabel: string;
  total: number;
  itemCount: number;
};

export type AdminOrderPage = {
  orders: AdminOrderRow[];
  total: number;
  page: number;
  pageCount: number;
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

export function adminDateTimeLabel(value: Date): string {
  return `${dateTime.format(value)} WIB`;
}

export function adminClockLabel(value: Date): string {
  return `${clock.format(value)} WIB`;
}

export function adminDateLabel(value: Date): string {
  return dateOnly.format(value);
}

function deliveryDateLabel(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return deliveryFormat.format(new Date(Date.UTC(year, month - 1, day)));
}

function searchPattern(q: string): string {
  return `%${q.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

function listConditions(filter: AdminOrderFilter, q: string): SQL[] {
  const conditions: SQL[] = [];

  if (filter.statuses?.length) {
    conditions.push(inArray(order.status, [...filter.statuses]));
  }

  if (q) {
    const pattern = searchPattern(q);
    conditions.push(
      or(
        ilike(order.orderNumber, pattern),
        ilike(customer.name, pattern),
        ilike(customer.phone, pattern),
      )!,
    );
  }

  return conditions;
}

/** Daftar pesanan dengan paginasi offset; total dipakai untuk nomor halaman. */
export async function listAdminOrders(input: {
  filter: AdminOrderFilter;
  q?: string;
  page?: number;
}): Promise<AdminOrderPage> {
  const q = input.q?.trim().slice(0, 80) ?? "";
  const page = Math.max(1, Math.min(Math.trunc(input.page ?? 1) || 1, 10_000));
  const conditions = listConditions(input.filter, q);
  const where = conditions.length ? and(...conditions) : undefined;

  const [rows, [totalRow]] = await Promise.all([
    db
      .select({
        id: order.id,
        number: order.orderNumber,
        status: order.status,
        createdAt: order.createdAt,
        total: order.total,
        customerName: customer.name,
        customerPhone: customer.phone,
        itemCount: sql<number>`(select count(*) from ${orderItem} where ${orderItem.orderId} = ${order.id})`,
      })
      .from(order)
      .innerJoin(customer, eq(order.customerId, customer.id))
      .where(where)
      .orderBy(desc(order.createdAt), desc(order.id))
      .limit(ADMIN_ORDER_PAGE_SIZE)
      .offset((page - 1) * ADMIN_ORDER_PAGE_SIZE),
    db
      .select({ value: count() })
      .from(order)
      .innerJoin(customer, eq(order.customerId, customer.id))
      .where(where),
  ]);

  const total = Number(totalRow?.value ?? 0);

  return {
    orders: rows.map((row) => ({
      id: row.id,
      number: row.number,
      status: row.status as OrderStatus,
      statusLabel: orderStatusMeta[row.status as OrderStatus]?.label ?? row.status,
      customerName: row.customerName,
      customerPhone: row.customerPhone,
      createdAtLabel: adminDateTimeLabel(row.createdAt),
      total: row.total,
      itemCount: Number(row.itemCount),
    })),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / ADMIN_ORDER_PAGE_SIZE)),
  };
}

/** Hitungan per status untuk chip filter dan kartu dashboard. */
export async function countOrdersByStatus(): Promise<Record<OrderStatus, number>> {
  const rows = await db
    .select({ status: order.status, value: count() })
    .from(order)
    .groupBy(order.status);

  const counts = Object.fromEntries(
    Object.keys(orderStatusMeta).map((status) => [status, 0]),
  ) as Record<OrderStatus, number>;

  for (const row of rows) counts[row.status as OrderStatus] = Number(row.value);
  return counts;
}

/** Pesanan yang menunggu disiapkan, terlama dulu. */
export async function listOrdersToPrepare(limit = 5): Promise<AdminOrderRow[]> {
  const rows = await db
    .select({
      id: order.id,
      number: order.orderNumber,
      status: order.status,
      createdAt: order.createdAt,
      total: order.total,
      customerName: customer.name,
      customerPhone: customer.phone,
      itemCount: sql<number>`(select count(*) from ${orderItem} where ${orderItem.orderId} = ${order.id})`,
    })
    .from(order)
    .innerJoin(customer, eq(order.customerId, customer.id))
    .where(inArray(order.status, ["paid", "processing"]))
    .orderBy(asc(order.createdAt), asc(order.id))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    number: row.number,
    status: row.status as OrderStatus,
    statusLabel: orderStatusMeta[row.status as OrderStatus]?.label ?? row.status,
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    createdAtLabel: adminDateTimeLabel(row.createdAt),
    total: row.total,
    itemCount: Number(row.itemCount),
  }));
}

export type AdminOrderDetail = {
  id: string;
  number: string;
  status: OrderStatus;
  statusLabel: string;
  statusNote: string;
  createdAtLabel: string;
  updatedAtLabel: string;
  expiresAtLabel: string;
  paidAtLabel: string | null;
  deliveryDateLabel: string;
  customer: { id: string; name: string; phone: string };
  address: AddressSnapshot;
  notes: string | null;
  cancelledReason: string | null;
  zoneName: string | null;
  subtotal: number;
  shippingFee: number;
  shippingDiscount: number;
  total: number;
  paymentMethod: string | null;
  midtransOrderId: string;
  midtransTransactionId: string | null;
  items: {
    id: string;
    name: string;
    variant: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }[];
  history: {
    id: string;
    fromStatus: string | null;
    toStatus: string;
    toLabel: string;
    changedBy: string;
    note: string | null;
    timeLabel: string;
  }[];
  events: {
    id: string;
    eventType: string;
    transactionId: string | null;
    signatureValid: boolean;
    processedLabel: string | null;
    createdLabel: string;
  }[];
  actions: Record<AdminOrderAction, boolean>;
};

/** Detail satu pesanan berdasarkan nomor yang dibaca manusia. */
export async function getAdminOrder(orderNumber: string): Promise<AdminOrderDetail | null> {
  const rows = await db
    .select({
      id: order.id,
      number: order.orderNumber,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      paidAt: order.paidAt,
      expiresAt: order.expiresAt,
      deliveryDate: order.deliveryDate,
      addressSnapshot: order.addressSnapshot,
      notes: order.notes,
      cancelledReason: order.cancelledReason,
      zoneId: order.zoneId,
      subtotal: order.subtotal,
      shippingFee: order.shippingFee,
      shippingDiscount: order.shippingDiscount,
      total: order.total,
      paymentMethod: order.paymentMethod,
      midtransOrderId: order.midtransOrderId,
      midtransTransactionId: order.midtransTransactionId,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
    })
    .from(order)
    .innerJoin(customer, eq(order.customerId, customer.id))
    .where(eq(order.orderNumber, orderNumber))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  const status = row.status as OrderStatus;

  const [items, history, events, zoneRows] = await Promise.all([
    db
      .select()
      .from(orderItem)
      .where(eq(orderItem.orderId, row.id))
      .orderBy(asc(orderItem.createdAt)),
    db
      .select()
      .from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, row.id))
      .orderBy(asc(orderStatusHistory.createdAt)),
    db
      .select()
      .from(paymentEvent)
      .where(eq(paymentEvent.orderId, row.id))
      .orderBy(desc(paymentEvent.createdAt))
      .limit(10),
    row.zoneId
      ? db
          .select({ name: deliveryZone.name })
          .from(deliveryZone)
          .where(eq(deliveryZone.id, row.zoneId))
          .limit(1)
      : Promise.resolve([] as { name: string }[]),
  ]);

  const options = { paidAt: row.paidAt };

  return {
    id: row.id,
    number: row.number,
    status,
    statusLabel: orderStatusMeta[status]?.label ?? status,
    statusNote: orderStatusMeta[status]?.note ?? "",
    createdAtLabel: adminDateTimeLabel(row.createdAt),
    updatedAtLabel: adminDateTimeLabel(row.updatedAt),
    expiresAtLabel: adminDateTimeLabel(row.expiresAt),
    paidAtLabel: row.paidAt ? adminDateTimeLabel(row.paidAt) : null,
    deliveryDateLabel: deliveryDateLabel(row.deliveryDate),
    customer: { id: row.customerId, name: row.customerName, phone: row.customerPhone },
    address: row.addressSnapshot as AddressSnapshot,
    notes: row.notes,
    cancelledReason: row.cancelledReason,
    zoneName: zoneRows[0]?.name ?? null,
    subtotal: row.subtotal,
    shippingFee: row.shippingFee,
    shippingDiscount: row.shippingDiscount,
    total: row.total,
    paymentMethod: row.paymentMethod,
    midtransOrderId: row.midtransOrderId,
    midtransTransactionId: row.midtransTransactionId,
    items: items.map((item) => ({
      id: item.id,
      name: item.productName,
      variant: item.variantLabel,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
    })),
    history: history.map((step) => ({
      id: step.id,
      fromStatus: step.fromStatus,
      toStatus: step.toStatus,
      toLabel:
        orderStatusMeta[step.toStatus as OrderStatus]?.label ?? step.toStatus,
      changedBy: step.changedBy,
      note: step.note,
      timeLabel: adminClockLabel(step.createdAt),
    })),
    events: events.map((event) => ({
      id: event.id,
      eventType: event.eventType,
      transactionId: event.transactionId,
      signatureValid: event.signatureValid,
      processedLabel: event.processedAt ? adminClockLabel(event.processedAt) : null,
      createdLabel: adminDateTimeLabel(event.createdAt),
    })),
    actions: {
      dispatch: canAdminAct(status, "dispatch", options),
      complete: canAdminAct(status, "complete", options),
      cancel: canAdminAct(status, "cancel", options),
      refund: canAdminAct(status, "refund", options),
    },
  };
}
