"use client";

import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Printer,
  Loader2,
  CreditCard,
  Mail,
  CheckCircle2,
} from "lucide-react";
import { getJobCardById, getSettings } from "@/lib/repositories";
import { getOrCreateInvoiceForJob } from "@/lib/repositories/invoice_repository";
import { getJobLineItems } from "@/lib/models/JobCard";
import { ProcessPaymentModal } from "@/components/billing/ProcessPaymentModal";
import { cn, formatCurrency, formatDate } from "@/lib/format";
import type { InvoiceStatus } from "@/lib/models/Invoice";

interface InvoiceLine {
  id: string;
  name: string;
  qty: number;
  rate: number;
  gstRate: number;
  taxAmount: number;
  lineTotal: number;
}

const invoiceStatusStyles: Record<InvoiceStatus, string> = {
  Unpaid: "bg-gray-100 text-gray-700",
  Partial: "bg-gray-200 text-gray-800",
  Paid: "bg-gray-900 text-white",
};

export default function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: jobId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [emailSending, setEmailSending] = useState(false);

  const jobQuery = useQuery({
    queryKey: ["job-card", jobId],
    queryFn: () => getJobCardById(jobId),
  });

  const invoiceQuery = useQuery({
    queryKey: ["invoice", jobId],
    queryFn: () => getOrCreateInvoiceForJob(jobId),
    enabled: !!jobQuery.data,
  });

  const settingsQuery = useQuery({
    queryKey: ["shop-settings"],
    queryFn: getSettings,
  });

  const job = jobQuery.data;
  const invoice = invoiceQuery.data;

  const lines: InvoiceLine[] = useMemo(() => {
    if (!job) return [];

    return getJobLineItems(job).map((item, index) => {
      const gstRate = item.gst_rate ?? 0;
      const taxAmount = (item.total * gstRate) / 100;
      return {
        id: `${item.serviceId ?? item.partId ?? index}-${index}`,
        name: item.name,
        qty: item.quantity,
        rate: item.unitPrice,
        gstRate,
        taxAmount,
        lineTotal: item.total,
      };
    });
  }, [job]);

  const outstanding = invoice
    ? Math.max(0, invoice.total - invoice.amountPaid)
    : 0;

  const handlePaymentSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["invoice", jobId] });
    queryClient.invalidateQueries({ queryKey: ["job-card", jobId] });
    queryClient.invalidateQueries({ queryKey: ["invoices"] });
    queryClient.invalidateQueries({ queryKey: ["billing-metrics"] });
    queryClient.invalidateQueries({ queryKey: ["job-cards"] });
    router.refresh();
  };

  const sendEmailReceipt = async () => {
    if (!invoice) return;
    setEmailSending(true);
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/send`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to send receipt email.");
      }
      setToast(data.message ?? "Receipt email queued successfully.");
      window.setTimeout(() => setToast(null), 4000);
    } catch (error) {
      setToast(
        (error as Error)?.message ?? "Failed to send receipt email.",
      );
      window.setTimeout(() => setToast(null), 4000);
    } finally {
      setEmailSending(false);
    }
  };

  const isLoading =
    jobQuery.isLoading || invoiceQuery.isLoading || settingsQuery.isLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (jobQuery.isError || !job || !invoice) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center">
        <p className="text-sm font-medium text-theme-accent">
          Invoice not found for this job card.
        </p>
        <button
          onClick={() => router.back()}
          className="mt-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" /> Go back
        </button>
      </div>
    );
  }

  const settings = settingsQuery.data;
  const shortId = invoice.id.slice(0, 8).toUpperCase();

  return (
    <div
      className="relative mx-auto max-w-3xl"
      style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
    >
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-lg print:hidden">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{toast}</p>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {invoice.status !== "Paid" && (
            <button
              onClick={() => setPaymentOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-900 bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
            >
              <CreditCard className="h-4 w-4" /> Process Payment
            </button>
          )}
          <button
            onClick={sendEmailReceipt}
            disabled={emailSending}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50 disabled:opacity-60"
          >
            {emailSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            Send Email Receipt
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg bg-theme-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-theme-accent-dark"
          >
            <Printer className="h-4 w-4" /> Print Invoice
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm print:w-full print:max-w-none print:rounded-none print:border-none print:p-0 print:shadow-none sm:p-10 [color-scheme:light]">
        <div className="flex flex-wrap items-start justify-between gap-6 border-b border-gray-200 pb-6">
          <div className="max-w-xs">
            <img
              src="/badar_logo_black.svg"
              alt={settings?.shop_name ?? "Shop logo"}
              className="mb-3 h-9 w-auto"
            />
            <p className="text-sm font-bold text-gray-900">
              {settings?.shop_name}
            </p>
            <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-gray-500">
              {settings?.shop_address}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {settings?.contact_phone} · {settings?.contact_email}
            </p>
          </div>

          <div className="text-right">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              INVOICE
            </h1>
            <dl className="mt-3 space-y-1 text-xs">
              <div className="flex justify-end gap-2">
                <dt className="text-gray-400">Invoice</dt>
                <dd className="font-semibold text-gray-900">#{shortId}</dd>
              </div>
              <div className="flex justify-end gap-2">
                <dt className="text-gray-400">Job Card</dt>
                <dd className="font-medium text-gray-700">
                  #{job.id.slice(0, 8).toUpperCase()}
                </dd>
              </div>
              <div className="flex justify-end gap-2">
                <dt className="text-gray-400">Date</dt>
                <dd className="font-medium text-gray-700">
                  {formatDate(invoice.createdAt)}
                </dd>
              </div>
              <div className="flex items-center justify-end gap-2">
                <dt className="text-gray-400">Status</dt>
                <dd>
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      invoiceStatusStyles[invoice.status],
                    )}
                  >
                    {invoice.status}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 border-b border-gray-200 py-6 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Billed To
            </p>
            <p className="mt-1.5 text-sm font-semibold text-gray-900">
              {job.customer?.name ?? "—"}
            </p>
            <p className="text-xs text-gray-500">{job.customer?.phone ?? "—"}</p>
            <p className="text-xs text-gray-500">{job.customer?.email ?? ""}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Vehicle
            </p>
            <p className="mt-1.5 text-sm font-semibold text-gray-900">
              {job.vehicle
                ? `${job.vehicle.manufacturer} ${job.vehicle.model}`
                : "—"}
            </p>
            <p className="text-xs text-gray-500">
              {job.vehicle?.type ?? ""}
              {job.vehicle ? " · " : ""}
              <span className="font-medium uppercase">
                {job.vehicle?.registration_number ?? ""}
              </span>
            </p>
          </div>
        </div>

        <table className="mt-6 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-gray-300 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              <th className="py-2 pr-2">Service / Part</th>
              <th className="px-2 py-2 text-center">Qty</th>
              <th className="px-2 py-2 text-right">Rate</th>
              <th className="px-2 py-2 text-right">Tax</th>
              <th className="py-2 pl-2 text-right">Line Total</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.id} className="border-b border-gray-100">
                <td className="py-3 pr-2 font-medium text-gray-900">
                  {line.name}
                </td>
                <td className="px-2 py-3 text-center text-gray-600 tabular-nums">
                  {line.qty}
                </td>
                <td className="px-2 py-3 text-right text-gray-600 tabular-nums">
                  ₹ {formatCurrency(line.rate)}
                </td>
                <td className="px-2 py-3 text-right text-gray-600 tabular-nums">
                  {line.gstRate}% · ₹ {formatCurrency(line.taxAmount)}
                </td>
                <td className="py-3 pl-2 text-right font-medium text-gray-900 tabular-nums">
                  ₹ {formatCurrency(line.lineTotal)}
                </td>
              </tr>
            ))}
            {lines.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="py-6 text-center text-sm text-gray-500"
                >
                  No line items recorded for this job card.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="mt-6 flex justify-end">
          <dl className="w-full max-w-xs space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <dt>Subtotal</dt>
              <dd className="tabular-nums">₹ {formatCurrency(invoice.subtotal)}</dd>
            </div>
            <div className="flex justify-between text-gray-600">
              <dt>Total Tax</dt>
              <dd className="tabular-nums">₹ {formatCurrency(invoice.tax)}</dd>
            </div>
            <div className="flex justify-between border-t border-gray-300 pt-2 text-base font-bold text-gray-900">
              <dt>Grand Total</dt>
              <dd className="tabular-nums">₹ {formatCurrency(invoice.total)}</dd>
            </div>
            <div className="flex justify-between text-gray-600">
              <dt>Amount Paid</dt>
              <dd className="tabular-nums">
                ₹ {formatCurrency(invoice.amountPaid)}
              </dd>
            </div>
            {outstanding > 0 && (
              <div className="flex justify-between font-semibold text-gray-900">
                <dt>Outstanding</dt>
                <dd className="tabular-nums">₹ {formatCurrency(outstanding)}</dd>
              </div>
            )}
            {invoice.paymentMethod && (
              <div className="flex justify-between text-xs text-gray-500">
                <dt>Payment Method</dt>
                <dd>{invoice.paymentMethod}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 border-t border-gray-200 pt-6 sm:grid-cols-[1fr_auto]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Terms &amp; Conditions
            </p>
            <p className="mt-1.5 whitespace-pre-line text-xs leading-relaxed text-gray-500">
              {settings?.terms_and_conditions || "—"}
            </p>
          </div>
          <div className="flex flex-col justify-end">
            <div className="mt-10 w-48 border-t border-gray-400 pt-2 text-center">
              <p className="text-xs text-gray-500">Authorised Signature</p>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-[11px] text-gray-400">
          Thank you for choosing {settings?.shop_name}.
        </p>
      </div>

      <ProcessPaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        invoice={invoice}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
