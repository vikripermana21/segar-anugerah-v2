import { asc } from "drizzle-orm";
import { Info, Users } from "lucide-react";

import { db } from "@/db";
import { adminUser } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-guard";

import { ActionForm } from "../_components/action-form";
import {
  Badge,
  Card,
  CardBody,
  CardHead,
  EmptyNote,
  inputClass,
} from "../_components/ui";
import { createAdmin, setAdminActive } from "./actions";

export const instant = false;

const dateTime = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function lastLoginLabel(value: Date | null): string {
  return value ? `${dateTime.format(value)} WIB` : "Belum pernah masuk";
}

export default async function AdminUsersPage() {
  const session = await requireAdmin();

  const rows = await db
    .select({
      id: adminUser.id,
      name: adminUser.name,
      phone: adminUser.phone,
      isActive: adminUser.isActive,
      lastLoginAt: adminUser.lastLoginAt,
      createdAt: adminUser.createdAt,
    })
    .from(adminUser)
    .orderBy(asc(adminUser.createdAt));

  const activeCount = rows.filter((row) => row.isActive).length;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="admin-h1">Pengguna admin</h1>
          <p className="admin-sub">
            {activeCount} aktif dari {rows.length} akun · wewenang sama
          </p>
        </div>
        <span className="admin-btn-ghost pointer-events-none">
          <Info size={14} strokeWidth={1.9} />
          Tidak ada pendaftaran sendiri
        </span>
      </div>

      <div className="admin-split mt-5">
        <Card className="min-w-0">
          <CardHead
            title="Akun dengan akses admin"
            note="Menonaktifkan akun langsung mengakhiri sesinya"
          />

          {rows.length === 0 ? (
            <div className="admin-card-body">
              <EmptyNote>Belum ada pengguna admin.</EmptyNote>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>Nomor</th>
                    <th>Terakhir masuk</th>
                    <th>Status</th>
                    <th aria-label="Aksi" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const isSelf = row.id === session.id;

                    return (
                      <tr key={row.id}>
                        <td>
                          <span className="flex items-center gap-2">
                            <span className="font-medium text-ink">{row.name}</span>
                            {isSelf ? <Badge tone="muted">Anda</Badge> : null}
                          </span>
                        </td>
                        <td className="whitespace-nowrap">{row.phone}</td>
                        <td className="whitespace-nowrap text-[11.5px] text-ink-3">
                          {lastLoginLabel(row.lastLoginAt)}
                        </td>
                        <td>
                          <Badge tone={row.isActive ? undefined : "muted"}>
                            {row.isActive ? "Aktif" : "Nonaktif"}
                          </Badge>
                        </td>
                        <td className="text-right">
                          {isSelf ? (
                            <span className="admin-muted">Akun Anda</span>
                          ) : row.isActive && activeCount <= 1 ? (
                            <span className="admin-muted">Admin terakhir</span>
                          ) : (
                            <ActionForm
                              action={setAdminActive}
                              submitLabel={row.isActive ? "Nonaktifkan" : "Aktifkan"}
                              pendingLabel="Menyimpan…"
                              submitClassName={
                                row.isActive ? "admin-btn-danger admin-btn-sm" : "admin-btn-ghost admin-btn-sm"
                              }
                              className="flex flex-col items-end gap-1"
                            >
                              <input type="hidden" name="id" value={row.id} />
                              <input type="hidden" name="active" value={row.isActive ? "0" : "1"} />
                            </ActionForm>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className="flex min-w-0 flex-col gap-4">
          <Card>
            <CardHead title="Tambah pengguna" note="Akun langsung aktif setelah disimpan" />
            <CardBody>
              <ActionForm action={createAdmin} submitLabel="Buat pengguna">
                <label className="admin-label">
                  Nama
                  <input name="name" required maxLength={80} className={inputClass} />
                </label>

                <label className="admin-label">
                  Nomor WhatsApp
                  <input
                    name="phone"
                    required
                    inputMode="tel"
                    placeholder="08123456789"
                    className={inputClass}
                  />
                </label>

                <label className="admin-label">
                  Sandi
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    maxLength={72}
                    autoComplete="new-password"
                    className={inputClass}
                  />
                  <span className="admin-help">Minimal 8 karakter.</span>
                </label>

                <label className="admin-label">
                  Ulangi sandi
                  <input
                    name="confirm"
                    type="password"
                    required
                    minLength={8}
                    maxLength={72}
                    autoComplete="new-password"
                    className={inputClass}
                  />
                </label>
              </ActionForm>
            </CardBody>
          </Card>

          <Card>
            <CardHead title="Wewenang" note="Tiga orang, akses penuh" />
            <CardBody>
              <div className="flex items-start gap-3 rounded-[10px] bg-surface-2 px-3.5 py-3">
                <Users size={16} strokeWidth={1.9} className="mt-0.5 shrink-0 text-green-700" />
                <p className="text-[11px] leading-relaxed text-ink-2">
                  Semua admin bisa melihat pesanan, laporan, katalog, dan pengaturan. Tidak ada
                  peran terpisah di MVP. Akun nonaktif tidak bisa masuk dan sesinya langsung
                  berakhir.
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
