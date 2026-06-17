import { Folder as FolderIcon, Archive, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { FOLDERS } from "@/lib/vkr/mockData";
import type { Rule } from "@/lib/vkr/types";

export type FolderSelection =
  | { kind: "all" }
  | { kind: "active" }
  | { kind: "archived" }
  | { kind: "folder"; folderId: string };

export function FoldersSidebar({
  rules,
  selection,
  onSelect,
  onAddFolder,
}: {
  rules: Rule[];
  selection: FolderSelection;
  onSelect: (s: FolderSelection) => void;
  onAddFolder: () => void;
}) {
  const total = rules.filter((r) => !r.archivedAt).length;
  const active = rules.filter((r) => r.active && !r.archivedAt).length;
  const archived = rules.filter((r) => !!r.archivedAt).length;

  return (
    <aside className="flex h-full w-[260px] shrink-0 flex-col border-r border-border bg-surface">
      <div className="px-4 pt-5 pb-3">
        <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Pravidla</div>
      </div>

      <nav className="px-2">
        <SidebarItem label="Všechna pravidla" count={total} active={selection.kind === "all"} onClick={() => onSelect({ kind: "all" })} />
        <SidebarItem label="Pouze aktivní" count={active} active={selection.kind === "active"} onClick={() => onSelect({ kind: "active" })} />
        <SidebarItem
          label="Archiv"
          count={archived}
          active={selection.kind === "archived"}
          onClick={() => onSelect({ kind: "archived" })}
          icon={Archive}
        />
      </nav>

      <div className="mt-4 flex items-center justify-between px-4 pb-2">
        <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Složky</div>
        <button
          onClick={onAddFolder}
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          title="Přidat složku"
        >
          <Plus className="size-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {FOLDERS.map((f) => {
          const count = rules.filter((r) => r.folderId === f.id && !r.archivedAt).length;
          const isActive = selection.kind === "folder" && selection.folderId === f.id;
          return (
            <button
              key={f.id}
              onClick={() => onSelect({ kind: "folder", folderId: f.id })}
              className={cn(
                "group flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left transition-colors",
                isActive ? "bg-primary-soft text-primary" : "text-foreground hover:bg-muted/60",
              )}
            >
              <FolderIcon className={cn("mt-0.5 size-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] font-semibold uppercase text-muted-foreground">{f.code}</span>
                  <span className="truncate text-sm font-medium">{f.name}</span>
                </div>
              </div>
              <span className={cn(
                "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                isActive ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function SidebarItem({
  label, count, active, onClick, icon: Icon,
}: {
  label: string; count: number; active: boolean; onClick: () => void; icon?: typeof Archive;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
        active ? "bg-primary-soft text-primary" : "text-foreground hover:bg-muted/60",
      )}
    >
      <span className="flex items-center gap-2">
        {Icon && <Icon className="size-4 text-muted-foreground" />}
        {label}
      </span>
      <span className={cn(
        "rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
        active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
      )}>
        {count}
      </span>
    </button>
  );
}
