import { useState } from "react";
import {
  TextSearch,
  Route,
  ClipboardCheck,
  PackageX,
  Scale,
  Circle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { AREAS } from "@/lib/model/areas";
import { AppHeader } from "@/components/AppHeader";
import type { Area } from "@/lib/model/types";

// Mirror AreaBadge.tsx icon remap: ListSearch → TextSearch, PackageOff → PackageX
const ICONS: Record<string, LucideIcon> = {
  ListSearch: TextSearch,
  Route,
  ClipboardCheck,
  PackageOff: PackageX,
  Scale,
};

export function AreaPicker({ preselectedArea }: { preselectedArea?: Area }) {
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<Area | undefined>(preselectedArea);
  const navigate = useNavigate();

  return (
    <div className="flex h-screen w-screen flex-col bg-background text-foreground">
      <AppHeader current="rules" />

      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-3xl p-6">
          {/* Heading row */}
          <div className="flex items-baseline gap-2 mb-1">
            <h1 className="text-lg font-semibold">Nové pravidlo</h1>
            <span className="text-sm text-muted-foreground">· krok 1 ze 2</span>
          </div>

          {/* Subtitle */}
          <p className="text-sm text-muted-foreground mb-6">
            Vyber oblast — podle ní se přizpůsobí kroky i možnosti konfigurátoru.
          </p>

          {/* Rule name input */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1.5" htmlFor="rule-name">
              Název pravidla
            </label>
            <input
              id="rule-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Např. Zásilka se zasekla na jednom místě"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Area cards grid */}
          <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))] mb-8">
            {AREAS.map((area) => {
              const Icon = ICONS[area.icon] ?? Circle;
              const isSelected = selected === area.id;

              if (!area.enabled) {
                return (
                  <div
                    key={area.id}
                    className="relative rounded-xl border border-border p-4 opacity-60"
                  >
                    {/* "připravujeme" pill */}
                    <span className="absolute top-3 right-3 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                      připravujeme
                    </span>

                    {/* Icon tile */}
                    <div className="size-9 rounded-lg grid place-items-center bg-muted text-muted-foreground">
                      <Icon size={18} />
                    </div>

                    <div className="text-sm font-medium mt-2.5">{area.label}</div>
                    <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {area.description}
                    </div>
                  </div>
                );
              }

              return (
                <button
                  key={area.id}
                  onClick={() => setSelected(area.id as Area)}
                  className={cn(
                    "rounded-xl border p-4 text-left cursor-pointer transition-colors",
                    isSelected
                      ? "border-2 border-primary"
                      : "border-border hover:border-primary/40 hover:bg-muted/30",
                  )}
                >
                  {/* Icon tile */}
                  <div className="size-9 rounded-lg grid place-items-center bg-primary-soft text-primary">
                    <Icon size={18} />
                  </div>

                  <div className="text-sm font-medium mt-2.5">{area.label}</div>
                  <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {area.description}
                  </div>

                  {/* Footer line */}
                  <div className={cn("text-sm mt-3", isSelected ? "text-primary font-medium" : "text-primary")}>
                    {isSelected ? "✓ Vybráno" : "Vybrat →"}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer row */}
          <div className="flex justify-end">
            <button
              disabled={!selected}
              onClick={() => {
                if (selected) {
                  void navigate({
                    to: "/rules/new/edit",
                    search: { area: selected, name },
                  });
                }
              }}
              className={cn(
                "bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium",
                !selected && "opacity-50 cursor-not-allowed",
              )}
            >
              Pokračovat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
