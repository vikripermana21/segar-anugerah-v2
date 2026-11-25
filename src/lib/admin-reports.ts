/**
 * Laporan admin. Omzet dihitung saat pesanan bertransisi ke `completed`,
 * memakai `order_status_history`; `created_at` pesanan tidak dipakai.
 */
import { and, count, desc, eq, gte, lt, sql, sum } from "drizzle-orm";

import { db } from "@/db";
import { order, orderItem, orderStatusHistory } from "@/db/schema";

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_RANGE_DAYS = 366;

const jakartaKeyFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Jakarta",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const dayLabelFormat = new Intl.DateTimeFormat("id-ID", {
  timeZone: "UTC",
  day: "numeric",
  month: "short",
});

const rangeLabelFormat = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** Tanggal kalender Jakarta dalam bentuk `YYYY-MM-DD`. */
export function jakartaKey(value: Date): string {
  return jakartaKeyFormat.format(value);
}

function startOfJakartaDay(key: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const date = new Date(`${key}T00:00:00+07:00`);
  if (Number.isNaN(date.getTime())) return null;
  if (jakartaKey(date) !== key) return null;
  return date;
}

function addDays(key: string, days: number): string {
  const date = new Date(`${key}T00:00:00Z`);
  return new Date(date.getTime() + days * DAY_MS).toISOString().slice(0, 10);
}

function daysBetween(fromKey: string, toKey: string): number {
  const from = new Date(`${fromKey}T00:00:00Z`).getTime();
  const to = new Date(`${toKey}T00:00:00Z`).getTime();
  return Math.floor((to - from) / DAY_MS) + 1;
}

export type ReportRange = {
  fromKey: string;
  toKey: string;
  start: Date;
  endExclusive: Date;
  label: string;
};

/** Rentang default: awal bulan berjalan sampai hari ini (WIB). */
export function defaultReportRange(now = new Date()): { fromKey: string; toKey: string } {
  const toKey = jakartaKey(now);
  return { fromKey: `${toKey.slice(0, 7)}-01`, toKey };
}

/** Rentang N hari terakhir termasuk hari ini, untuk grafik dashboard. */
export function recentReportRange(
  days: number,
  now = new Date(),
): { fromKey: string; toKey: string } {
  const toKey = jakartaKey(now);
  const span = Math.max(1, Math.min(Math.trunc(days) || 1, MAX_RANGE_DAYS));
  return { fromKey: addDays(toKey, -(span - 1)), toKey };
}

/**
 * Membaca rentang dari query string. Tanggal tidak valid atau urutan terbalik
 * dikembalikan ke default supaya halaman tidak pernah gagal total.
 */
export function resolveReportRange(input: {
  from?: string;
  to?: string;
  now?: Date;
}): ReportRange {
  const fallback = defaultReportRange(input.now);
  let fromKey = input.from ?? fallback.fromKey;
  let toKey = input.to ?? fallback.toKey;
  let start = startOfJakartaDay(fromKey);
  let end = startOfJakartaDay(toKey);

  if (!start || !end) {
    fromKey = fallback.fromKey;
    toKey = fallback.toKey;
    start = startOfJakartaDay(fromKey)!;
    end = startOfJakartaDay(toKey)!;
  }

  if (fromKey > toKey) {
    [fromKey, toKey] = [toKey, fromKey];
    [start, end] = [end, start];
  }

  if (daysBetween(fromKey, toKey) > MAX_RANGE_DAYS) {
    fromKey = addDays(toKey, -(MAX_RANGE_DAYS - 1));
    start = startOfJakartaDay(fromKey)!;
  }

  const endExclusive = new Date(end.getTime() + DAY_MS);
  const label = `${rangeLabelFormat.format(start)} – ${rangeLabelFormat.format(end)}`;

  return { fromKey, toKey, start, endExclusive, label };
}

type CompletedOrder = {
  orderId: string;
  number: string;
  total: number;
  completedAt: Date;
};

