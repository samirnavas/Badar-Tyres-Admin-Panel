"use client";

import { useState, useEffect, FormEvent, useRef, useMemo } from "react";
import { Search, RefreshCw, Menu, LogOut, ChevronDown, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { getCustomers, getVehicles, getRecentJobsWithRelations } from "@/lib/repositories";
import { cn } from "@/lib/format";

export function Navbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [isSearching, setIsSearching] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const customersQuery = useQuery({ queryKey: ["customers"], queryFn: getCustomers });
  const vehiclesQuery = useQuery({ queryKey: ["vehicles"], queryFn: getVehicles });
  const jobsQuery = useQuery({ queryKey: ["recent-jobs"], queryFn: getRecentJobsWithRelations });

  const suggestions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return { customers: [], vehicles: [], jobs: [] };

    const customers = (customersQuery.data || []).filter(c =>
      c.name.toLowerCase().includes(q) || c.phone.includes(q)
    ).slice(0, 3);

    const vehicles = (vehiclesQuery.data || []).filter(v => 
      v.registration_number.toLowerCase().includes(q) || 
      v.model.toLowerCase().includes(q) ||
      v.manufacturer.toLowerCase().includes(q)
    ).slice(0, 3);

    const jobs = (jobsQuery.data || []).filter(j => {
      const cName = j.customer?.name?.toLowerCase() || "";
      const vReg = j.vehicle?.registration_number?.toLowerCase() || "";
      const vModel = j.vehicle?.model?.toLowerCase() || "";
      const vMan = j.vehicle?.manufacturer?.toLowerCase() || "";
      return cName.includes(q) || vReg.includes(q) || j.id.toLowerCase().includes(q) || vModel.includes(q) || vMan.includes(q);
    }).slice(0, 3);

    return { customers, vehicles, jobs };
  }, [searchQuery, customersQuery.data, vehiclesQuery.data, jobsQuery.data]);

  const hasSuggestions = suggestions.customers.length > 0 || suggestions.vehicles.length > 0 || suggestions.jobs.length > 0;

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSearchQuery(searchParams.get("search") || "");
    if (pathname === "/search") {
      setIsSearching(false);
    }
  }, [searchParams, pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const name = user?.name || "Workshop Manager";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    if (searchQuery.trim()) {
      router.push(`/search?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push(`/search`);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-gray-200 bg-white px-4 sm:gap-4 sm:px-6 print:hidden">
      <button
        type="button"
        onClick={onMenuClick}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <form onSubmit={handleSearch} className="relative flex-1 max-w-xl group">
        {isSearching ? (
          <Loader2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-theme-accent" />
        ) : (
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        )}
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder="Search orders, clients, or vehicles..."
          disabled={isSearching}
          aria-busy={isSearching}
          className="w-full rounded-md border border-gray-200 bg-gray-50 py-2 pl-9 pr-14 text-sm text-gray-900 placeholder:text-gray-400 focus:border-theme-accent focus:bg-white focus:outline-none focus:ring-1 focus:ring-theme-accent disabled:opacity-70 transition-colors"
        />
        <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 opacity-100 transition-opacity group-focus-within:opacity-0">
          <kbd className="inline-flex h-5 items-center gap-1 rounded border border-gray-200 bg-gray-100 px-1.5 font-mono text-[10px] font-medium text-gray-500">
            <span className="text-xs">Ctrl+k</span>
          </kbd>
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && searchQuery.trim().length > 0 && (
          <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg overflow-hidden">
            {!hasSuggestions && (
              <div className="px-4 py-3 text-sm text-gray-500">
                No results found for "{searchQuery}".
              </div>
            )}

            {suggestions.customers.length > 0 && (
              <div>
                <div className="bg-gray-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Customers
                </div>
                {suggestions.customers.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      router.push(`/users/${c.id}`);
                      setShowSuggestions(false);
                    }}
                    className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-theme-accent hover:text-white group/item transition-colors"
                  >
                    <span className="font-medium group-hover/item:text-white text-gray-900">{c.name}</span>
                    <span className="text-xs text-gray-500 group-hover/item:text-theme-accent-light">{c.phone}</span>
                  </button>
                ))}
              </div>
            )}

            {suggestions.vehicles.length > 0 && (
              <div>
                <div className="bg-gray-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Vehicles
                </div>
                {suggestions.vehicles.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      router.push(`/vehicles/${v.id}`);
                      setShowSuggestions(false);
                    }}
                    className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-theme-accent hover:text-white group/item transition-colors"
                  >
                    <span className="font-medium group-hover/item:text-white text-gray-900">{v.registration_number}</span>
                    <span className="text-xs text-gray-500 group-hover/item:text-theme-accent-light">{v.manufacturer} {v.model}</span>
                  </button>
                ))}
              </div>
            )}

            {suggestions.jobs.length > 0 && (
              <div>
                <div className="bg-gray-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Job Cards
                </div>
                {suggestions.jobs.map((j) => (
                  <button
                    key={j.id}
                    onClick={() => {
                      router.push(`/jobs/${j.id}`);
                      setShowSuggestions(false);
                    }}
                    className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-theme-accent hover:text-white group/item transition-colors"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium group-hover/item:text-white text-gray-900">
                        {j.customer?.name || "Unknown"}
                      </span>
                      <span className="text-xs text-gray-500 group-hover/item:text-theme-accent-light">
                        {j.vehicle?.registration_number || "No Vehicle"}
                      </span>
                    </div>
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                      j.status === "Completed" ? "bg-green-100 text-green-700 group-hover/item:bg-green-200" :
                        j.status === "In Progress" ? "bg-blue-100 text-blue-700 group-hover/item:bg-blue-200" :
                          "bg-gray-100 text-gray-700 group-hover/item:bg-gray-200 group-hover/item:text-gray-900"
                    )}>
                      {j.status}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </form>

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-2 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50"
          title="Refresh data"
        >
          <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </button>

        <div className="mx-1 h-8 w-px bg-gray-200" />

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-3 rounded-md p-1 text-left transition-colors hover:bg-gray-50"
          >
            <div className="hidden text-right leading-tight sm:block">
              <p className="text-sm font-semibold text-gray-900">{name}</p>
              <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                {user?.role || "Staff"}
              </p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-theme-accent text-sm font-semibold text-white">
              {initials}
            </span>
            <ChevronDown className="hidden h-4 w-4 text-gray-400 sm:block" />
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 top-12 z-50 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg"
              onMouseLeave={() => setMenuOpen(false)}
            >
              <div className="block border-b border-gray-100 px-4 py-3 sm:hidden">
                <p className="text-sm font-semibold text-gray-900">{name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role || "Staff"}</p>
              </div>
              <button
                onClick={logout}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-gray-50"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
