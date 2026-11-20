import { getSession } from "@/lib/auth";
import { listCustomerOrders } from "@/lib/order-view";
import { orderFilters } from "@/lib/order-status";

export async function GET(request: Request) {
  const session = await getSession("customer");
  if (!session || session.type !== "customer") {
    return Response.json({ ok: false, message: "Masuk dulu." }, { status: 401 });
  }

  const url = new URL(request.url);
  const filterKey = url.searchParams.get("status");
  const cursor = url.searchParams.get("cursor");
  const filter = orderFilters.find((item) => item.key === filterKey) ?? orderFilters[0];

  const page = await listCustomerOrders(session.id, {
    statuses: filter.statuses,
    cursor,
  });

  return Response.json({ ok: true, ...page }, { headers: { "Cache-Control": "no-store" } });
}
