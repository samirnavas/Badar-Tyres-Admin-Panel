"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { X, UserPlus } from "lucide-react";
import { createUser } from "@/lib/repositories/user_repository";
import { cn } from "@/lib/format";

const userSchema = z.object({
  name: z.string().min(1, "Name is required"),
  role: z.enum(["admin", "technician", "agent"]),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
});

type UserForm = z.infer<typeof userSchema>;

export function AddUserModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      role: "technician",
      email: "",
      phone: "",
    },
  });

  if (!open) return null;

  const onSubmit = async (values: UserForm) => {
    setIsSubmitting(true);
    try {
      await createUser({
        name: values.name,
        role: values.role as any,
        email: values.email || "",
        phone: values.phone || "",
      });
      reset();
      router.refresh();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to create user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div
        className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <UserPlus className="h-5 w-5 text-theme-accent" />
            Add Team Member
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Full Name *
              </label>
              <input
                {...register("name")}
                className={cn(
                  "w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1",
                  errors.name
                    ? "border-theme-accent focus:border-theme-accent focus:ring-theme-accent"
                    : "border-gray-200 focus:border-theme-accent focus:ring-theme-accent"
                )}
                placeholder="e.g. John Doe"
              />
              {errors.name && <p className="mt-1 text-xs text-theme-accent">{errors.name.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Role *
              </label>
              <select
                {...register("role")}
                className={cn(
                  "w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1",
                  errors.role
                    ? "border-theme-accent focus:border-theme-accent focus:ring-theme-accent"
                    : "border-gray-200 focus:border-theme-accent focus:ring-theme-accent"
                )}
              >
                <option value="technician">Technician</option>
                <option value="admin">Admin</option>
                <option value="agent">Agent</option>
              </select>
              {errors.role && <p className="mt-1 text-xs text-theme-accent">{errors.role.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  Email (Optional)
                </label>
                <input
                  {...register("email")}
                  className={cn(
                    "w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1",
                    errors.email
                      ? "border-theme-accent focus:border-theme-accent focus:ring-theme-accent"
                      : "border-gray-200 focus:border-theme-accent focus:ring-theme-accent"
                  )}
                  placeholder="john@example.com"
                />
                {errors.email && <p className="mt-1 text-xs text-theme-accent">{errors.email.message}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  Phone (Optional)
                </label>
                <input
                  {...register("phone")}
                  className={cn(
                    "w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1",
                    errors.phone
                      ? "border-theme-accent focus:border-theme-accent focus:ring-theme-accent"
                      : "border-gray-200 focus:border-theme-accent focus:ring-theme-accent"
                  )}
                  placeholder="+91..."
                />
                {errors.phone && <p className="mt-1 text-xs text-theme-accent">{errors.phone.message}</p>}
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-theme-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-theme-accent-dark disabled:opacity-50"
            >
              {isSubmitting ? "Adding..." : "Add Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