async function completedOrders(start: Date, endExclusive: Date): Promise<CompletedOrder[]> {
  const rows = await db
    .selectDistinctOn([orderStatusHistory.orderId], {
      orderId: orderStatusHistory.orderId,
      number: order.orderNumber,
      total: order.total,
      completedAt: orderStatusHistory.createdAt,
    })
    .from(orderStatusHistory)
    .innerJoin(order, eq(order.id, orderStatusHistory.orderId))
    .where(
      and(
        eq(orderStatusHistory.toStatus, "completed"),
        gte(orderStatusHistory.createdAt, start),
        lt(orderStatusHistory.createdAt, endExclusive),
      ),
    )
    .orderBy(orderStatusHistory.orderId, orderStatusHistory.createdAt);

  return rows.map((row) => ({
    orderId: row.orderId,
    number: row.number,
    total: row.total,
    completedAt: row.completedAt,
  }));
}

export type TodaySummary = {
  revenue: number;
  completedOrders: number;
  averageOrder: number;
  ordersToday: number;
  pendingPayment: number;
};

export async function todaySummary(now = new Date()): Promise<TodaySummary> {
  const todayKey = jakartaKey(now);
  const range = resolveReportRange({ from: todayKey, to: todayKey, now });
  const [completed, [todayRow], [pendingRow]] = await Promise.all([
    completedOrders(range.start, range.endExclusive),
    db
      .select({ value: count() })
      .from(order)
      .where(and(gte(order.createdAt, range.start), lt(order.createdAt, range.endExclusive))),
    db
      .select({ value: count() })
      .from(order)
      .where(eq(order.status, "pending_payment")),
  ]);

  const revenue = completed.reduce((total, row) => total + row.total, 0);

  return {
    revenue,
    completedOrders: completed.length,
    averageOrder: completed.length ? Math.round(revenue / completed.length) : 0,
    ordersToday: Number(todayRow?.value ?? 0),
    pendingPayment: Number(pendingRow?.value ?? 0),
  };
}

export type RevenueReport = {
  range: ReportRange;
  revenue: number;
  orderCount: number;
  averageOrder: number;
  daily: { key: string; label: string; revenue: number; orders: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
};

/** Omzet, jumlah pesanan, omzet harian, dan produk terlaris satu rentang. */
export async function revenueReport(input: {
  from?: string;
  to?: string;
  now?: Date;
}): Promise<RevenueReport> {
  const range = resolveReportRange(input);
  const completed = await completedOrders(range.start, range.endExclusive);

  const dailyMap = new Map<string, { revenue: number; orders: number }>();
  for (const row of completed) {
    const key = jakartaKey(row.completedAt);
    const current = dailyMap.get(key) ?? { revenue: 0, orders: 0 };
    current.revenue += row.total;
    current.orders += 1;
    dailyMap.set(key, current);
  }

  const daily: RevenueReport["daily"] = [];
  for (let key = range.fromKey; key <= range.toKey; key = addDays(key, 1)) {
    const value = dailyMap.get(key) ?? { revenue: 0, orders: 0 };
    daily.push({
      key,
      label: dayLabelFormat.format(new Date(`${key}T00:00:00Z`)),
      revenue: value.revenue,
      orders: value.orders,
    });
  }

  const completedOrdersInRange = db
    .selectDistinctOn([orderStatusHistory.orderId], {
      orderId: orderStatusHistory.orderId,
      completedAt: orderStatusHistory.createdAt,
    })
    .from(orderStatusHistory)
    .where(
      and(
        eq(orderStatusHistory.toStatus, "completed"),
        gte(orderStatusHistory.createdAt, range.start),
        lt(orderStatusHistory.createdAt, range.endExclusive),
      ),
    )
    .as("completed_orders_in_range");

  const topProducts = await db
    .select({
      name: orderItem.productName,
      quantity: sum(orderItem.quantity),
      revenue: sum(orderItem.lineTotal),
    })
    .from(orderItem)
    .innerJoin(
      completedOrdersInRange,
      eq(completedOrdersInRange.orderId, orderItem.orderId),
    )
    .groupBy(orderItem.productName)
    .orderBy(desc(sql`sum(${orderItem.quantity})`), desc(sql`sum(${orderItem.lineTotal})`))
    .limit(5);

  const revenue = completed.reduce((total, row) => total + row.total, 0);

  return {
    range,
    revenue,
    orderCount: completed.length,
    averageOrder: completed.length ? Math.round(revenue / completed.length) : 0,
    daily,
    topProducts: topProducts.map((row) => ({
      name: row.name,
      quantity: Number(row.quantity ?? 0),
      revenue: Number(row.revenue ?? 0),
    })),
  };
}
