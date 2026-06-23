import { useRef } from "react";
import { Download, MoreHorizontal, Upload } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadExport, importFromFile } from "@/lib/dataExport";

/**
 * Menu „⋯ Data" — Stáhnout / Nahrát kompletní data prototypu.
 * Reset na seed je vědomě skrytý (data uživatele jsou cenná).
 */
export function DataMenu() {
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // umožní opětovný výběr stejného souboru
    if (!file) return;
    if (!window.confirm("Tímto přepíšeš VŠECHNA data (trasy, pravidla, typy problémů) obsahem souboru. Pokračovat?")) return;
    try {
      await importFromFile(file);
      window.location.reload();
    } catch (err) {
      window.alert(`Import selhal: ${(err as Error).message}`);
    }
  }

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={onFile}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="grid size-8 place-items-center rounded-md border border-border text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Data"
            title="Data"
          >
            <MoreHorizontal className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onClick={() => downloadExport()}>
            <Download className="size-4" /> Stáhnout data
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => fileRef.current?.click()}>
            <Upload className="size-4" /> Nahrát data (přepis)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
