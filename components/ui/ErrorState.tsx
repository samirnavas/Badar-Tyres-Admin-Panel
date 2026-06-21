import type { LucideIcon } from "lucide-react";

interface ErrorStateProps {
  title: string;
  description: string;
  icon: LucideIcon;
  retryAction?: () => void;
  retryText?: string;
}

export function ErrorState({
  title,
  description,
  icon: Icon,
  retryAction,
  retryText = "Try Again",
}: ErrorStateProps) {
  return (
    <div className="flex w-full flex-col items-center justify-center text-center">
      <div className="mb-4 flex items-center justify-center rounded-full bg-red-50 p-4 text-red-500">
        <Icon className="h-8 w-8" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <p className="mt-2 max-w-md text-center text-sm text-gray-500">
        {description}
      </p>
      {retryAction && (
        <button
          type="button"
          onClick={retryAction}
          className="mt-6 inline-flex items-center rounded-lg bg-theme-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-theme-accent-dark"
        >
          {retryText}
        </button>
      )}
    </div>
  );
}
