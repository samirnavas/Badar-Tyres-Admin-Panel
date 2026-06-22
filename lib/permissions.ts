import type { UserRole } from "./models/User";

export const PERMISSION_MODULES = [
  { label: "Dashboard", route: "/dashboard" },
  { label: "Jobs", route: "/jobs" },
  { label: "Inventory", route: "/inventory" },
  { label: "Services", route: "/services" },
  { label: "Customers", route: "/customers" },
  { label: "Bays", route: "/bays" },
  { label: "Billing", route: "/billing" },
  { label: "Vehicles", route: "/vehicles" },
  { label: "Notifications", route: "/notifications" },
  { label: "Settings", route: "/settings" },
  { label: "Apply Discounts", route: "action:apply_discount" },
] as const;

export const EDITABLE_ROLES = [
  "Manager",
  "Supervisor",
  "Team Lead",
  "Technician",
  "Sales",
] as const satisfies readonly Exclude<UserRole, "Admin">[];

/**
 * Maps sidebar routes to the permission prefix used in the permissions record.
 * e.g. CRM lives at /users but is governed by the /customers permission.
 */
export const ROUTE_PERMISSION_PREFIX: Record<string, string> = {
  "/users": "/customers",
};

export function resolvePermissionPrefix(pathname: string): string {
  if (pathname.startsWith("action:")) return pathname;
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return "/dashboard";
  const base = `/${segments[0]}`;
  return ROUTE_PERMISSION_PREFIX[base] ?? base;
}

export function hasRoutePermission(
  role: UserRole,
  pathname: string,
  permissions: Record<string, string[]>,
): boolean {
  if (role === "Admin") return true;

  const prefixes = permissions[role];
  if (!prefixes?.length) return false;
  if (prefixes.includes("*")) return true;

  const permissionPrefix = resolvePermissionPrefix(pathname);
  return prefixes.some(
    (prefix) =>
      permissionPrefix === prefix || permissionPrefix.startsWith(`${prefix}/`),
  );
}
