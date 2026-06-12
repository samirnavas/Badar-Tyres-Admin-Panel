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

      <div className="space-y-0">
        {users.isError && (
          <div className="rounded-md border border-theme-accent/30 bg-theme-accent-soft px-5 py-10 text-center text-sm font-medium text-theme-accent mb-4">
            {(users.error as Error)?.message ??
              "Failed to load users. Is the API running?"}
          </div>
        )}

        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto rounded-md border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Username</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3 w-16 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.isLoading &&
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={4} className="px-5 py-4">
                      <Skeleton className="h-10 w-full" />
                    </td>
                  </tr>
                ))}
              {!users.isLoading &&
                !users.isError &&
                (users.data ?? []).map((user) => (
                  <UserTableRow key={user.id} user={user} />
                ))}
              {!users.isLoading &&
                !users.isError &&
                (users.data ?? []).length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center text-sm text-gray-500">
                      No users registered.
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="block lg:hidden divide-y divide-gray-100 rounded-md border border-gray-200 bg-white">
          {users.isLoading &&
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4">
                <Skeleton className="h-24 w-full" />
              </div>
            ))}
          {!users.isLoading &&
            !users.isError &&
            (users.data ?? []).map((user) => (
              <UserCardMobile key={user.id} user={user} />
            ))}
          {!users.isLoading &&
            !users.isError &&
            (users.data ?? []).length === 0 && (
              <div className="px-5 py-12 text-center text-sm text-gray-500">
                No users registered.
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

function UserTableRow({ user }: { user: User }) {
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
    <tr className="transition-colors hover:bg-gray-50">
      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-gray-900">{user.name}</p>
          {isAdmin && <Shield className="h-4 w-4 text-theme-accent" />}
        </div>
        <div className="text-xs text-gray-500 mt-0.5 uppercase tracking-wide">ID: {user.id}</div>
      </td>
      <td className="px-5 py-4 text-gray-600 font-medium">@{user.username}</td>
      <td className="px-5 py-4">
        <select
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
      </td>
      <td className="px-5 py-4 text-right">
        <button
          onClick={handleDelete}
          disabled={isDeleting || deleteMutation.isPending}
          className="group inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-gray-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          title="Delete User"
        >
          {isDeleting || deleteMutation.isPending ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
          ) : (
            <Trash2 className="h-4 w-4 transition-transform group-hover:scale-110" />
          )}
        </button>
      </td>
    </tr>
  );
}

function UserCardMobile({ user }: { user: User }) {
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
    <div className="p-4 bg-white">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-900">{user.name}</p>
            {isAdmin && <Shield className="h-4 w-4 text-theme-accent" />}
          </div>
          <p className="text-sm font-medium text-gray-600 mt-0.5">@{user.username}</p>
          <p className="text-xs uppercase tracking-wide text-gray-500 mt-1">ID: {user.id}</p>
        </div>
        <button
          onClick={handleDelete}
          disabled={isDeleting || deleteMutation.isPending}
          className="group inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-gray-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          title="Delete User"
        >
          {isDeleting || deleteMutation.isPending ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
          ) : (
            <Trash2 className="h-4 w-4 transition-transform group-hover:scale-110" />
          )}
        </button>
      </div>
      <div className="mt-4">
        <select
          value={user.role}
          onChange={handleRoleChange}
          disabled={updateRoleMutation.isPending || isDeleting}
          className={cn(
            "w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-900 transition-colors focus:border-theme-accent focus:outline-none focus:ring-1 focus:ring-theme-accent",
            updateRoleMutation.isPending && "opacity-50",
          )}
        >
          <option value="admin">Admin</option>
          <option value="technician">Technician</option>
        </select>
      </div>
    </div>
  );
}
