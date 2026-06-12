"use client";

import { useUsers, useUpdateUserRole, useDeleteUser } from "@/lib/hooks";
import { Skeleton } from "@/components/ui/Skeleton";
import { Users as UsersIcon, Shield, Trash2, ShieldAlert } from "lucide-react";
import type { User } from "@/lib/types";
import { useState } from "react";
import { cn } from "@/lib/format";

export default function UsersPage() {
  const users = useUsers();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Users Management
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage system administrators and workshop technicians.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-theme-accent text-white">
            <UsersIcon className="h-5 w-5" strokeWidth={2.2} />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {users.isLoading &&
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}

        {users.isError && (
          <div className="rounded-md border border-theme-accent/30 bg-theme-accent-soft px-5 py-10 text-center text-sm font-medium text-theme-accent">
            {(users.error as Error)?.message ??
              "Failed to load users. Is the API running?"}
          </div>
        )}

        {!users.isLoading &&
          !users.isError &&
          (users.data ?? []).map((user) => (
            <UserCard key={user.id} user={user} />
          ))}

        {!users.isLoading &&
          !users.isError &&
          (users.data ?? []).length === 0 && (
            <div className="rounded-md border border-gray-200 bg-white px-5 py-12 text-center text-sm text-gray-500">
              No users registered.
            </div>
          )}
      </div>
    </div>
  );
}

function UserCard({ user }: { user: User }) {
  const updateRoleMutation = useUpdateUserRole();
  const deleteMutation = useDeleteUser();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value;
    if (newRole !== user.role) {
      updateRoleMutation.mutate({ id: user.id, role: newRole });
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${user.name}?`)) {
      setIsDeleting(true);
      deleteMutation.mutate(user.id, {
        onError: () => setIsDeleting(false),
      });
    }
  };

  const isAdmin = user.role === "admin";

  return (
    <div className="grid grid-cols-1 items-center gap-4 rounded-md border border-gray-200 bg-white p-5 transition-shadow hover:shadow-sm md:grid-cols-[1fr_auto_auto]">
      <div>
        <div className="flex items-center gap-2">
          <p className="text-base font-semibold text-gray-900">{user.name}</p>
          {isAdmin && <Shield className="h-4 w-4 text-theme-accent" />}
        </div>
        <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
          <span className="font-medium text-gray-500">@{user.username}</span>
          <span>&bull;</span>
          <span className="text-xs uppercase tracking-wide text-gray-500">
            ID: {user.id}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label htmlFor={`role-${user.id}`} className="sr-only">
          Role
        </label>
        <select
          id={`role-${user.id}`}
          value={user.role}
          onChange={handleRoleChange}
          disabled={updateRoleMutation.isPending || isDeleting}
          className={cn(
            "rounded-md border border-gray-300 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-900 transition-colors focus:border-theme-accent focus:outline-none focus:ring-1 focus:ring-theme-accent",
            updateRoleMutation.isPending && "opacity-50",
          )}
        >
          <option value="admin">Admin</option>
          <option value="technician">Technician</option>
        </select>
      </div>

      <div className="flex items-center">
        <button
          onClick={handleDelete}
          disabled={isDeleting || deleteMutation.isPending}
          className="group flex h-9 w-9 items-center justify-center rounded-md border border-transparent text-gray-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          title="Delete User"
        >
          {isDeleting || deleteMutation.isPending ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
          ) : (
            <Trash2 className="h-4 w-4 transition-transform group-hover:scale-110" />
          )}
        </button>
      </div>
    </div>
  );
}
