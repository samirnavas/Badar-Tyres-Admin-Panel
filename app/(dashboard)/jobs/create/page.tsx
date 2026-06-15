"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
  useForm,
  useFieldArray,
  useWatch,
  Controller,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  User as UserIcon,
  Wrench,
  ClipboardCheck,
  Plus,
  Trash2,
  CheckCircle2,
  CarFront,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  getCustomers,
  getVehiclesByCustomerId,
  getServices,
  getTechnicians,
  createJobCard,
  createVehicle,
} from "@/lib/repositories";
import type { VehicleType } from "@/lib/models/Vehicle";
import { useManufacturers } from "@/lib/hooks";
import { useAuth } from "@/lib/AuthContext";
import { cn, formatCurrency } from "@/lib/format";
import { createJobCardSchema, type CreateJobCardForm } from "./schema";
import { Combobox, type ComboboxOption } from "@/components/ui/Combobox";
import { CustomerFormModal } from "@/components/customers/CustomerFormModal";

const VEHICLE_TYPES = ["Car", "Bike", "Others"] as const;

export default function CreateJobPage() {
  return (
    <Suspense fallback={null}>
      <CreateJobForm />
    </Suspense>
  );
}

function CreateJobForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  // Pre-fill the customer when arriving from a CRM "Create New Job" action.
  const presetCustomerId = searchParams.get("customer") ?? "";

  const customersQuery = useQuery({
    queryKey: ["customers"],
    queryFn: getCustomers,
  });
  const servicesQuery = useQuery({
    queryKey: ["service-catalog"],
    queryFn: getServices,
  });
  const techniciansQuery = useQuery({
    queryKey: ["technician-users"],
    queryFn: getTechnicians,
  });
  const manufacturers = useManufacturers();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateJobCardForm>({
    resolver: zodResolver(createJobCardSchema),
    defaultValues: {
      customer_id: presetCustomerId,
      is_new_vehicle: false,
      vehicle_id: "",
      vehicleType: "",
      manufacturer: "",
      model: "",
      registration_number: "",
      assigned_technician_id: "",
      warranty_end_date: "",
      warranty_notes: "",
      services: [{ service_id: "", name: "", qty: 1, rate: 0, gst_rate: 18 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "services",
  });

  const customerId = useWatch({ control, name: "customer_id" });
  const vehicleType = useWatch({ control, name: "vehicleType" });
  const isAddingNewVehicle = useWatch({ control, name: "is_new_vehicle" });
  const watchedServices = useWatch({ control, name: "services" }) ?? [];

  // Holds the search term for the inline "quick add customer" modal; null when closed.
  const [quickAddName, setQuickAddName] = useState<string | null>(null);

  // Relational lookup: only fetch vehicles once a customer is chosen.
  const vehiclesQuery = useQuery({
    queryKey: ["vehicles-by-customer", customerId],
    queryFn: () => getVehiclesByCustomerId(customerId),
    enabled: !!customerId,
  });

  const hasExistingVehicles = (vehiclesQuery.data ?? []).length > 0;

  // Zero-vehicle override: when the selected customer has no vehicles on file,
  // there is nothing to select — force the manual entry view.
  useEffect(() => {
    if (!customerId || vehiclesQuery.isLoading || vehiclesQuery.isFetching)
      return;
    if (!hasExistingVehicles) {
      setValue("is_new_vehicle", true);
    }
  }, [
    customerId,
    hasExistingVehicles,
    vehiclesQuery.isLoading,
    vehiclesQuery.isFetching,
    setValue,
  ]);

  const createMutation = useMutation({
    mutationFn: async (input: {
      values: CreateJobCardForm;
      createdBy: string;
    }) => {
      const { values, createdBy } = input;

      // Inline vehicle creation: persist the new Vehicle first, then attach
      // its generated id to the job card.
      let vehicleId = values.vehicle_id ?? "";
      if (values.is_new_vehicle) {
        const newVehicle = await createVehicle({
          customer_id: values.customer_id,
          type: (values.vehicleType as VehicleType) ?? "Car",
          manufacturer: values.manufacturer ?? "",
          model: values.model ?? "",
          registration_number: values.registration_number ?? "",
          next_service_date: null,
        });
        vehicleId = newVehicle.id;
      }

      return createJobCard({
        customer_id: values.customer_id,
        vehicle_id: vehicleId,
        assigned_technician_id: values.assigned_technician_id,
        status: "In Progress",
        service_item_ids: values.services.map((s) => s.service_id),
        subtotal: totals.subtotal,
        total_tax: totals.tax,
        total_amount: grandTotal,
        warranty_end_date: values.warranty_end_date || null,
        warranty_notes: values.warranty_notes || null,
        created_by: createdBy,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["job-cards"] });
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["vehicles-by-customer"] });
      router.refresh();
    },
  });

  const customerOptions: ComboboxOption[] = useMemo(
    () =>
      (customersQuery.data ?? []).map((c) => ({
        value: c.id,
        label: c.name,
        hint: c.phone,
      })),
    [customersQuery.data],
  );

  const vehicleOptions: ComboboxOption[] = useMemo(
    () =>
      (vehiclesQuery.data ?? []).map((v) => ({
        value: v.id,
        label: `${v.manufacturer} ${v.model}`,
        hint: v.registration_number,
      })),
    [vehiclesQuery.data],
  );

  const manufacturerOptions: ComboboxOption[] = useMemo(() => {
    const list = vehicleType ? manufacturers.data?.[vehicleType] ?? [] : [];
    return list.map((m) => ({ value: m, label: m }));
  }, [manufacturers.data, vehicleType]);

  const serviceOptions: ComboboxOption[] = useMemo(
    () =>
      (servicesQuery.data ?? []).map((s) => ({
        value: s.id,
        label: s.name,
        hint: `₹${formatCurrency(s.price)}`,
      })),
    [servicesQuery.data],
  );

  const technicianOptions: ComboboxOption[] = useMemo(
    () =>
      (techniciansQuery.data ?? []).map((t) => ({
        value: t.id,
        label: t.name,
      })),
    [techniciansQuery.data],
  );

  const totals = watchedServices.reduce(
    (acc, s) => {
      const qty = Number(s?.qty) || 0;
      const rate = Number(s?.rate) || 0;
      const gstRate = Number(s?.gst_rate) || 0;
      const amount = qty * rate;
      acc.subtotal += amount;
      acc.tax += (amount * gstRate) / 100;
      return acc;
    },
    { subtotal: 0, tax: 0 },
  );
  const grandTotal = totals.subtotal + totals.tax;

  // Cascading reset: a new customer invalidates the vehicle and every
  // field derived from it. Default back to "select" mode; the zero-vehicle
  // effect flips to manual entry if the customer has nothing on file.
  const handleCustomerChange = (value: string) => {
    setValue("customer_id", value, { shouldValidate: true });
    setValue("is_new_vehicle", false);
    setValue("vehicle_id", "");
    setValue("vehicleType", "");
    setValue("manufacturer", "");
    setValue("model", "");
    setValue("registration_number", "");
  };

  // Switch into manual vehicle entry, clearing any prior selection.
  const enterNewVehicleMode = () => {
    setValue("is_new_vehicle", true);
    setValue("vehicle_id", "");
    setValue("vehicleType", "");
    setValue("manufacturer", "");
    setValue("model", "");
    setValue("registration_number", "");
  };

  // Switch back to selecting an existing vehicle, clearing manual fields.
  const exitNewVehicleMode = () => {
    setValue("is_new_vehicle", false);
    setValue("vehicle_id", "");
    setValue("vehicleType", "");
    setValue("manufacturer", "");
    setValue("model", "");
    setValue("registration_number", "");
  };

  // Selecting a vehicle hydrates the dependent vehicle-detail fields.
  const handleVehicleChange = (value: string) => {
    setValue("vehicle_id", value, { shouldValidate: true });
    const vehicle = (vehiclesQuery.data ?? []).find((v) => v.id === value);
    if (vehicle) {
      setValue("vehicleType", vehicle.type, { shouldValidate: true });
      setValue("manufacturer", vehicle.manufacturer, { shouldValidate: true });
      setValue("model", vehicle.model, { shouldValidate: true });
      setValue("registration_number", vehicle.registration_number, {
        shouldValidate: true,
      });
    }
  };

  // Cascading reset: changing the vehicle type clears type-specific fields.
  const handleVehicleTypeChange = (value: string) => {
    setValue("vehicleType", value, { shouldValidate: true });
    setValue("manufacturer", "");
    setValue("model", "");
  };

  const handleServiceChange = (index: number, serviceId: string) => {
    setValue(`services.${index}.service_id`, serviceId, {
      shouldValidate: true,
    });
    const service = (servicesQuery.data ?? []).find((s) => s.id === serviceId);
    if (service) {
      setValue(`services.${index}.name`, service.name);
      setValue(`services.${index}.rate`, service.price);
      setValue(`services.${index}.gst_rate`, service.gst_rate);
    }
  };

  const onSubmit = (values: CreateJobCardForm) => {
    // Security: the acting user's id MUST accompany the payload for the
    // audit trail. Refuse to build a job card without it.
    if (!user?.id) {
      createMutation.reset();
      window.alert(
        "Your session is missing a verified user. Please sign in again before creating a job card.",
      );
      return;
    }

    createMutation.mutate(
      { values, createdBy: user.id },
      { onSuccess: () => router.push("/jobs") },
    );
  };

  return (
   <>
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Create New Job Card
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Select a customer and vehicle, then assign services to a
            technician.
          </p>
        </div>
      </div>

      {/* Forced light-grey container card — stays light even in dark mode. */}
      <div
        style={{ backgroundColor: "#eceef1", colorScheme: "light" }}
        className="rounded-2xl border border-gray-200/70 p-5 shadow-sm sm:p-6"
      >
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Left column */}
          <div className="space-y-5">
            {/* Customer */}
            <Section icon={<UserIcon className="h-4 w-4" />} title="Customer">
              <Field label="Customer" error={errors.customer_id?.message}>
                <Controller
                  control={control}
                  name="customer_id"
                  render={({ field }) => (
                    <Combobox
                      options={customerOptions}
                      value={field.value}
                      onChange={handleCustomerChange}
                      placeholder={
                        customersQuery.isLoading
                          ? "Loading customers..."
                          : "Search customer..."
                      }
                      disabled={customersQuery.isLoading}
                      className={inputClass(!!errors.customer_id)}
                      emptyMessage="No customers found"
                      onCreateNew={(term) => setQuickAddName(term)}
                      createNewLabel={(term) => `Add "${term}" as new customer`}
                    />
                  )}
                />
              </Field>
            </Section>

            {/* Vehicle */}
            <Section
              icon={<CarFront className="h-4 w-4" />}
              title="Vehicle Details"
            >
              {!isAddingNewVehicle ? (
                <>
                  <Field label="Vehicle" error={errors.vehicle_id?.message}>
                    <Controller
                      control={control}
                      name="vehicle_id"
                      render={({ field }) => (
                        <Combobox
                          options={vehicleOptions}
                          value={field.value ?? ""}
                          onChange={handleVehicleChange}
                          placeholder={
                            !customerId
                              ? "Select a customer first"
                              : vehiclesQuery.isLoading
                                ? "Loading vehicles..."
                                : "Search vehicle..."
                          }
                          disabled={!customerId || vehiclesQuery.isLoading}
                          className={inputClass(!!errors.vehicle_id)}
                          emptyMessage="No vehicles for this customer"
                        />
                      )}
                    />
                  </Field>

                  {customerId && (
                    <button
                      type="button"
                      onClick={enterNewVehicleMode}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-theme-accent transition-colors hover:text-theme-accent-dark"
                    >
                      <Plus className="h-4 w-4" /> Add a different vehicle
                    </button>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-gray-500">
                      {hasExistingVehicles
                        ? "Entering a new vehicle for this customer."
                        : "No vehicles on file — add the customer's first vehicle."}
                    </p>
                    {hasExistingVehicles && (
                      <button
                        type="button"
                        onClick={exitNewVehicleMode}
                        className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
                      >
                        <X className="h-4 w-4" /> Cancel
                      </button>
                    )}
                  </div>

                  <Field
                    label="Vehicle Type"
                    error={errors.vehicleType?.message}
                  >
                    <div className="flex gap-2">
                      {VEHICLE_TYPES.map((type) => {
                        const active = vehicleType === type;
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => handleVehicleTypeChange(type)}
                            className={cn(
                              "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                              active
                                ? "border-theme-accent bg-theme-accent text-white"
                                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300",
                            )}
                          >
                            {type}
                          </button>
                        );
                      })}
                    </div>
                  </Field>

                  <Field
                    label="Manufacturer"
                    error={errors.manufacturer?.message}
                  >
                    <Controller
                      control={control}
                      name="manufacturer"
                      render={({ field }) => (
                        <Combobox
                          options={manufacturerOptions}
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          placeholder={
                            !vehicleType
                              ? "Select a vehicle type first"
                              : "Select manufacturer..."
                          }
                          disabled={!vehicleType || manufacturers.isLoading}
                          className={inputClass(!!errors.manufacturer)}
                          emptyMessage="No manufacturers"
                        />
                      )}
                    />
                  </Field>

                  <Field label="Model" error={errors.model?.message}>
                    <input
                      {...register("model")}
                      placeholder="e.g. Innova Crysta"
                      className={inputClass(!!errors.model)}
                    />
                  </Field>

                  <Field
                    label="Registration Number"
                    error={errors.registration_number?.message}
                  >
                    <input
                      {...register("registration_number", {
                        onChange: (e) => {
                          e.target.value = e.target.value.toUpperCase();
                        },
                      })}
                      placeholder="E.G. KL-07-AB-1234"
                      className={cn(
                        inputClass(!!errors.registration_number),
                        "uppercase",
                      )}
                    />
                  </Field>
                </>
              )}
            </Section>

            {/* Assignment */}
            <Section
              icon={<ClipboardCheck className="h-4 w-4" />}
              title="Assignment"
            >
              <Field
                label="Lead Technician"
                error={errors.assigned_technician_id?.message}
              >
                <Controller
                  control={control}
                  name="assigned_technician_id"
                  render={({ field }) => (
                    <Combobox
                      options={technicianOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={
                        techniciansQuery.isLoading
                          ? "Loading technicians..."
                          : "Select technician..."
                      }
                      disabled={techniciansQuery.isLoading}
                      className={inputClass(!!errors.assigned_technician_id)}
                      emptyMessage="No technicians"
                    />
                  )}
                />
              </Field>
            </Section>

            {/* Warranty */}
            <Section
              icon={<ShieldCheck className="h-4 w-4" />}
              title="Warranty (optional)"
            >
              <Field label="Warranty End Date">
                <input
                  type="date"
                  {...register("warranty_end_date")}
                  className={inputClass(false)}
                />
              </Field>
              <Field label="Warranty Notes">
                <textarea
                  {...register("warranty_notes")}
                  rows={2}
                  placeholder="e.g. 6 months on wheel alignment"
                  className={cn(inputClass(false), "resize-none")}
                />
              </Field>
            </Section>
          </div>

          {/* Right column - Service Items */}
          <div className="space-y-5">
            <Section
              icon={<Wrench className="h-4 w-4" />}
              title="Service Items"
              action={
                <button
                  type="button"
                  onClick={() =>
                    append({
                      service_id: "",
                      name: "",
                      qty: 1,
                      rate: 0,
                      gst_rate: 18,
                    })
                  }
                  className="inline-flex items-center gap-1 text-sm font-semibold text-theme-accent transition-colors hover:text-theme-accent-dark"
                >
                  <Plus className="h-4 w-4" /> Add Item
                </button>
              }
            >
              <div className="w-full">
                <div className="hidden md:grid md:grid-cols-[1fr_64px_96px_104px_32px] items-center gap-2 border-b border-gray-200 pb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  <span>Service / Part</span>
                  <span className="text-center">Qty</span>
                  <span className="text-center">Rate</span>
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
                        className="flex flex-col gap-4 py-4 md:grid md:grid-cols-[1fr_64px_96px_104px_32px] md:items-center md:gap-2 md:py-3"
                      >
                        <div className="w-full">
                          <span className="mb-1.5 block text-[10px] font-semibold uppercase text-gray-400 md:hidden">
                            Service / Part
                          </span>
                          <Controller
                            control={control}
                            name={`services.${index}.service_id` as const}
                            render={({ field: serviceField }) => (
                              <Combobox
                                options={serviceOptions}
                                value={serviceField.value}
                                onChange={(val) =>
                                  handleServiceChange(index, val)
                                }
                                placeholder={
                                  servicesQuery.isLoading
                                    ? "Loading..."
                                    : "Select service..."
                                }
                                disabled={servicesQuery.isLoading}
                                className={inputClass(!!rowError?.service_id)}
                                emptyMessage="No services"
                              />
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3 md:contents">
                          <div>
                            <span className="mb-1.5 block text-[10px] font-semibold uppercase text-gray-400 md:hidden">
                              Qty
                            </span>
                            <input
                              type="number"
                              min={1}
                              {...register(`services.${index}.qty` as const, {
                                valueAsNumber: true,
                              })}
                              className={cn(
                                inputClass(!!rowError?.qty),
                                "text-center",
                              )}
                            />
                          </div>
                          <div>
                            <span className="mb-1.5 block text-[10px] font-semibold uppercase text-gray-400 md:hidden">
                              Rate
                            </span>
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              {...register(`services.${index}.rate` as const, {
                                valueAsNumber: true,
                              })}
                              onFocus={(e) => e.target.select()}
                              className={cn(
                                inputClass(!!rowError?.rate),
                                "text-center",
                              )}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-gray-100 pt-3 md:contents md:border-0 md:pt-0">
                          <div className="flex items-center gap-2 md:contents">
                            <span className="text-[10px] font-semibold uppercase text-gray-400 md:hidden">
                              Amount:
                            </span>
                            <span className="text-sm font-semibold text-gray-900 tabular-nums md:text-right md:font-medium">
                              {formatCurrency(amount)}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            disabled={fields.length === 1}
                            className="flex items-center justify-center rounded-md p-1.5 text-gray-400 transition-colors hover:bg-theme-accent-soft hover:text-theme-accent disabled:cursor-not-allowed disabled:opacity-40 md:ml-auto"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {typeof errors.services?.message === "string" && (
                <p className="mt-2 text-xs font-medium text-theme-accent">
                  {errors.services.message}
                </p>
              )}

              <div className="mt-4 space-y-2 border-t border-gray-200 pt-4 text-sm">
                <div className="flex items-center justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span className="tabular-nums">
                    {formatCurrency(totals.subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-500">
                  <span>GST</span>
                  <span className="tabular-nums">
                    {formatCurrency(totals.tax)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-200 pt-2 text-base font-bold text-gray-900">
                  <span>Total INR</span>
                  <span className="tabular-nums">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
              </div>
            </Section>

            {/* Submit */}
            <div className="flex flex-col items-end gap-2">
              {createMutation.isError && (
                <p className="text-sm font-medium text-theme-accent">
                  {(createMutation.error as Error)?.message ??
                    "Failed to create job card."}
                </p>
              )}
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-theme-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-theme-accent-dark disabled:opacity-60"
              >
                <CheckCircle2 className="h-4 w-4" />
                {createMutation.isPending ? "Finalizing..." : "Finalize Job Card"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>

    {/* Inline quick-add: create a customer without leaving the job form.
        Rendered as a sibling (not a child) of the form so its submit event
        never bubbles into the job form's onSubmit via the React tree. */}
    <CustomerFormModal
      open={quickAddName !== null}
      initialName={quickAddName ?? ""}
      onClose={() => setQuickAddName(null)}
      onSuccess={(newId) => {
        setQuickAddName(null);
        setValue('customer_id', newId, { shouldValidate: true });
        // Also trigger the cascading reset so vehicle fields start fresh for the new customer.
        handleCustomerChange(newId);
      }}
    />
  </>
  );
}

function Section({
  icon,
  title,
  action,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
        <div className="flex items-center gap-2 text-gray-900">
          <span className="text-gray-500">{icon}</span>
          <h2 className="text-sm font-semibold">{title}</h2>
        </div>
        {action}
      </div>
      <div className="space-y-4 p-5">{children}</div>
    </section>
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
      {error && <p className="mt-1 text-xs font-medium text-theme-accent">{error}</p>}
    </div>
  );
}

function inputClass(hasError: boolean): string {
  return cn(
    "w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1",
    hasError
      ? "border-theme-accent focus:border-theme-accent focus:ring-theme-accent"
      : "border-gray-200 focus:border-theme-accent focus:ring-theme-accent",
  );
}
