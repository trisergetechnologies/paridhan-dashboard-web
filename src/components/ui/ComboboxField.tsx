"use client";

import { cn } from "@/lib/utils";

const inputClass =
  "mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 dark:border-slate-600 dark:bg-slate-950 dark:text-white";

type ComboboxFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options?: string[];
  placeholder?: string;
  listId: string;
  hint?: string;
  className?: string;
};

export function ComboboxField({
  label,
  value,
  onChange,
  options = [],
  placeholder,
  listId,
  hint,
  className,
}: ComboboxFieldProps) {
  const suggestions = options.filter(Boolean);

  return (
    <label className={cn("block text-sm", className)}>
      <span className="text-slate-700 dark:text-slate-300">{label}</span>
      {hint ? <span className="mt-0.5 block text-xs font-normal text-slate-500">{hint}</span> : null}
      <input
        list={listId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputClass}
      />
      {suggestions.length > 0 ? (
        <datalist id={listId}>
          {suggestions.map((opt) => (
            <option key={opt} value={opt} />
          ))}
        </datalist>
      ) : null}
      {suggestions.length > 0 ? (
        <div
          className="mt-2 max-h-28 overflow-y-auto flex flex-wrap gap-1.5 pr-1"
          role="listbox"
          aria-label={`${label} suggestions`}
        >
          {suggestions.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-xs transition",
                value.trim().toLowerCase() === opt.toLowerCase()
                  ? "border-primary bg-primary/10 font-medium text-primary"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:border-primary/40 hover:text-primary dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300",
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      ) : null}
    </label>
  );
}
