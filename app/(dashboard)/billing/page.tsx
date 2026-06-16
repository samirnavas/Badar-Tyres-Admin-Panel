import { Receipt, Clock, CreditCard, Banknote, Download } from "lucide-react";
import { cn } from "@/lib/format";

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Billing &amp; Invoices
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your incoming payments, generated invoices, and financial history.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value="₹ 1,45,000"
          trend="+12%"
          icon={<Banknote className="h-5 w-5 text-emerald-600" />}
          trendUp
        />
        <StatCard
          title="Pending Payments"
          value="₹ 24,500"
          trend="8 invoices"
          icon={<Clock className="h-5 w-5 text-amber-600" />}
          trendUp={false}
        />
        <StatCard
          title="Completed Transactions"
          value="142"
          trend="This month"
          icon={<CreditCard className="h-5 w-5 text-blue-600" />}
          trendUp
        />
        <StatCard
          title="Avg. Invoice Value"
          value="₹ 4,800"
          trend="+5%"
          icon={<Receipt className="h-5 w-5 text-purple-600" />}
          trendUp
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-gray-900">Recent Invoices</h2>
          <button className="text-sm font-medium text-theme-accent transition-colors hover:text-theme-accent-dark">
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-6 py-3.5">Invoice #</th>
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Amount</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {dummyInvoices.map((invoice) => (
                <tr key={invoice.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {invoice.id}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{invoice.customer}</td>
                  <td className="px-6 py-4 text-gray-600">{invoice.date}</td>
                  <td className="px-6 py-4 font-medium text-gray-900 tabular-nums">
                    {invoice.amount}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        invoice.status === "Paid"
                          ? "bg-green-100 text-green-700"
                          : invoice.status === "Pending"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-gray-100 text-gray-700"
                      )}
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                      title="Download PDF"
                    >
                      <Download className="h-3.5 w-3.5" />
                      PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  trend,
  icon,
  trendUp,
}: {
  title: string;
  value: string;
  trend: string;
  icon: React.ReactNode;
  trendUp: boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <div className="rounded-full bg-gray-50 p-2">{icon}</div>
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <span
          className={cn(
            "text-xs font-medium",
            trendUp ? "text-emerald-600" : "text-gray-500"
          )}
        >
          {trend}
        </span>
      </div>
    </div>
  );
}

const dummyInvoices = [
  {
    id: "INV-2026-001",
    customer: "Ramesh Kumar",
    date: "Jun 16, 2026",
    amount: "₹ 12,400",
    status: "Paid",
  },
  {
    id: "INV-2026-002",
    customer: "Sarah Logistics",
    date: "Jun 15, 2026",
    amount: "₹ 45,000",
    status: "Pending",
  },
  {
    id: "INV-2026-003",
    customer: "Amit Singh",
    date: "Jun 14, 2026",
    amount: "₹ 3,200",
    status: "Paid",
  },
  {
    id: "INV-2026-004",
    customer: "Kerala Tours Ltd",
    date: "Jun 12, 2026",
    amount: "₹ 18,900",
    status: "Overdue",
  },
];
