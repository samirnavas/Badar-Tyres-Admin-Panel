"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  FileText,
  Truck,
  Users,
  Settings,
  X,
  Wrench,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/format";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { label: "Services", href: "/services", icon: Wrench },
  { label: "Job Cards", href: "/jobs", icon: FileText },
  { label: "Billing", href: "/billing", icon: Receipt },
  { label: "Users Management", href: "/users", icon: Users },
  { label: "Vehicle Fleet Logs", href: "/vehicles", icon: Truck },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({
  open = false,
  onClose,
}: {
  open?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile backdrop */}
      <div
        aria-hidden
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-30 bg-gray-900/50 transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-300 ease-in-out lg:translate-x-0 print:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center border-b border-gray-200 px-6 py-5">
          <img src="/badar_logo_black.svg" alt="Badar Tyres Logo" className="h-8 w-auto" />
          <button
            type="button"
            onClick={onClose}
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-5">
          {navItems.map(({ label, href, icon: Icon }) => {
            const isActive =
              pathname === href ||
              (href !== "/dashboard" && pathname.startsWith(href));

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
      </aside>
    </>
  );
}
