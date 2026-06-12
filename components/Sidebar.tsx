"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  FileText,
  PlusSquare,
  Truck,
  LogOut,
  Users,
} from "lucide-react";
import { cn } from "@/lib/format";

import { useAuth } from "@/lib/AuthContext";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { label: "Job Cards", href: "/jobs", icon: FileText },
  { label: "Create New Job Card", href: "/jobs/create", icon: PlusSquare },
  { label: "Vehicle Fleet Logs", href: "/vehicles", icon: Truck },
  { label: "Users Management", href: "/users", icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  
  // Calculate initials safely
  const name = user?.name || "Workshop Manager";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex items-center gap-3 border-b border-gray-200 px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-theme-accent text-white">
          <Truck className="h-5 w-5" strokeWidth={2.2} />
        </div>
        <div className="leading-tight">
          <p className="text-lg font-bold tracking-tight text-theme-accent">
            Badar Tyres
          </p>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Enterprise Admin
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-5">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== "/dashboard" &&
              href !== "/jobs/create" &&
              pathname.startsWith(href));
          const isCreate = href === "/jobs/create";
          const isActive = isCreate ? pathname === href : active;

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-theme-accent-soft text-theme-accent"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              )}
            >
              {isActive && (
                <span className="absolute right-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-theme-accent" />
              )}
              <Icon
                className="h-5 w-5 shrink-0"
                strokeWidth={isActive ? 2.2 : 1.9}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 px-4 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-600">
            {initials}
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-semibold text-gray-900">
              {name}
            </p>
            <button 
              onClick={() => logout()}
              className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-gray-500 transition-colors hover:text-theme-accent"
            >
              <LogOut className="h-3 w-3" /> Sign out
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
