"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

export function Breadcrumbs() {
  const pathname = usePathname();

  if (!pathname || pathname === "/") return null;

  const segments = pathname.split("/").filter((segment) => segment !== "");

  return (
    <nav className="mb-4 flex items-center space-x-1 text-sm text-gray-500 print:hidden">
      {segments.map((segment, index) => {
        const isLast = index === segments.length - 1;
        const href = `/${segments.slice(0, index + 1).join("/")}`;
        
        let label = segment;
        
        // Check if segment is a UUID
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) {
          label = segment.slice(0, 8).toUpperCase();
        } else {
          // Capitalize words
          label = segment
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
        }

        return (
          <div key={href} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="mx-1 h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
            )}
            {isLast ? (
              <span className="font-semibold text-gray-900" aria-current="page">
                {label}
              </span>
            ) : (
              <Link
                href={href}
                className="transition-colors hover:text-gray-900"
              >
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
