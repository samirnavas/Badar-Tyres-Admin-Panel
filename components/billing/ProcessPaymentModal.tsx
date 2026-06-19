"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { X, Loader2, CreditCard } from "lucide-react";
import { recordPayment } from "@/lib/repositories/invoice_repository";
import { paymentMethods, type Invoice } from "@/lib/models/Invoice";
import { cn, formatCurrency } from "@/lib/format";

const paymentSchema = z.object({
  amountPaid: z
    .number({ message: "Enter a valid amount" })
    .min(0.01, "Amount must be greater than zero"),
  paymentMethod: z.enum(paymentMethods),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

export function ProcessPaymentModal({
  open,
  onClose,
  invoice,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onSuccess: () => void;
}) {
  const outstanding = invoice
    ? Math.max(0, invoice.total - invoice.amountPaid)
    : 0;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amountPaid: outstanding,
      paymentMethod: "Cash",
    },
  });

  useEffect(() => {
    if (open && invoice) {
      reset({
        amountPaid: Math.max(0, invoice.total - invoice.amountPaid),
        paymentMethod: invoice.paymentMethod ?? "Cash",
      });
    }
  }, [open, invoice, reset]);

  const mutation = useMutation({
    mutationFn: (values: PaymentFormValues) => {
      if (!invoice) throw new Error("Invoice not found");
      const cumulativePaid = invoice.amountPaid + values.amountPaid;
      return recordPayment(invoice.id, {
        amountPaid: cumulativePaid,
        paymentMethod: values.paymentMethod,
      });
    },
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !invoice || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Process payment"
        className="relative w-full max-w-md rounded-t-2xl border border-gray-200 bg-white shadow-2xl sm:rounded-2xl [color-scheme:light]"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900 text-white">
              <CreditCard className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Process Payment
              </h2>
              <p className="text-xs text-gray-500">
                Outstanding: ₹{formatCurrency(outstanding)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          className="space-y-4 p-5"
        >
          <Field label="Payment Amount (INR)" error={errors.amountPaid?.message}>
            <input
              type="number"
              step="0.01"
              min={0.01}
              max={outstanding}
              {...register("amountPaid", { valueAsNumber: true })}
              className={inputClass(!!errors.amountPaid)}
            />
          </Field>

          <Field label="Payment Method" error={errors.paymentMethod?.message}>
            <select
              {...register("paymentMethod")}
              className={inputClass(!!errors.paymentMethod)}
            >
              {paymentMethods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </Field>

          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
            Invoice total:{" "}
            <span className="font-semibold text-gray-900 tabular-nums">
              ₹{formatCurrency(invoice.total)}
            </span>
            {" · "}
            Already paid:{" "}
            <span className="font-semibold text-gray-900 tabular-nums">
              ₹{formatCurrency(invoice.amountPaid)}
            </span>
          </div>

          {mutation.isError && (
            <p className="text-xs font-medium text-theme-accent">
              {(mutation.error as Error)?.message ?? "Failed to record payment."}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || outstanding <= 0}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-60"
            >
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {mutation.isPending ? "Processing..." : "Record Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-xs font-medium text-theme-accent">{error}</p>
      )}
    </div>
  );
}

function inputClass(hasError: boolean): string {
  return cn(
    "w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1",
    hasError
      ? "border-theme-accent focus:border-theme-accent focus:ring-theme-accent"
      : "border-gray-200 focus:border-gray-900 focus:ring-gray-900",
  );
}
