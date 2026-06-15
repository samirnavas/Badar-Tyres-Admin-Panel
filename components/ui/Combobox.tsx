import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/format";

export interface ComboboxOption {
  value: string;
  label: string;
  /** Optional secondary text shown muted next to the label (e.g. phone, price). */
  hint?: string;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder,
  className,
  disabled,
  emptyMessage = "No results found",
}: {
  options: ComboboxOption[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  emptyMessage?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);

  const selectedLabel = useMemo(
    () => options.find((o) => o.value === value)?.label ?? "",
    [options, value],
  );

  const updateCoords = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom, left: rect.left, width: rect.width });
    }
  };

  useEffect(() => {
    if (open) {
      updateCoords();

      const handleScroll = (e: Event) => {
        if (
          dropdownRef.current &&
          dropdownRef.current.contains(e.target as Node)
        ) {
          return;
        }
        updateCoords();
      };

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
      const isInsideContainer = containerRef.current?.contains(
        e.target as Node,
      );
      const isInsideDropdown = dropdownRef.current?.contains(e.target as Node);

      if (!isInsideContainer && !isInsideDropdown) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <input
          type="text"
          disabled={disabled}
          className={cn(
            "w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 pr-9",
            disabled
              ? "cursor-not-allowed opacity-60 bg-gray-100 border-gray-200"
              : "bg-white",
            className,
          )}
          placeholder={placeholder || "Select..."}
          value={open ? query : selectedLabel}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (disabled) return;
            setOpen(true);
            setQuery("");
          }}
        />
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      </div>

      {open &&
        !disabled &&
        coords &&
        typeof document !== "undefined" &&
        createPortal(
          <ul
            ref={dropdownRef}
            style={{
              position: "fixed",
              top: coords.top + 6,
              left: coords.left,
              minWidth: Math.max(coords.width, 200),
              maxWidth: "90vw",
            }}
            className="z-50 max-h-60 overflow-auto rounded-xl border border-white/40 bg-white/70 py-1 shadow-xl shadow-gray-900/10 backdrop-blur-xl backdrop-saturate-150 focus:outline-none [color-scheme:light]"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-500">{emptyMessage}</li>
            ) : (
              filtered.map((opt) => (
                <li
                  key={opt.value}
                  className={cn(
                    "mx-1 flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-theme-accent hover:text-white",
                    value === opt.value &&
                      "bg-theme-accent-soft font-medium text-theme-accent",
                  )}
                  onClick={() => {
                    onChange(opt.value);
                    setQuery("");
                    setOpen(false);
                  }}
                >
                  <span className="truncate">{opt.label}</span>
                  {opt.hint && (
                    <span className="shrink-0 text-xs text-gray-400">
                      {opt.hint}
                    </span>
                  )}
                </li>
              ))
            )}
          </ul>,
          document.body,
        )}
    </div>
  );
}
