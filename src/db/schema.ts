import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ */
/* Enums                                                               */
/* ------------------------------------------------------------------ */

export const orderStatusEnum = pgEnum("order_status", [
  "pending_payment",
  "paid",
  "processing",
  "out_for_delivery",
  "completed",
  "cancelled",
  "expired",
  "paid_late",
  "refunded",
]);

export const subjectTypeEnum = pgEnum("subject_type", ["customer", "admin"]);

export const paymentModeEnum = pgEnum("payment_mode", ["whatsapp", "midtrans"]);

/* ------------------------------------------------------------------ */
/* Admin & pembeli                                                     */
/* ------------------------------------------------------------------ */

export const adminUser = pgTable("admin_user", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const customer = pgTable("customer", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  phoneVerifiedAt: timestamp("phone_verified_at", { withTimezone: true }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const customerAddress = pgTable("customer_address", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customer.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  recipientName: text("recipient_name").notNull(),
  phone: text("phone").notNull(),
  addressLine: text("address_line").notNull(),
  kelurahan: text("kelurahan"),
  kecamatan: text("kecamatan").notNull(),
  city: text("city").notNull(),
  postalCode: text("postal_code"),
  notes: text("notes"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Zona ongkir                                                         */
/* ------------------------------------------------------------------ */

export const deliveryZone = pgTable("delivery_zone", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  fee: integer("fee").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const deliveryZoneArea = pgTable(
  "delivery_zone_area",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    zoneId: uuid("zone_id")
      .notNull()
      .references(() => deliveryZone.id, { onDelete: "cascade" }),
    kecamatan: text("kecamatan").notNull(),
    city: text("city").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("delivery_zone_area_unique").on(t.kecamatan, t.city)],
);

/* ------------------------------------------------------------------ */
/* Katalog                                                             */
/* ------------------------------------------------------------------ */

export const category = pgTable("category", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  imageUrl: text("image_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const product = pgTable("product", {
  id: uuid("id").primaryKey().defaultRandom(),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => category.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  unitLabel: text("unit_label").notNull().default("kg"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const productImage = pgTable("product_image", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => product.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  alt: text("alt"),
  isPrimary: boolean("is_primary").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const productVariant = pgTable(
  "product_variant",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    price: integer("price").notNull(),
    stock: integer("stock").notNull().default(0),
    sku: text("sku"),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("product_variant_label_unique").on(t.productId, t.label)],
);

/* ------------------------------------------------------------------ */
/* Pesanan                                                             */
/* ------------------------------------------------------------------ */

export const order = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderNumber: text("order_number").notNull().unique(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customer.id, { onDelete: "restrict" }),
  status: orderStatusEnum("status").notNull().default("pending_payment"),
  subtotal: integer("subtotal").notNull(),
  shippingFee: integer("shipping_fee").notNull().default(0),
  shippingDiscount: integer("shipping_discount").notNull().default(0),
  total: integer("total").notNull(),
  zoneId: uuid("zone_id").references(() => deliveryZone.id, { onDelete: "set null" }),
  deliveryDate: date("delivery_date").notNull(),
  addressSnapshot: jsonb("address_snapshot").notNull(),
  notes: text("notes"),
  midtransOrderId: text("midtrans_order_id").notNull().unique(),
  /** Kunci dari klien: permintaan ulang dengan kunci sama tidak membuat pesanan baru. */
  idempotencyKey: text("idempotency_key").unique(),
  /** Token Snap disimpan supaya klik Bayar berulang tidak membuat transaksi baru. */
  snapToken: text("snap_token"),
  snapRedirectUrl: text("snap_redirect_url"),
  snapCreatedAt: timestamp("snap_created_at", { withTimezone: true }),
  midtransTransactionId: text("midtrans_transaction_id"),
  paymentMethod: text("payment_method"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  cancelledReason: text("cancelled_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("orders_customer_status_idx").on(t.customerId, t.status),
  index("orders_status_created_idx").on(t.status, t.createdAt),
]);

export const orderItem = pgTable("order_item", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => order.id, { onDelete: "cascade" }),
  productId: uuid("product_id").references(() => product.id, { onDelete: "set null" }),
  variantId: uuid("variant_id").references(() => productVariant.id, { onDelete: "set null" }),
  productName: text("product_name").notNull(),
  variantLabel: text("variant_label").notNull(),
  unitPrice: integer("unit_price").notNull(),
  quantity: integer("quantity").notNull(),
  lineTotal: integer("line_total").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("order_item_order_id_idx").on(t.orderId)]);

export const orderStatusHistory = pgTable("order_status_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => order.id, { onDelete: "cascade" }),
  fromStatus: text("from_status"),
  toStatus: text("to_status").notNull(),
  changedBy: text("changed_by").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("order_status_history_order_created_idx").on(t.orderId, t.createdAt),
  index("order_status_history_status_created_idx").on(t.toStatus, t.createdAt),
]);

export const paymentEvent = pgTable(
  "payment_event",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id").references(() => order.id, { onDelete: "set null" }),
    provider: text("provider").notNull().default("midtrans"),
    eventType: text("event_type").notNull(),
    transactionId: text("transaction_id"),
    payload: jsonb("payload").notNull(),
    signatureValid: boolean("signature_valid").notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("payment_event_unique").on(t.provider, t.eventType, t.transactionId)],
);

/* ------------------------------------------------------------------ */
/* Sesi & pengaturan                                                   */
/* ------------------------------------------------------------------ */

export const session = pgTable("session", {
  id: uuid("id").primaryKey().defaultRandom(),
  tokenHash: text("token_hash").notNull().unique(),
  subjectType: subjectTypeEnum("subject_type").notNull(),
  subjectId: uuid("subject_id").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const storeSetting = pgTable("store_setting", {
  id: integer("id").primaryKey().default(1),
  storeName: text("store_name").notNull().default("Segar Anugerah"),
  whatsapp: text("whatsapp"),
  address: text("address"),
  freeShippingActive: boolean("free_shipping_active").notNull().default(true),
  freeShippingUntil: timestamp("free_shipping_until", { withTimezone: true }),
  freeShippingMinSubtotal: integer("free_shipping_min_subtotal").notNull().default(0),
  orderCutoffHour: integer("order_cutoff_hour").notNull().default(16),
  paymentMode: paymentModeEnum("payment_mode").notNull().default("whatsapp"),
  bankName: text("bank_name"),
  bankAccountNumber: text("bank_account_number"),
  bankAccountName: text("bank_account_name"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];
export type AdminUser = typeof adminUser.$inferSelect;
export type Customer = typeof customer.$inferSelect;
export type Product = typeof product.$inferSelect;
export type ProductVariant = typeof productVariant.$inferSelect;
export type Order = typeof order.$inferSelect;
