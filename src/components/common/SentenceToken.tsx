import type { ReactNode } from "react";
import { ChevronDown } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

/*
 * Ovladače vsazené do věty. Nastavení se čte jako oznamovací věta a mění se
 * kliknutím na zvýrazněné části — stejný princip jako „Na trase zásilky sleduj
 * milník ⟨X⟩" v editoru pravidla.
 */

/** Rozbalovačka, která se šířkou drží vybrané hodnoty (nativní select je jen průhledná vrstva). */
export function SelectToken({
  value,
  label,
  onChange,
  children,
  ariaLabel,
}: {
  value: string;
  /** Co se ukáže v pilulce — obvykle popisek vybrané volby. */
  label: string;
  onChange: (next: string) => void;
  /** <option> a <optgroup> prvky. */
  children: ReactNode;
  ariaLabel: string;
}) {
  return (
    <span className="relative inline-flex h-9 items-center gap-1.5 rounded-md bg-primary-soft px-3 text-[14px] font-medium text-accent-foreground">
      {label}
      <ChevronDown size={14} className="opacity-70" />
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {children}
      </select>
    </span>
  );
}

/** Číslo nebo čas přímo ve větě. */
export function InputToken({
  value,
  onChange,
  type = "number",
  min,
  ariaLabel,
  className,
}: {
  value: string | number;
  onChange: (next: string) => void;
  type?: "number" | "time";
  min?: number;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <input
      type={type}
      min={min}
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-9 rounded-md border border-input bg-card px-3 text-[14px] tabular-nums text-foreground outline-none transition-colors focus:border-primary",
        type === "time" ? "w-[104px]" : "w-[68px]",
        className,
      )}
    />
  );
}

/**
 * Obal věty. Flex místo řádkového toku — každé slovo i ovladač je vlastní položka,
 * takže mezery jsou všude stejné a nic neposkakuje po účaří.
 */
export function Sentence({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-2.5 text-[15px] leading-[22px] text-foreground">
      {children}
    </div>
  );
}
