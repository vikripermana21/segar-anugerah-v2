export type AddressRow = {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  addressLine: string;
  kecamatan: string;
  city: string;
  postalCode: string | null;
  notes: string | null;
  isDefault: boolean;
};

/** Kecamatan yang dilayani, beserta zona dan tarifnya. */
export type DeliveryArea = {
  kecamatan: string;
  city: string;
  zoneName: string;
  fee: number;
};
