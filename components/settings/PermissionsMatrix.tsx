"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2 } from "lucide-react";
import {
  getPermissions,
  updatePermissions,
} from "@/lib/repositories/permission_repository";
import { EDITABLE_ROLES, PERMISSION_MODULES } from "@/lib/permissions";
import { useAuth } from "@/lib/AuthContext";
import { cn } from "@/lib/format";

export const permissionsQueryKey = ["permissions"] as const;

export function PermissionsMatrix() {
  const queryClient = useQueryClient();
  const { refreshPermissions } = useAuth();
  const [draft, setDraft] = useState<Record<string, string[]>>({});
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const permissionsQuery = useQuery({
    queryKey: permissionsQueryKey,
    queryFn: getPermissions,
  });

  useEffect(() => {
    if (permissionsQuery.data) {
      setDraft(permissionsQuery.data);
      setSavedAt(null);
    }
  }, [permissionsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: updatePermissions,
    onSuccess: async (data) => {
      setDraft(data);
      setSavedAt(Date.now());
      await queryClient.invalidateQueries({ queryKey: permissionsQueryKey });
      await refreshPermissions();
    },
  });

  const isDirty =
    permissionsQuery.data &&
    JSON.stringify(draft) !== JSON.stringify(permissionsQuery.data);

  const togglePermission = (role: string, route: string) => {
    setDraft((prev) => {
      const current = prev[role] ?? [];
      const hasRoute = current.includes(route);
      const nextRoutes = hasRoute
        ? current.filter((r) => r !== route)
        : [...current, route].sort();

      return { ...prev, [role]: nextRoutes };
    });
    setSavedAt(null);
  };

  if (permissionsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (permissionsQuery.isError) {
    return (
      <p className="text-sm text-red-600">
        Failed to load permissions. Please refresh the page.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          Toggle module access for each role. Admin always has full access.
        </p>
        <div className="flex items-center gap-3">
          {savedAt && !isDirty && (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
              <CheckCircle2 className="h-4 w-4" /> Permissions saved
            </span>
          )}
          <button
            type="button"
            onClick={() => saveMutation.mutate(draft)}
            disabled={!isDirty || saveMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-theme-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-theme-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {saveMutation.isPending ? "Saving..." : "Save Permissions"}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
              >
                Role
              </th>
              {PERMISSION_MODULES.map((module) => (
                <th
                  key={module.route}
                  scope="col"
                  className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500"
                >
                  {module.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {EDITABLE_ROLES.map((role) => (
              <tr key={role} className="hover:bg-gray-50/50">
                <th
                  scope="row"
                  className="sticky left-0 z-10 whitespace-nowrap bg-white px-4 py-3 text-left font-semibold text-gray-900"
                >
                  {role}
                </th>
                {PERMISSION_MODULES.map((module) => {
                  const checked = (draft[role] ?? []).includes(module.route);
                  return (
                    <td key={module.route} className="px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => togglePermission(role, module.route)}
                        className={cn(
                          "h-4 w-4 rounded border-gray-300 text-theme-accent",
                          "focus:ring-theme-accent",
                        )}
                        aria-label={`${role} — ${module.label}`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
