/**
 * Pembuatan pesanan dan penguncian stok.
 *
 * Semua perhitungan uang dan tanggal dilakukan di sini, bukan dari klien.
 * Harga, nama, dan alamat disalin ke pesanan supaya perubahan katalog
 * tidak mengubah pesanan lama (PRD 3.3 butir 6).
 */
import { and, count, eq, gt, inArray, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  customerAddress,
  deliveryZone,
  deliveryZoneArea,
  order,
  orderItem,
  orderStatusHistory,
  product,
  productVariant,
  storeSetting,
} from "@/db/schema";
import {
  deliveryDate as deliveryDateRule,
  orderExpiry,
  orderNumber as orderNumberRule,
  shippingDiscount,
  WHATSAPP_HOLD_MINUTES,
} from "./order-rules";

export type AddressSnapshot = {
  label: string;
  recipientName: string;
  phone: string;
  addressLine: string;
  kelurahan: string | null;
  kecamatan: string;
  city: string;
  postalCode: string | null;
  notes: string | null;
};

export type OrderLineInput = { variantId: string; quantity: number };

export type CreateOrderInput = {
  customerId: string;
  addressId: string;
  kecamatan: string;
  city: string;
  note?: string;
  idempotencyKey?: string;
  items: OrderLineInput[];
};

export type CreatedOrder = {
  orderNumber: string;
  subtotal: number;
  shippingFee: number;
  shippingDiscount: number;
  total: number;
  deliveryDate: string;
  expiresAt: string;
  /** `whatsapp` berarti transfer bank lewat konfirmasi toko, bukan Midtrans. */
  paymentMethod: string | null;
};

export type CreateOrderFailure = {
  code:
    | "empty_cart"
    | "invalid_item"
    | "variant_unavailable"
    | "out_of_stock"
    | "address_not_found"
    | "zone_unavailable"
    | "too_many_pending"
    | "rate_limited";
  message: string;
  /** Varian yang stoknya habis, untuk pesan di keranjang. */
  outOfStock?: string[];
};

export type CreateOrderResult =
  | ({ ok: true } & CreatedOrder)
  | ({ ok: false } & CreateOrderFailure);

const MAX_LINES = 50;
const MAX_QUANTITY = 99;
const MAX_PENDING_ORDERS = 3;
const CREATE_WINDOW_MINUTES = 10;
const MAX_ORDERS_PER_WINDOW = 5;

function isUniqueViolation(error: unknown, constraint?: string): boolean {
  if (typeof error !== "object" || error === null) return false;
  const code = (error as { code?: unknown }).code;
  const name = (error as { constraint_name?: unknown }).constraint_name;
  if (code !== "23505") return false;
  if (!constraint) return true;
  return name === constraint;
}

async function findExisting(
  customerId: string,
  idempotencyKey: string,
): Promise<CreatedOrder | null> {
  const rows = await db
    .select()
    .from(order)
    .where(and(eq(order.customerId, customerId), eq(order.idempotencyKey, idempotencyKey)))
    .limit(1);

  const row = rows[0];
  if (!row) return null;
  return {
    orderNumber: row.orderNumber,
    subtotal: row.subtotal,
    shippingFee: row.shippingFee,
    shippingDiscount: row.shippingDiscount,
    total: row.total,
    deliveryDate: row.deliveryDate,
    expiresAt: row.expiresAt.toISOString(),
    paymentMethod: row.paymentMethod,
  };
}

