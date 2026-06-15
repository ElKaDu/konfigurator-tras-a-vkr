import { Clock, Filter, Zap, Pencil } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { PlainToken } from "@/components/common/PlainToken";
import { AreaBadge } from "@/components/common/AreaBadge";
import { ActionsEditor } from "@/components/rules/ActionsEditor";
import type { Area } from "@/lib/model/types";

export function RuleEditor({ area, name }: { area: Area; name: string }) {
  return (
    <div className="flex h-screen w-screen flex-col bg-background text-foreground">
      <AppHeader current="rules" />

      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-3xl w-full p-6">
          {/* Top row: rule name + area badge + step indicator */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-lg font-semibold truncate">{name}</h1>
              <Pencil size={14} className="text-muted-foreground shrink-0" />
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-4">
              <AreaBadge area={area} />
              <span className="text-xs text-muted-foreground">· krok 2 ze 2</span>
            </div>
          </div>

          {/* Meta row: priority + active toggle */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-5">
            <span>Priorita Low</span>
            <div className="flex items-center gap-1.5">
              <div className="relative w-[30px] h-4 rounded-full bg-primary flex items-center">
                <div className="absolute right-0.5 size-3 rounded-full bg-white shadow-sm" />
              </div>
              <span>Aktivní</span>
            </div>
          </div>

          {/* Three section cards */}
          <div className="flex flex-col gap-3">
            {/* 1 — Spouštěč */}
            <SectionCard icon={Clock} title="Spouštěč" subtitle="kdy se vyhodnotí">
              <PlainToken chevron>při každé nové tracking události</PlainToken>
            </SectionCard>

            {/* 2 — Podmínka (placeholder for Task 8) */}
            <SectionCard icon={Filter} title="Podmínka">
              <div className="text-sm text-muted-foreground">
                Obsah podmínky podle oblasti (doplní Task 8).
              </div>
            </SectionCard>

            {/* 3 — Akce */}
            <SectionCard icon={Zap} title="Akce">
              <ActionsEditor area={area} />
            </SectionCard>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-5 pt-4 border-t border-border">
            <Link
              to="/rules/new"
              search={{ area }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Zpět na oblast
            </Link>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                Otestovat
              </button>
              <button className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity">
                Uložit pravidlo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
