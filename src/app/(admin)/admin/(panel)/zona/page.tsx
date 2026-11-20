import Link from "next/link";
import { asc } from "drizzle-orm";
import { Info, MapPin, Plus, Truck, X } from "lucide-react";

import { db } from "@/db";
import { deliveryZone, deliveryZoneArea } from "@/db/schema";
import { rupiah } from "@/lib/store-data";

import { ActionForm } from "../_components/action-form";
import { Badge, Card, CardBody, CardHead, EmptyNote, inputClass, Tile } from "../_components/ui";
import { addArea, createZone, deleteArea, setZoneActive, updateZone } from "./actions";

export const instant = false;

type SearchParams = Promise<{ zona?: string }>;

export default async function AdminZonePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { zona } = await searchParams;

  const [zones, areas] = await Promise.all([
    db.select().from(deliveryZone).orderBy(asc(deliveryZone.sortOrder), asc(deliveryZone.name)),
    db
      .select()
      .from(deliveryZoneArea)
      .orderBy(asc(deliveryZoneArea.kecamatan), asc(deliveryZoneArea.city)),
  ]);

  const areasByZone = new Map<string, typeof areas>();
  for (const area of areas) {
    const list = areasByZone.get(area.zoneId) ?? [];
    list.push(area);
    areasByZone.set(area.zoneId, list);
  }

  const selected = zona ? zones.find((zone) => zone.id === zona) : undefined;
  const selectedAreas = selected ? (areasByZone.get(selected.id) ?? []) : [];
  const activeZones = zones.filter((zone) => zone.isActive).length;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="admin-h1">Zona ongkir</h1>
          <p className="admin-sub">
            {zones.length} zona · {areas.length} kecamatan terlayani · {activeZones} aktif
          </p>
        </div>
        <Link href="/admin/zona" className="admin-btn">
          <Plus size={15} strokeWidth={2.1} />
          Tambah zona
        </Link>
      </div>

      <div className="admin-split mt-5">
        <Card className="min-w-0">
          <CardHead
            title="Zona pengiriman"
            note="Satu kecamatan hanya boleh ada di satu zona aktif"
          />

          {zones.length === 0 ? (
            <div className="admin-card-body">
              <EmptyNote>Belum ada zona. Tambah satu di panel kanan.</EmptyNote>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Zona</th>
                    <th className="w-[140px]">Tarif</th>
                    <th className="w-[120px]">Kecamatan</th>
                    <th className="w-[130px]">Status</th>
                    <th className="w-[64px] text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {zones.map((zone, index) => {
                    const zoneAreas = areasByZone.get(zone.id) ?? [];
                    const isSelected = selected?.id === zone.id;

                    return (
                      <tr key={zone.id} className={isSelected ? "bg-green-50/60" : undefined}>
                        <td>
                          <span className="flex items-center gap-2.5">
                            <Tile>
                              <Truck size={16} strokeWidth={1.9} />
                            </Tile>
                            <span className="min-w-0">
                              <span className="admin-name block truncate">{zone.name}</span>
                              <span className="admin-muted block">
                                ZONA-{String(index + 1).padStart(2, "0")}
                              </span>
                            </span>
                          </span>
                        </td>
                        <td>
                          <span className="text-[12px] font-medium text-ink">{rupiah(zone.fee)}</span>
                        </td>
                        <td>{zoneAreas.length} kecamatan</td>
                        <td>
                          <Badge tone={zone.isActive ? undefined : "muted"}>
                            {zone.isActive ? "Aktif" : "Nonaktif"}
                          </Badge>
                        </td>
                        <td className="text-right">
                          <Link
                            href={isSelected ? "/admin/zona" : `/admin/zona?zona=${zone.id}`}
                            className="admin-link"
                          >
                            {isSelected ? "Tutup" : "Buka"}
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="border-t border-line-soft px-5 py-3 text-[11px] leading-relaxed text-ink-3">
            Tarif diisi admin, bukan ditanam di kode, supaya jangkauan bisa meluas tanpa deploy.
          </div>
        </Card>

        <Card>
          {selected ? (
            <>
              <CardHead
                title={selected.name}
                note={`${rupiah(selected.fee)} · ${selectedAreas.length} kecamatan · ${
                  selected.isActive ? "aktif" : "nonaktif"
                }`}
                action={<Badge tone={selected.isActive ? undefined : "muted"}>{selected.isActive ? "Aktif" : "Nonaktif"}</Badge>}
              />

              <CardBody>
                <h3 className="text-[12px] font-semibold text-ink">
                  Kecamatan dalam zona ini
                </h3>

                {selectedAreas.length === 0 ? (
                  <p className="admin-help mt-2">Belum ada kecamatan di zona ini.</p>
                ) : (
                  <ul className="mt-2.5 flex flex-wrap gap-1.5">
                    {selectedAreas.map((area) => (
                      <li
                        key={area.id}
                        className="flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-[11.5px] text-green-700"
                      >
                        {area.kecamatan}
                        <form action={deleteArea}>
                          <input type="hidden" name="id" value={area.id} />
                          <button
                            type="submit"
                            aria-label={`Hapus ${area.kecamatan}`}
                            className="text-green-700/70 hover:text-red-600"
                          >
                            <X size={11} strokeWidth={2.4} />
                          </button>
                        </form>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-4">
                  <ActionForm action={addArea} submitLabel="Tambah kecamatan">
                    <input type="hidden" name="zoneId" value={selected.id} />

                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="admin-label">
                        Kecamatan
                        <input
                          name="kecamatan"
                          required
                          placeholder="Cilandak"
                          className={inputClass}
                        />
                      </label>
                      <label className="admin-label">
                        Kota
                        <input
                          name="city"
                          required
                          placeholder="Jakarta Selatan"
                          className={inputClass}
                        />
                      </label>
                    </div>

                    <p className="admin-help">
                      Kecamatan yang sudah dipakai zona lain akan ditolak.
                    </p>
                  </ActionForm>
                </div>

                <div className="mt-5 border-t border-line-soft pt-4">
                  <h3 className="text-[12px] font-semibold text-ink">Ubah zona</h3>

                  <div className="mt-2.5">
                    <ActionForm action={updateZone} submitLabel="Simpan perubahan">
                      <input type="hidden" name="id" value={selected.id} />

                      <div className="grid gap-3 sm:grid-cols-3">
                        <label className="admin-label">
                          Nama
                          <input
                            name="name"
                            defaultValue={selected.name}
                            required
                            className={inputClass}
                          />
                        </label>
                        <label className="admin-label">
                          Tarif (Rp)
                          <input
                            name="fee"
                            type="number"
                            min={0}
                            defaultValue={selected.fee}
                            className={inputClass}
                          />
                        </label>
                        <label className="admin-label">
                          Urutan
                          <input
                            name="sortOrder"
                            type="number"
                            min={0}
                            defaultValue={selected.sortOrder}
                            className={inputClass}
                          />
                        </label>
                      </div>
                    </ActionForm>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3 rounded-[10px] bg-bg px-3.5 py-2.5">
                    <span className="text-[11.5px] text-ink-2">
                      {selected.isActive ? "Zona tampil di checkout" : "Zona disembunyikan"}
                    </span>
                    <form action={setZoneActive}>
                      <input type="hidden" name="id" value={selected.id} />
                      <input type="hidden" name="active" value={selected.isActive ? "0" : "1"} />
                      <button
                        type="submit"
                        className="admin-btn-ghost admin-btn-sm"
                        aria-label={selected.isActive ? "Nonaktifkan zona" : "Aktifkan zona"}
                      >
                        {selected.isActive ? "Nonaktifkan zona" : "Aktifkan zona"}
                      </button>
                    </form>
                  </div>
                </div>
              </CardBody>
            </>
          ) : (
            <>
              <CardHead title="Tambah zona" note="Tarif dipakai saat checkout" className="pb-2.5" />
              <CardBody>
                <ActionForm action={createZone} submitLabel="Simpan zona">
                  <label className="admin-label">
                    Nama zona
                    <input
                      name="name"
                      required
                      placeholder="Jakarta Selatan"
                      className={inputClass}
                    />
                  </label>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="admin-label">
                      Tarif (Rp)
                      <input name="fee" type="number" min={0} required className={inputClass} />
                    </label>
                    <label className="admin-label">
                      Urutan
                      <input
                        name="sortOrder"
                        type="number"
                        min={0}
                        defaultValue={0}
                        className={inputClass}
                      />
                    </label>
                  </div>

                  <p className="flex gap-2.5 rounded-[10px] bg-green-50 p-3.5 text-[11.5px] leading-relaxed text-green-700">
                    <Info size={15} strokeWidth={1.9} className="mt-0.5 shrink-0" />
                    Setelah zona dibuat, buka zonanya untuk menambah kecamatan dan tarif.
                  </p>
                </ActionForm>

                <div className="mt-4 flex items-start gap-2.5 rounded-[10px] border border-line px-3.5 py-3 text-[11px] leading-relaxed text-ink-3">
                  <MapPin size={14} strokeWidth={1.9} className="mt-0.5 shrink-0" />
                  Menghapus zona juga menghapus daftar kecamatannya. Nonaktifkan zona bila hanya
                  ingin menyembunyikannya dari checkout.
                </div>
              </CardBody>
            </>
          )}
        </Card>
      </div>
    </>
  );
}
