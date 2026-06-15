"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Store,
  Receipt,
  UsersRound,
  Shield,
  Wrench,
  UserCog,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { getSettings, updateSettings, getUsers } from "@/lib/repositories";
import type { ShopSettings } from "@/lib/models/ShopSettings";
import type { UserRole } from "@/lib/models/User";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/format";
import { settingsSchema, type SettingsForm } from "./schema";

const sections = [
  { id: "general", label: "General Information", icon: Store },
  { id: "billing", label: "Billing & Taxes", icon: Receipt },
  { id: "team", label: "Team / Roles", icon: UsersRound },
] as const;

const roleStyles: Record<UserRole, { label: string; className: string; icon: typeof Shield }> = {
  admin: {
    label: "Admin",
    className: "border-theme-accent/30 bg-theme-accent-soft text-theme-accent",
    icon: Shield,
  },
  agent: {
    label: "Agent",
    className: "border-blue-200 bg-blue-50 text-blue-700",
    icon: UserCog,
  },
  technician: {
    label: "Technician",
    className: "border-gray-200 bg-gray-100 text-gray-600",
    icon: Wrench,
  },
};

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({
    queryKey: ["shop-settings"],
    queryFn: getSettings,
  });
  const usersQuery = useQuery({ queryKey: ["users"], queryFn: getUsers });
  const [activeSection, setActiveSection] = useState<string>("general");
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    values: settingsQuery.data,
  });

  const mutation = useMutation({
    mutationFn: (data: ShopSettings) => updateSettings(data),
    onSuccess: (saved) => {
      queryClient.setQueryData(["shop-settings"], saved);
      reset(saved);
      setSavedAt(Date.now());
    },
  });

  // Scrollspy: highlight the section nearest the top of the viewport.
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (settingsQuery.isLoading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 },
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [settingsQuery.isLoading]);

  const onSubmit = (values: SettingsForm) => {
    setSavedAt(null);
    mutation.mutate(values);
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (settingsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Settings
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your shop profile, billing defaults, and team.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr]">
        {/* Scrollspy nav */}
        <nav className="hidden lg:block">
          <div className="sticky top-6 space-y-1">
            {sections.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollTo(id)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors",
                  activeSection === id
                    ? "bg-theme-accent-soft text-theme-accent"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </nav>

        {/* Sections */}
        <div ref={containerRef} className="space-y-6">
          {/* General Information */}
          <Section
            id="general"
            icon={<Store className="h-4 w-4" />}
            title="General Information"
            description="Basic shop identity shown on invoices and job cards."
          >
            <Field label="Shop Name" error={errors.shop_name?.message}>
              <input
                {...register("shop_name")}
                className={inputClass(!!errors.shop_name)}
                placeholder="e.g. Badar Tyres & Auto Care"
              />
            </Field>
            <Field label="Shop Address" error={errors.shop_address?.message}>
              <textarea
                {...register("shop_address")}
                rows={2}
                className={cn(inputClass(!!errors.shop_address), "resize-none")}
                placeholder="Street, city, state, PIN"
              />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Contact Phone" error={errors.contact_phone?.message}>
                <input
                  {...register("contact_phone")}
                  className={inputClass(!!errors.contact_phone)}
                  placeholder="+91 ..."
                />
              </Field>
              <Field label="Contact Email" error={errors.contact_email?.message}>
                <input
                  {...register("contact_email")}
                  className={inputClass(!!errors.contact_email)}
                  placeholder="support@..."
                />
              </Field>
            </div>
          </Section>

          {/* Billing & Taxes */}
          <Section
            id="billing"
            icon={<Receipt className="h-4 w-4" />}
            title="Billing & Taxes"
            description="Defaults applied to new job cards and invoices."
          >
            <Field
              label="Default GST Rate (%)"
              error={errors.default_gst_rate?.message}
            >
              <div className="relative w-40">
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  max={100}
                  {...register("default_gst_rate", { valueAsNumber: true })}
                  className={cn(inputClass(!!errors.default_gst_rate), "pr-8")}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  %
                </span>
              </div>
            </Field>
            <Field
              label="Invoice Terms & Conditions"
              error={errors.terms_and_conditions?.message}
            >
              <textarea
                {...register("terms_and_conditions")}
                rows={5}
                className={cn(
                  inputClass(!!errors.terms_and_conditions),
                  "resize-y font-mono text-xs leading-relaxed",
                )}
                placeholder="These terms print at the bottom of every invoice."
              />
            </Field>
          </Section>

          {/* Team / Roles (mockup) */}
          <Section
            id="team"
            icon={<UsersRound className="h-4 w-4" />}
            title="Team / Roles"
            description="Current users and their access levels (read-only)."
          >
            {usersQuery.isLoading && <Skeleton className="h-32 w-full" />}
            {!usersQuery.isLoading && (
              <ul className="divide-y divide-gray-100">
                {(usersQuery.data ?? []).map((user) => {
                  const role = roleStyles[user.role];
                  const RoleIcon = role.icon;
                  return (
                    <li
                      key={user.id}
                      className="flex items-center justify-between gap-3 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                          {user.name
                            .split(" ")
                            .map((p) => p[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {user.name}
                          </p>
                          <p className="truncate text-xs text-gray-500">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                          role.className,
                        )}
                      >
                        <RoleIcon className="h-3 w-3" />
                        {role.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>
        </div>
      </div>

      {/* Fixed save bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/80 backdrop-blur-md lg:left-64">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <p className="text-sm text-gray-500">
            {mutation.isError ? (
              <span className="font-medium text-theme-accent">
                {(mutation.error as Error)?.message ?? "Failed to save."}
              </span>
            ) : savedAt ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600">
                <CheckCircle2 className="h-4 w-4" /> All changes saved
              </span>
            ) : isDirty ? (
              "You have unsaved changes."
            ) : (
              "Everything is up to date."
            )}
          </p>
          <button
            type="submit"
            disabled={!isDirty || mutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-theme-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-theme-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {mutation.isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </form>
  );
}

function Section({
  id,
  icon,
  title,
  description,
  children,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-6 rounded-xl border border-gray-200 bg-white"
    >
      <div className="border-b border-gray-100 px-5 py-4">
        <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
          <span className="text-gray-500">{icon}</span>
          {title}
        </h2>
        <p className="mt-0.5 text-sm text-gray-500">{description}</p>
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
      {error && (
        <p className="mt-1 text-xs font-medium text-theme-accent">{error}</p>
      )}
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
