import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";

import { AdminLoginForm } from "./login-form";

export const instant = false;

export default async function AdminLoginPage() {
  const session = await getSession("admin");
  if (session) redirect("/admin");

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-4">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">Masuk admin</h1>
        <p className="mt-1 text-sm text-zinc-500">Segar Anugerah</p>
        <AdminLoginForm />
      </div>
    </main>
  );
}