export async function createOrder(
  input: CreateOrderInput,
  now = new Date(),
): Promise<CreateOrderResult> {
  if (input.items.length === 0) {
    return { ok: false, code: "empty_cart", message: "Keranjang masih kosong." };
  }
  if (input.items.length > MAX_LINES) {
    return { ok: false, code: "invalid_item", message: "Terlalu banyak jenis barang." };
  }

  const quantities = new Map<string, number>();
  for (const item of input.items) {
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_QUANTITY) {
      return { ok: false, code: "invalid_item", message: "Jumlah barang tidak valid." };
    }
    const current = quantities.get(item.variantId) ?? 0;
    quantities.set(item.variantId, current + item.quantity);
  }
  const variantIds = [...quantities.keys()];

  if (input.idempotencyKey) {
    const existing = await findExisting(input.customerId, input.idempotencyKey);
    if (existing) return { ok: true, ...existing };
  }

  // Batas sederhana tanpa layanan tambahan: jangan biarkan satu pembeli
  // menahan stok lewat banyak pesanan yang belum dibayar.
  const [pending] = await db
    .select({ total: count() })
    .from(order)
    .where(
      and(
        eq(order.customerId, input.customerId),
        eq(order.status, "pending_payment"),
        gt(order.expiresAt, now),
      ),
    );

  if ((pending?.total ?? 0) >= MAX_PENDING_ORDERS) {
    return {
      ok: false,
      code: "too_many_pending",
      message: `Masih ada ${MAX_PENDING_ORDERS} pesanan yang belum dikonfirmasi. Selesaikan atau tunggu kedaluwarsa dulu.`,
    };
  }

  const windowStart = new Date(now.getTime() - CREATE_WINDOW_MINUTES * 60 * 1000);
  const [recent] = await db
    .select({ total: count() })
    .from(order)
    .where(and(eq(order.customerId, input.customerId), gt(order.createdAt, windowStart)));

  if ((recent?.total ?? 0) >= MAX_ORDERS_PER_WINDOW) {
    return {
      ok: false,
      code: "rate_limited",
      message: "Terlalu banyak percobaan pesanan. Tunggu beberapa menit lalu coba lagi.",
    };
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const result = await db.transaction(async (tx) => {
        // Kunci baris varian lebih dulu supaya dua pesanan bersamaan tidak
        // membaca stok yang sama (PRD 3.3 butir 1).
        const variants = await tx
          .select({
            id: productVariant.id,
            label: productVariant.label,
            price: productVariant.price,
            stock: productVariant.stock,
            isActive: productVariant.isActive,
            productId: product.id,
            productName: product.name,
            productActive: product.isActive,
          })
          .from(productVariant)
          .innerJoin(product, eq(product.id, productVariant.productId))
          .where(inArray(productVariant.id, variantIds))
          .orderBy(productVariant.id)
          .for("update");

        if (variants.length !== variantIds.length) {
          return {
            ok: false as const,
            code: "variant_unavailable" as const,
            message: "Ada barang yang sudah tidak dijual. Muat ulang keranjang.",
          };
        }

        const outOfStock: string[] = [];
        for (const variant of variants) {
          if (!variant.isActive || !variant.productActive) {
            return {
              ok: false as const,
              code: "variant_unavailable" as const,
              message: "Ada barang yang sudah tidak dijual. Muat ulang keranjang.",
            };
          }
          const wanted = quantities.get(variant.id) ?? 0;
          if (variant.stock < wanted) outOfStock.push(variant.label);
        }
        if (outOfStock.length > 0) {
          return {
            ok: false as const,
            code: "out_of_stock" as const,
            message: "Stok baru saja habis. Kurangi jumlah lalu coba lagi.",
            outOfStock,
          };
        }

        const addresses = await tx
          .select()
          .from(customerAddress)
          .where(
            and(
              eq(customerAddress.id, input.addressId),
              eq(customerAddress.customerId, input.customerId),
            ),
          )
          .limit(1);

        const address = addresses[0];
        if (!address) {
          return {
            ok: false as const,
            code: "address_not_found" as const,
            message: "Alamat pengiriman tidak ditemukan.",
          };
        }

        const zones = await tx
          .select({ id: deliveryZone.id, name: deliveryZone.name, fee: deliveryZone.fee })
          .from(deliveryZoneArea)
          .innerJoin(deliveryZone, eq(deliveryZone.id, deliveryZoneArea.zoneId))
          .where(
            and(
              eq(deliveryZoneArea.kecamatan, input.kecamatan),
              eq(deliveryZoneArea.city, input.city),
              eq(deliveryZone.isActive, true),
            ),
          )
          .limit(1);

        const zone = zones[0];
        if (!zone) {
          return {
            ok: false as const,
            code: "zone_unavailable" as const,
            message: "Kecamatan itu belum dilayani. Pilih kecamatan lain.",
          };
        }

        const settings = await tx.select().from(storeSetting).limit(1);
        const setting = settings[0];

        const lines = variants.map((variant) => {
          const quantity = quantities.get(variant.id) ?? 0;
          return {
            variantId: variant.id,
            productId: variant.productId,
            productName: variant.productName,
            variantLabel: variant.label,
            unitPrice: variant.price,
            quantity,
            lineTotal: variant.price * quantity,
          };
        });

        const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
        const shippingFee = zone.fee;
        const discount = shippingDiscount(
          subtotal,
          shippingFee,
          {
            freeShippingActive: setting?.freeShippingActive ?? false,
            freeShippingUntil: setting?.freeShippingUntil ?? null,
            freeShippingMinSubtotal: setting?.freeShippingMinSubtotal ?? 0,
          },
          now,
        );
        const total = subtotal + shippingFee - discount;
        const delivery = deliveryDateRule(now, setting?.orderCutoffHour ?? 16);
        const whatsapp = (setting?.paymentMode ?? "whatsapp") === "whatsapp";
        const expiresAt = orderExpiry(
          now,
          whatsapp ? WHATSAPP_HOLD_MINUTES : undefined,
        );
        const number = orderNumberRule(now);

        const snapshot: AddressSnapshot = {
          label: address.label,
          recipientName: address.recipientName,
          phone: address.phone,
          addressLine: address.addressLine,
          kelurahan: address.kelurahan,
          kecamatan: input.kecamatan,
          city: input.city,
          postalCode: address.postalCode,
          notes: address.notes,
        };

        const inserted = await tx
          .insert(order)
          .values({
            orderNumber: number,
            customerId: input.customerId,
            status: "pending_payment",
            subtotal,
            shippingFee,
            shippingDiscount: discount,
            total,
            zoneId: zone.id,
            deliveryDate: delivery,
            addressSnapshot: snapshot,
            notes: input.note?.trim() || null,
            midtransOrderId: number,
            idempotencyKey: input.idempotencyKey ?? null,
            paymentMethod: whatsapp ? "whatsapp" : null,
            expiresAt,
          })
          .returning({ id: order.id });

        const orderId = inserted[0].id;

        await tx.insert(orderItem).values(lines.map((line) => ({ orderId, ...line })));

        for (const line of lines) {
          await tx
            .update(productVariant)
            .set({ stock: sql`${productVariant.stock} - ${line.quantity}`, updatedAt: now })
            .where(
              and(
                eq(productVariant.id, line.variantId),
                sql`${productVariant.stock} >= ${line.quantity}`,
              ),
            );
        }

        await tx.insert(orderStatusHistory).values({
          orderId,
          fromStatus: null,
          toStatus: "pending_payment",
          changedBy: `customer:${input.customerId}`,
          note: whatsapp
            ? "Pesanan dibuat, stok dikunci. Menunggu konfirmasi transfer lewat WhatsApp."
            : "Pesanan dibuat, stok dikunci.",
        });

        return {
          ok: true as const,
          orderNumber: number,
          subtotal,
          shippingFee,
          shippingDiscount: discount,
          total,
          deliveryDate: delivery,
          expiresAt: expiresAt.toISOString(),
          paymentMethod: whatsapp ? "whatsapp" : null,
        };
      });

      return result;
    } catch (error) {
      if (input.idempotencyKey && isUniqueViolation(error, "orders_idempotency_key_unique")) {
        const existing = await findExisting(input.customerId, input.idempotencyKey);
        if (existing) return { ok: true, ...existing };
      }
      const retryable =
        isUniqueViolation(error, "orders_order_number_unique") ||
        isUniqueViolation(error, "orders_midtrans_order_id_unique");
      if (!retryable || attempt === 2) throw error;
    }
  }

  throw new Error("Gagal membuat nomor pesanan unik.");
}

/**
 * Mengembalikan stok pesanan tepat sekali. Dipanggil saat expired, batal,
 * atau refund dengan syarat status sudah diubah lebih dulu dalam transaksi.
 */
export async function restoreOrderStock(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  orderId: string,
  now = new Date(),
): Promise<void> {
  const items = await tx
    .select({ variantId: orderItem.variantId, quantity: orderItem.quantity })
    .from(orderItem)
    .where(eq(orderItem.orderId, orderId));

  for (const item of items) {
    if (!item.variantId) continue;
    await tx
      .update(productVariant)
      .set({ stock: sql`${productVariant.stock} + ${item.quantity}`, updatedAt: now })
      .where(eq(productVariant.id, item.variantId));
  }
}
