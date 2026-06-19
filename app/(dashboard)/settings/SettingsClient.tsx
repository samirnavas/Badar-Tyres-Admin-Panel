"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import {
  Store,
  Receipt,
  UsersRound,
  Shield,
  Wrench,
  UserCog,
  Loader2,
  CheckCircle2,
  CarFront,
  Trash2,
  Plus,
  X,
  KeyRound,
} from "lucide-react";
import { updateSettings } from "@/lib/repositories/settings_repository";
import { createManufacturer, deleteManufacturer } from "@/lib/repositories/manufacturer_repository";
import { deleteUser } from "@/lib/repositories/user_repository";
import type { ShopSettings } from "@/lib/models/ShopSettings";
import type { UserRole, User } from "@/lib/models/User";
import type { Manufacturer } from "@/lib/models/Manufacturer";
import { cn } from "@/lib/format";
import { settingsSchema, type SettingsForm } from "./schema";
import { AddUserModal } from "./AddUserModal";
import { PermissionsMatrix } from "@/components/settings/PermissionsMatrix";

const allSections = [
  { id: "general", label: "General Information", icon: Store },
  { id: "billing", label: "Billing & Taxes", icon: Receipt },
  { id: "manufacturers", label: "Manage Vehicle Manufacturers", icon: CarFront },
  { id: "team", label: "Team Management", icon: UsersRound, adminOnly: true },
  { id: "permissions", label: "Role Permissions", icon: KeyRound, adminOnly: true },
] as const;

const roleStyles: Record<UserRole, { label: string; className: string; icon: typeof Shield }> = {
  Admin: {
    label: "Admin",
    className: "border-theme-accent/30 bg-theme-accent-soft text-theme-accent",
    icon: Shield,
  },
  Manager: {
    label: "Manager",
    className: "border-purple-200 bg-purple-50 text-purple-700",
    icon: UserCog,
  },
  Supervisor: {
    label: "Supervisor",
    className: "border-indigo-200 bg-indigo-50 text-indigo-700",
    icon: UserCog,
  },
  "Team Lead": {
    label: "Team Lead",
    className: "border-amber-200 bg-amber-50 text-amber-700",
    icon: UserCog,
  },
  Technician: {
    label: "Technician",
    className: "border-gray-200 bg-gray-100 text-gray-600",
    icon: Wrench,
  },
  Sales: {
    label: "Sales",
    className: "border-blue-200 bg-blue-50 text-blue-700",
    icon: UserCog,
  },
};

export default function SettingsClient({
  initialSettings,
  initialUsers,
  initialManufacturers,
}: {
  initialSettings: ShopSettings;
  initialUsers: User[];
  initialManufacturers: Manufacturer[];
}) {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === "Admin";
  const sections = allSections.filter(
    (s) => !("adminOnly" in s && s.adminOnly) || isAdmin,
  );
  const [activeSection, setActiveSection] = useState<string>("general");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Manufacturers state
  const [newManufacturerName, setNewManufacturerName] = useState("");
  const [isAddingManufacturer, setIsAddingManufacturer] = useState(false);

  // Users state
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: initialSettings,
  });

  const onSubmitSettings = async (values: SettingsForm) => {
    setIsSaving(true);
    setSavedAt(null);
    try {
      await updateSettings(values as ShopSettings);
      setSavedAt(Date.now());
      reset(values);
      router.refresh();
    } catch (e) {
      console.error(e);
      alert("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddManufacturer = async () => {
    if (!newManufacturerName.trim()) return;
    setIsAddingManufacturer(true);
    try {
      await createManufacturer(newManufacturerName.trim());
      setNewManufacturerName("");
      router.refresh();
    } catch (e) {
      console.error(e);
      alert("Failed to add manufacturer");
    } finally {
      setIsAddingManufacturer(false);
    }
  };

  const handleDeleteManufacturer = async (id: string) => {
    if (!confirm("Are you sure you want to delete this manufacturer?")) return;
    try {
      await deleteManufacturer(id);
      router.refresh();
    } catch (e) {
      console.error(e);
      alert("Failed to delete manufacturer");
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!currentUser) return;
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteUser(id, currentUser.id);
      router.refresh();
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Failed to delete user");
    }
  };

  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
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
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmitSettings)} className="pb-24">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Settings
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your shop profile, billing defaults, and team.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr]">
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

          <div ref={containerRef} className="space-y-6">
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
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
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

            {/* Manufacturers */}
            <Section
              id="manufacturers"
              icon={<CarFront className="h-4 w-4" />}
              title="Manage Vehicle Manufacturers"
              description="Manage the list of vehicle manufacturers available when adding new vehicles."
            >
              <div className="flex flex-wrap gap-3">
                {initialManufacturers.map((m) => (
                  <div key={m.id} className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-700">
                    {m.name}
                    <button
                      type="button"
                      onClick={() => handleDeleteManufacturer(m.id)}
                      className="ml-1 rounded-full p-0.5 text-gray-400 hover:bg-gray-200 hover:text-red-600 focus:outline-none"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {initialManufacturers.length === 0 && (
                  <span className="text-sm text-gray-500">No manufacturers found.</span>
                )}
              </div>
              <div className="mt-4 flex items-center gap-3">
                <input
                  type="text"
                  value={newManufacturerName}
                  onChange={(e) => setNewManufacturerName(e.target.value)}
                  placeholder="New manufacturer name..."
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddManufacturer();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddManufacturer}
                  disabled={!newManufacturerName.trim() || isAddingManufacturer}
                  className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" /> Add
                </button>
              </div>
            </Section>

            {/* Team — Admin only */}
            {isAdmin && (
              <Section
                id="team"
                icon={<UsersRound className="h-4 w-4" />}
                title="Team Management"
                description="Manage your team members and their roles."
                action={
                  <button
                    type="button"
                    onClick={() => setIsAddUserOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
                  >
                    <Plus className="h-4 w-4" /> Add Team Member
                  </button>
                }
              >
                <ul className="divide-y divide-gray-100">
                  {initialUsers.map((user) => {
                    const role = roleStyles[user.role] || roleStyles.Technician;
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
                              {user.email || user.phone || "No contact info"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span
                            className={cn(
                              "inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                              role.className,
                            )}
                          >
                            <RoleIcon className="h-3 w-3" />
                            {role.label}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(user.id)}
                            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </Section>
            )}

            {isAdmin && (
              <Section
                id="permissions"
                icon={<KeyRound className="h-4 w-4" />}
                title="Role Permissions"
                description="Control which modules each role can access across the application."
              >
                <PermissionsMatrix />
              </Section>
            )}
          </div>
        </div>

        {/* Fixed save bar */}
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/80 backdrop-blur-md lg:left-64">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <p className="text-sm text-gray-500">
              {savedAt ? (
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
              disabled={!isDirty || isSaving}
              className="inline-flex items-center gap-2 rounded-lg bg-theme-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-theme-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </form>

      {isAdmin && (
        <AddUserModal
          open={isAddUserOpen}
          onClose={() => setIsAddUserOpen(false)}
        />
      )}
    </>
  );
}

function Section({
  id,
  icon,
  title,
  description,
  action,
  children,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-6 rounded-xl border border-gray-200 bg-white"
    >
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <span className="text-gray-500">{icon}</span>
            {title}
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">{description}</p>
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
