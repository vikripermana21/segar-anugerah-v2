/**
 * Aturan aksi admin atas satu pesanan. Murni: dipakai server action dan
 * komponen tampilan tanpa menyentuh database.
 */
import type { OrderStatus } from "./order-status";

export type AdminOrderAction = "dispatch" | "complete" | "cancel" | "refund";

export const adminActionMeta: Record<
  AdminOrderAction,
  { label: string; next: OrderStatus; pendingLabel: string }
> = {
  dispatch: {
    label: "Sedang diantar",
    next: "out_for_delivery",
    pendingLabel: "Mengubah status…",
  },
  complete: {
    label: "Selesai",
    next: "completed",
    pendingLabel: "Menyelesaikan…",
  },
  cancel: {
    label: "Batalkan pesanan",
    next: "cancelled",
    pendingLabel: "Membatalkan…",
  },
  refund: {
    label: "Catat dana dikembalikan",
    next: "refunded",
    pendingLabel: "Mencatat…",
  },
};

const allowed: Record<OrderStatus, AdminOrderAction[]> = {
  pending_payment: [],
  paid: ["dispatch", "cancel"],
  processing: ["dispatch", "cancel"],
  out_for_delivery: ["complete", "cancel"],
  completed: [],
  cancelled: [],
  expired: [],
  paid_late: ["refund"],
  refunded: [],
};

/**
 * `cancel` hanya mengembalikan stok bila pesanan belum pernah melepasnya.
 * `paid_late` lahir dari pesanan `expired`, jadi stoknya sudah kembali.
 */
export function releasesStockOnCancel(status: OrderStatus): boolean {
  return status === "paid" || status === "processing" || status === "out_for_delivery";
}

/**
 * Refund hanya masuk akal bila uang pernah diterima. `cancelled` dari webhook
 * gagal bayar tidak punya `paidAt`, jadi tidak boleh ditandai refund.
 */
export function canAdminAct(
  status: OrderStatus,
  action: AdminOrderAction,
  options: { paidAt?: Date | null } = {},
): boolean {
  if (action === "refund") {
    if (status === "paid_late") return true;
    return status === "cancelled" && Boolean(options.paidAt);
  }

  return allowed[status].includes(action);
}
