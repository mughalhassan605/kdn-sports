"use client";

import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/cn";

/** The one search input: a pill with the glass on the left and a clear button once there is text. */
export function SearchField({
  value,
  onChange,
  size = "md",
  className,
  inputRef,
  ...rest
}: {
  value: string;
  onChange: (v: string) => void;
  size?: "md" | "lg";
  className?: string;
  inputRef?: React.Ref<HTMLInputElement>;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "size">) {
  const { t } = useI18n();
  const lg = size === "lg";

  return (
    <div className={cn("relative", className)}>
      <MagnifyingGlassIcon
        size={lg ? 22 : 19}
        weight="bold"
        aria-hidden
        className={cn("pointer-events-none absolute top-1/2 -translate-y-1/2 text-paper-3", lg ? "left-5" : "left-4")}
      />
      <input
        ref={inputRef}
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        aria-label={t.search.label}
        placeholder={t.search.placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "field !rounded-full [&::-webkit-search-cancel-button]:appearance-none",
          lg ? "!h-16 pl-14 pr-14 text-lg md:!h-[4.5rem] md:text-xl" : "!h-12 pl-11 pr-12",
        )}
        {...rest}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label={t.search.clear}
          className={cn(
            "absolute top-1/2 grid -translate-y-1/2 place-items-center rounded-full text-paper-2 transition-colors hover:bg-white/10 hover:text-paper",
            lg ? "right-3 size-10" : "right-2 size-8",
          )}
        >
          <XIcon size={lg ? 18 : 15} weight="bold" />
        </button>
      )}
    </div>
  );
}
