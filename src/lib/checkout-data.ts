import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { customerAddress } from "@/db/schema";
import { deliveryZone, deliveryZoneArea } from "@/db/schema";
import type { AddressRow, DeliveryArea } from "./address-types";

/** Kecamatan yang dilayani beserta zona dan tarif aktifnya. */
export async function getActiveAreas(): Promise<DeliveryArea[]> {
  return db
    .select({
      kecamatan: deliveryZoneArea.kecamatan,
      city: deliveryZoneArea.city,
      zoneName: deliveryZone.name,
      fee: deliveryZone.fee,
    })
    .from(deliveryZoneArea)
    .innerJoin(deliveryZone, eq(deliveryZone.id, deliveryZoneArea.zoneId))
    .where(eq(deliveryZone.isActive, true))
    .orderBy(asc(deliveryZone.sortOrder), asc(deliveryZoneArea.kecamatan));
}

export async function getCustomerAddresses(customerId: string): Promise<AddressRow[]> {
  return db
    .select({
      id: customerAddress.id,
      label: customerAddress.label,
      recipientName: customerAddress.recipientName,
      phone: customerAddress.phone,
      addressLine: customerAddress.addressLine,
      kecamatan: customerAddress.kecamatan,
      city: customerAddress.city,
      postalCode: customerAddress.postalCode,
      notes: customerAddress.notes,
      isDefault: customerAddress.isDefault,
    })
    .from(customerAddress)
    .where(eq(customerAddress.customerId, customerId))
    .orderBy(asc(customerAddress.createdAt));
}

export async function getCustomerAddress(
  customerId: string,
  addressId: string,
): Promise<AddressRow | null> {
  const rows = await db
    .select({
      id: customerAddress.id,
      label: customerAddress.label,
      recipientName: customerAddress.recipientName,
      phone: customerAddress.phone,
      addressLine: customerAddress.addressLine,
      kecamatan: customerAddress.kecamatan,
      city: customerAddress.city,
      postalCode: customerAddress.postalCode,
      notes: customerAddress.notes,
      isDefault: customerAddress.isDefault,
    })
    .from(customerAddress)
    .where(and(eq(customerAddress.id, addressId), eq(customerAddress.customerId, customerId)))
    .limit(1);

  return rows[0] ?? null;
}

export async function findArea(kecamatan: string, city: string): Promise<DeliveryArea | null> {
  const rows = await db
    .select({
      kecamatan: deliveryZoneArea.kecamatan,
      city: deliveryZoneArea.city,
      zoneName: deliveryZone.name,
      fee: deliveryZone.fee,
    })
    .from(deliveryZoneArea)
    .innerJoin(deliveryZone, eq(deliveryZone.id, deliveryZoneArea.zoneId))
    .where(
      and(
        eq(deliveryZoneArea.kecamatan, kecamatan),
        eq(deliveryZoneArea.city, city),
        eq(deliveryZone.isActive, true),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}
