import { getPolar } from "@/lib/polar";

export interface PolarInvoiceRow {
  id: string;
  date: string;
  createdAt: Date;
  description: string;
  amount: number;
  invoiceNumber: string;
  status: "paid" | "pending" | "refunded";
  portalUrl: string;
}

function mapOrderStatus(paid: boolean, status: string): PolarInvoiceRow["status"] {
  if (status === "refunded") return "refunded";
  if (paid) return "paid";
  return "pending";
}

export async function fetchPolarInvoices(
  customerId: string,
  limit = 8,
): Promise<{ invoices: PolarInvoiceRow[]; ytdTotal: number }> {
  if (!process.env.POLAR_ACCESS_TOKEN) {
    return { invoices: [], ytdTotal: 0 };
  }

  try {
    const polar = getPolar();
    const iterator = await polar.orders.list({ customerId, limit });
    const orders: PolarInvoiceRow[] = [];

    for await (const page of iterator) {
      for (const order of page.result.items) {
        orders.push({
          id: order.id,
          date: order.createdAt.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          createdAt: order.createdAt,
          description: order.description || order.product?.name || "Order",
          amount: order.totalAmount / 100,
          invoiceNumber: order.invoiceNumber || order.id.slice(0, 8).toUpperCase(),
          status: mapOrderStatus(order.paid, order.status),
          portalUrl: "/api/billing/portal",
        });
      }
      if (orders.length >= limit) break;
    }

    const yearStart = new Date(new Date().getFullYear(), 0, 1);
    const ytdTotal = orders
      .filter((o) => o.createdAt >= yearStart && o.status === "paid")
      .reduce((s, o) => s + o.amount, 0);

    return { invoices: orders.slice(0, limit), ytdTotal };
  } catch {
    return { invoices: [], ytdTotal: 0 };
  }
}
