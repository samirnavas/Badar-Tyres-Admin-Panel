import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/format";

export function Combobox({
  options,
  value,
  onChange,
  placeholder,
  className,
  disabled,
}: {
  options: string[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);

  const updateCoords = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom,
        left: rect.left,
        width: rect.width,
      });
    }
  };

  useEffect(() => {
    if (open) {
      updateCoords();
      
      const handleScroll = (e: Event) => {
        // Ignore scroll events originating from within the dropdown itself
        if (dropdownRef.current && dropdownRef.current.contains(e.target as Node)) {
          return;
        }
        updateCoords();
      };
      
      // Use capture phase to catch scroll events from any scrollable container
      window.addEventListener("scroll", handleScroll, true); 
      window.addEventListener("resize", handleScroll);
      return () => {
        window.removeEventListener("scroll", handleScroll, true);
        window.removeEventListener("resize", handleScroll);
      };
    }
  }, [open]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const isInsideContainer = containerRef.current?.contains(e.target as Node);
      const isInsideDropdown = dropdownRef.current?.contains(e.target as Node);
      
      if (!isInsideContainer && !isInsideDropdown) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <input
          type="text"
          disabled={disabled}
          className={cn(
            "w-full rounded-md border px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 pr-9",
            disabled ? "cursor-not-allowed opacity-60 bg-gray-50 border-gray-200" : "bg-white",
            className
          )}
          placeholder={placeholder || "Select..."}
          value={open ? query : value}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            onChange(e.target.value);
          }}
          onFocus={() => {
            setOpen(true);
            setQuery("");
          }}
        />
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      </div>

      {open && !disabled && coords && typeof document !== "undefined" && createPortal(
        <ul
          ref={dropdownRef}
          style={{
            position: "fixed",
            top: coords.top + 4,
            left: coords.left,
            minWidth: Math.max(coords.width, 200),
            maxWidth: "90vw",
          }}
          className="z-50 max-h-60 overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-500">
              No results found
            </li>
          ) : (
            filtered.map((opt) => (
              <li
                key={opt}
                className={cn(
                  "cursor-pointer px-3 py-2 text-sm transition-colors hover:bg-theme-accent hover:text-white",
                  value === opt && "bg-theme-accent-soft text-theme-accent font-medium hover:bg-theme-accent hover:text-white"
                )}
                onClick={() => {
                  onChange(opt);
                  setQuery("");
                  setOpen(false);
                }}
              >
                {opt}
              </li>
            ))
          )}
        </ul>,
        document.body
      )}
    </div>
  );
}
