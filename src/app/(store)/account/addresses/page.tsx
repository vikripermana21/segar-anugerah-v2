import type { Metadata } from "next";

import { requireCustomer } from "@/lib/customer-guard";
import { getActiveAreas, getCustomerAddresses } from "@/lib/checkout-data";

import AddressList from "../../_components/address-list";

export const metadata: Metadata = {
  title: "Alamat saya",
};

export default async function AddressesPage() {
  const session = await requireCustomer("/account/addresses");

  const [addresses, areas] = await Promise.all([
    getCustomerAddresses(session.id),
    getActiveAreas(),
  ]);

  return <AddressList addresses={addresses} areas={areas} />;
}
