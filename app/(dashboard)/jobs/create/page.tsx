"use client";

import { useRouter } from "next/navigation";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  User,
  Wrench,
  ClipboardCheck,
  Plus,
  Trash2,
  CheckCircle2,
  ChevronDown,
  CarFront,
} from "lucide-react";
import {
  useTechnicians,
  useManufacturers,
  useServices,
  useCreateJob,
} from "@/lib/hooks";
import { cn, formatCurrency } from "@/lib/format";
import { createJobSchema, type CreateJobForm, GST_RATE } from "./schema";

export default function CreateJobPage() {
  const router = useRouter();
  const technicians = useTechnicians();
  const manufacturers = useManufacturers();
  const services = useServices();
  const createJob = useCreateJob();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateJobForm>({
    resolver: zodResolver(createJobSchema),
    defaultValues: {
      customerName: "",
      mobile: "",
      vehicleType: "Car",
      wheelType: "",
      tyreType: "",
      manufacturer: "",
      model: "",
      vehicleNumber: "",
      technician: "",
      services: [{ name: "", qty: 1, rate: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "services",
  });

  const watchedServices = useWatch({ control, name: "services" }) ?? [];

  const subtotal = watchedServices.reduce((sum, s) => {
    const qty = Number(s?.qty) || 0;
    const rate = Number(s?.rate) || 0;
    return sum + qty * rate;
  }, 0);
  const gst = subtotal * GST_RATE;
  const grandTotal = subtotal + gst;

  const onSubmit = (values: CreateJobForm) => {
    createJob.mutate(
      {
        customerName: values.customerName,
        mobile: values.mobile,
        vehicleType: values.vehicleType,
        wheelType: values.wheelType,
        tyreType: values.tyreType,
        vehicleModel: `${values.manufacturer} ${values.model}`.trim(),
        vehicleNumber: values.vehicleNumber,
        technician: values.technician,
        services: values.services.map((s) => ({
          name: s.name,
          description: `${s.qty} × ₹${formatCurrency(s.rate)}`,
          amount: s.qty * s.rate,
        })),
      },
      {
        onSuccess: () => router.push("/jobs"),
      },
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Create New Job Card
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Log customer details and assign services to technicians.
          </p>
        </div>
        <button
          type="button"
          className="rounded-md border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Save Draft
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-6">
          {/* Customer Information */}
          <section className="rounded-md border border-gray-200 bg-white">
            <div className="flex items-center gap-2 border-b border-gray-200 px-5 py-4">
              <User className="h-4 w-4 text-theme-accent" />
              <h2 className="text-base font-semibold text-gray-900">
                Customer Information
              </h2>
            </div>
            <div className="space-y-4 p-5">
              <Field label="Customer Name" error={errors.customerName?.message}>
                <input
                  {...register("customerName")}
                  placeholder="e.g. John Doe"
                  className={inputClass(!!errors.customerName)}
                />
              </Field>

              <Field label="Mobile Number" error={errors.mobile?.message}>
                <input
                  {...register("mobile")}
                  placeholder="10-digit number"
                  className={inputClass(!!errors.mobile)}
                />
              </Field>

            </div>
          </section>

          {/* Vehicle Information */}
          <section className="rounded-md border border-gray-200 bg-white">
            <div className="flex items-center gap-2 border-b border-gray-200 px-5 py-4">
              <CarFront className="h-4 w-4 text-theme-accent" />
              <h2 className="text-base font-semibold text-gray-900">
                Vehicle Details
              </h2>
            </div>
            <div className="space-y-4 p-5">
              <Field label="Vehicle Type" error={errors.vehicleType?.message}>
                <div className="flex gap-4">
                  {["Car", "Bike", "Others"].map((type) => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value={type}
                        {...register("vehicleType")}
                        className="h-4 w-4 text-theme-accent focus:ring-theme-accent border-gray-300"
                        onChange={(e) => {
                          register("vehicleType").onChange(e);
                          // Reset manufacturer when vehicle type changes
                          control._formValues.manufacturer = "";
                        }}
                      />
                      <span className="text-sm font-medium text-gray-900">{type}</span>
                    </label>
                  ))}
                </div>
              </Field>

              <Field
                label="Vehicle Manufacturer"
                error={errors.manufacturer?.message}
              >
                <div className="relative">
                  <select
                    {...register("manufacturer")}
                    defaultValue=""
                    disabled={manufacturers.isLoading}
                    className={cn(inputClass(!!errors.manufacturer), "appearance-none pr-9")}
                  >
                    <option value="" disabled>
                      {manufacturers.isLoading
                        ? "Loading manufacturers..."
                        : "Select Manufacturer..."}
                    </option>
                    {(() => {
                      const type = useWatch({ control, name: "vehicleType" }) || "Car";
                      const options = manufacturers.data?.[type] || [];
                      return options.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ));
                    })()}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
              </Field>

              <Field label="Vehicle Model" error={errors.model?.message}>
                <input
                  {...register("model")}
                  placeholder="e.g. Corolla, Civic, Actros"
                  className={inputClass(!!errors.model)}
                />
              </Field>

              <Field
                label="Vehicle License ID"
                error={errors.vehicleNumber?.message}
              >
                <input
                  {...register("vehicleNumber")}
                  placeholder="E.G. LHR-1234"
                  className={inputClass(!!errors.vehicleNumber)}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Wheel Type" error={errors.wheelType?.message}>
                  <div className="flex gap-4">
                    {["Alloy", "Steel"].map((type) => (
                      <label key={type} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          value={type}
                          {...register("wheelType")}
                          className="h-4 w-4 text-theme-accent focus:ring-theme-accent border-gray-300"
                        />
                        <span className="text-sm font-medium text-gray-900">{type}</span>
                      </label>
                    ))}
                  </div>
                </Field>
                <Field label="Tyre Type" error={errors.tyreType?.message}>
                  <div className="flex gap-4">
                    {["TL", "TT"].map((type) => (
                      <label key={type} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          value={type}
                          {...register("tyreType")}
                          className="h-4 w-4 text-theme-accent focus:ring-theme-accent border-gray-300"
                        />
                        <span className="text-sm font-medium text-gray-900">{type}</span>
                      </label>
                    ))}
                  </div>
                </Field>
              </div>
            </div>
          </section>

          {/* Assignment */}
          <section className="rounded-md border border-gray-200 bg-white">
            <div className="flex items-center gap-2 border-b border-gray-200 px-5 py-4">
              <ClipboardCheck className="h-4 w-4 text-theme-accent" />
              <h2 className="text-base font-semibold text-gray-900">
                Assignment
              </h2>
            </div>
            <div className="p-5">
              <Field
                label="Lead Technician"
                error={errors.technician?.message}
              >
                <div className="relative">
                  <select
                    {...register("technician")}
                    defaultValue=""
                    disabled={technicians.isLoading}
                    className={cn(inputClass(!!errors.technician), "appearance-none pr-9")}
                  >
                    <option value="" disabled>
                      {technicians.isLoading
                        ? "Loading technicians..."
                        : "Select Technician..."}
                    </option>
                    {(technicians.data ?? []).map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
              </Field>
            </div>
          </section>
        </div>

        {/* Right column - Service Items */}
        <div className="space-y-6">
          <section className="rounded-md border border-gray-200 bg-white">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-theme-accent" />
                <h2 className="text-base font-semibold text-gray-900">
                  Service Items
                </h2>
              </div>
              <button
                type="button"
                onClick={() => append({ name: "", qty: 1, rate: 0 })}
                className="inline-flex items-center gap-1 text-sm font-semibold text-theme-accent transition-colors hover:text-theme-accent-dark"
              >
                <Plus className="h-4 w-4" /> Add Item
              </button>
            </div>

            <div className="p-5">
              {/* Column headers */}
              <div className="grid grid-cols-[1fr_64px_96px_104px_32px] items-center gap-2 border-b border-gray-200 pb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                <span>Service / Part</span>
                <span className="text-center">Qty</span>
                <span className="text-center">Rate (INR)</span>
                <span className="text-right">Amount</span>
                <span />
              </div>

              <div className="divide-y divide-gray-100">
                {fields.map((field, index) => {
                  const qty = Number(watchedServices[index]?.qty) || 0;
                  const rate = Number(watchedServices[index]?.rate) || 0;
                  const amount = qty * rate;
                  const rowError = errors.services?.[index];
                  return (
                    <div
                      key={field.id}
                      className="grid grid-cols-[1fr_64px_96px_104px_32px] items-center gap-2 py-3"
                    >
                      <div className="relative">
                        <select
                          {...register(`services.${index}.name` as const)}
                          defaultValue={field.name || ""}
                          disabled={services.isLoading}
                          className={cn(
                            inputClass(!!rowError?.name),
                            "appearance-none pr-8",
                          )}
                        >
                          <option value="" disabled>
                            {services.isLoading
                              ? "Loading services..."
                              : "Select service / part..."}
                          </option>
                          {(services.data ?? []).map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        min={1}
                        {...register(`services.${index}.qty` as const, {
                          valueAsNumber: true,
                        })}
                        className={cn(inputClass(!!rowError?.qty), "text-center")}
                      />
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        {...register(`services.${index}.rate` as const, {
                          valueAsNumber: true,
                        })}
                        className={cn(inputClass(!!rowError?.rate), "text-center")}
                      />
                      <span className="text-right text-sm font-medium text-gray-900 tabular-nums">
                        {formatCurrency(amount)}
                      </span>
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                        className="flex items-center justify-center rounded-md p-1.5 text-gray-400 transition-colors hover:bg-theme-accent-soft hover:text-theme-accent disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {typeof errors.services?.message === "string" && (
                <p className="mt-2 text-xs font-medium text-theme-accent">
                  {errors.services.message}
                </p>
              )}

              {/* Totals */}
              <div className="mt-4 space-y-2 border-t border-gray-200 pt-4 text-sm">
                <div className="flex items-center justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-gray-600">
                  <span>GST (18%)</span>
                  <span className="tabular-nums">{formatCurrency(gst)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-200 pt-2 text-base font-bold text-gray-900">
                  <span>Total INR</span>
                  <span className="tabular-nums">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Submit */}
          <div className="flex flex-col items-end gap-2">
            {createJob.isError && (
              <p className="text-sm font-medium text-theme-accent">
                {(createJob.error as Error)?.message ??
                  "Failed to create job card."}
              </p>
            )}
            <button
              type="submit"
              disabled={createJob.isPending}
              className="inline-flex items-center gap-2 rounded-md bg-theme-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-theme-accent-dark disabled:opacity-60"
            >
              <CheckCircle2 className="h-4 w-4" />
              {createJob.isPending ? "Finalizing..." : "Finalize Job Card"}
            </button>
          </div>
        </div>
      </div>
    </form>
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
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
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
    "w-full rounded-md border bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1",
    hasError
      ? "border-theme-accent focus:border-theme-accent focus:ring-theme-accent"
      : "border-gray-200 focus:border-theme-accent focus:ring-theme-accent",
  );
}
