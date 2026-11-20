import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCustomer } from "@/lib/customer-guard";

import { PageBar } from "../_components/app-bar";
import AuthForm from "../_components/auth-form";

export const metadata: Metadata = {
  title: "Masuk",
};

type SearchParams = Promise<{ next?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const { next } = await searchParams;
  const target = next?.startsWith("/") && !next.startsWith("//") ? next : "/account";
  if (await getCustomer()) redirect(target);

  return (
    <div className="min-h-dvh">
      <PageBar title="Masuk" backHref="/" />
      <AuthForm mode="login" next={next} />
    </div>
  );
}
