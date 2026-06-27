"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpDown, Receipt, TrendingUp, Wallet } from "lucide-react";
import {
  getInvoices,
  getBillingMetrics,
} from "@/lib/repositories/invoice_repository";
import { getCustomers } from "@/lib/repositories";
import type { Invoice, InvoiceStatus } from "@/lib/models/Invoice";
import { cn, formatCurrency, formatDate } from "@/lib/format";
import { useRouter } from "next/navigation";

type SortField = "status" | "createdAt";
type SortDirection = "asc" | "desc";

const statusOrder: Record<InvoiceStatus, number> = {
  Unpaid: 0,
  Partial: 1,
  Paid: 2,
};

const statusStyles: Record<InvoiceStatus, string> = {
  Unpaid: "bg-gray-100 text-gray-700 border-gray-200",
  Partial: "bg-gray-200 text-gray-800 border-gray-300",
  Paid: "bg-gray-900 text-white border-gray-900",
};

export default function BillingClient() {
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const invoicesQuery = useQuery({
    queryKey: ["invoices"],
    queryFn: getInvoices,
  });
  const metricsQuery = useQuery({
    queryKey: ["billing-metrics"],
    queryFn: getBillingMetrics,
  });
  const customersQuery = useQuery({
    queryKey: ["customers"],
    queryFn: getCustomers,
  });

  const customerMap = useMemo(
    () => new Map((customersQuery.data ?? []).map((c) => [c.id, c.name])),
    [customersQuery.data],
  );

  const sortedInvoices = useMemo(() => {
    const rows = [...(invoicesQuery.data ?? [])];
    rows.sort((a, b) => {
      let comparison = 0;
      if (sortField === "status") {
        comparison = statusOrder[a.status] - statusOrder[b.status];
      } else {
        comparison =
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
    return rows;
  }, [invoicesQuery.data, sortField, sortDirection]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortField(field);
    setSortDirection(field === "createdAt" ? "desc" : "asc");
  };

  const isLoading =
    invoicesQuery.isLoading ||
    metricsQuery.isLoading ||
    customersQuery.isLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Billing & Invoices
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Track payments, outstanding balances, and daily revenue.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Unpaid"
          value={`₹${formatCurrency(metricsQuery.data?.totalUnpaid ?? 0)}`}
          icon={Wallet}
          loading={metricsQuery.isLoading}
        />
        <MetricCard
          label="Revenue Today"
          value={`₹${formatCurrency(metricsQuery.data?.revenueToday ?? 0)}`}
          icon={TrendingUp}
          loading={metricsQuery.isLoading}
        />
        <MetricCard
          label="Paid Invoices"
          value={String(metricsQuery.data?.paidCount ?? 0)}
          icon={Receipt}
          loading={metricsQuery.isLoading}
        />
        <MetricCard
          label="Partial Payments"
          value={String(metricsQuery.data?.partialCount ?? 0)}
          icon={ArrowUpDown}
          loading={metricsQuery.isLoading}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white/70 shadow-sm backdrop-blur-md">
        <div className="border-b border-gray-200/80 px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-900">All Invoices</h2>
        </div>

        <div className="w-full overflow-auto max-h-[calc(100vh-200px)]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur shadow-[0_1px_0_rgba(0,0,0,0.1)] text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr className="border-b border-gray-200/80 text-left">
                <th className="px-3 py-2">Invoice</th>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">
                  <SortButton
                    label="Status"
                    active={sortField === "status"}
                    direction={sortDirection}
                    onClick={() => toggleSort("status")}
                  />
                </th>
                <th className="px-3 py-2 text-right">Total</th>
                <th className="px-3 py-2 text-right">Paid</th>
                <th className="px-3 py-2">
                  <SortButton
                    label="Created"
                    active={sortField === "createdAt"}
                    direction={sortDirection}
                    onClick={() => toggleSort("createdAt")}
                  />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {isLoading &&
                Array.from({ length: 4 }).map((_, index) => (
                  <tr key={index}>
                    {Array.from({ length: 6 }).map((__, cell) => (
                      <td key={cell} className="px-3 py-2">
                        <div className="h-4 animate-pulse rounded bg-gray-200" />
                      </td>
                    ))}
                  </tr>
                ))}

              {!isLoading &&
                sortedInvoices.map((invoice) => (
                  <InvoiceRow
                    key={invoice.id}
                    invoice={invoice}
                    customerName={
                      customerMap.get(invoice.customerId) ?? "Unknown"
                    }
                  />
                ))}

              {!isLoading && sortedInvoices.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-4 text-center text-sm text-gray-500"
                  >
                    No invoices found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  loading,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  loading: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/50 bg-white/45 p-5 shadow-sm backdrop-blur-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900 tabular-nums">
            {loading ? "—" : value}
          </p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900/5 text-gray-700">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

function SortButton({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active: boolean;
  direction: SortDirection;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 transition-colors hover:text-gray-900",
        active && "text-gray-900",
      )}
    >
      {label}
      <ArrowUpDown className="h-3.5 w-3.5" />
      {active && (
        <span className="sr-only">{direction === "asc" ? "ascending" : "descending"}</span>
      )}
    </button>
  );
}

function InvoiceRow({
  invoice,
  customerName,
}: {
  invoice: Invoice;
  customerName: string;
}) {
  const router = useRouter();
  return (
    <tr
      onClick={() => router.push(`/jobs/${invoice.jobId}/invoice`)}
      className="cursor-pointer transition-colors hover:bg-gray-50/80"
    >
      <td className="px-3 py-2 font-mono text-xs font-medium text-gray-600">
        #{invoice.id.slice(0, 8).toUpperCase()}
      </td>
      <td className="px-3 py-2 font-medium text-gray-900">{customerName}</td>
      <td className="px-3 py-2">
        <span
          className={cn(
            "inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
            statusStyles[invoice.status],
          )}
        >
          {invoice.status}
        </span>
      </td>
      <td className="px-3 py-2 text-right font-medium text-gray-900 tabular-nums">
        ₹{formatCurrency(invoice.total)}
      </td>
      <td className="px-3 py-2 text-right text-gray-600 tabular-nums">
        ₹{formatCurrency(invoice.amountPaid)}
      </td>
      <td className="px-3 py-2 text-gray-500">
        {formatDate(invoice.createdAt)}
      </td>
    </tr>
  );
}
