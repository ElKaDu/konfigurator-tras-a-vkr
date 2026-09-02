import { Trash2 } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

/**
 * Jednotné tlačítko pro smazání entity. Patří vždy pod levý sloupec detailu,
 * i když je zrovna nedostupné — aby se nemuselo hledat pokaždé jinde.
 */
export function DeleteEntityButton({
  label,
  onDelete,
  disabled,
  disabledReason,
}: {
  /** Např. „Smazat trasu". */
  label: string;
  onDelete: () => void;
  disabled?: boolean;
  /** Proč to nejde — ukáže se v tooltipu místo popisku akce. */
  disabledReason?: string;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onDelete}
      title={disabled ? disabledReason ?? label : label}
      className={cn(
        "flex w-full items-center justify-center gap-1.5 rounded-md border px-4 py-2 text-[15px] transition-colors",
        disabled
          ? "cursor-not-allowed border-input text-muted-foreground/40"
          : "border-destructive/50 text-destructive hover:bg-destructive/[0.06]",
      )}
    >
      <Trash2 size={18} />
      {label}
    </button>
  );
}
