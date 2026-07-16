import { Plus, Trash2 } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { useSituations, situationsStore, useRules } from "@/lib/model/store";
import { cn } from "@/lib/utils";

export function SituationsListPage() {
  const situations = useSituations();
  const rules = useRules();
  const navigate = useNavigate();

  function createSituation() {
    const id = "sit_" + Date.now();
    situationsStore.upsert({
      id,
      code: "SIT-" + Math.floor(Math.random() * 9000 + 1000),
      name: "Nová situace",
      area: "tracking_records",
      severities: [],
    });
    navigate({ to: "/situace/$id", params: { id } });
  }

  function totalUsage(situationId: string): number {
    return rules.filter((r) => r.situationId === situationId).length;
  }

  return (
    <div className="flex h-screen w-screen flex-col bg-background text-foreground">
      <AppHeader current="situace" />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl p-6">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-lg font-semibold">Situace a závažnosti</h1>
            <button
              onClick={createSituation}
              className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="size-3.5" /> Nová situace
            </button>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Šablony pro věci k řešení — každá situace má stupně závažnosti s výchozím názvem, popisem, prioritou a akcemi.
          </p>

          <div className="flex flex-col gap-2">
            {situations.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Zatím žádné situace.</p>
            ) : (
              situations.map((s) => {
                const usage = totalUsage(s.id);
                return (
                  <Link
                    key={s.id}
                    to="/situace/$id"
                    params={{ id: s.id }}
                    className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{s.name}</div>
                      {s.description && <div className="text-xs text-muted-foreground mt-0.5">{s.description}</div>}
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{s.severities.length} závažností</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{usage} pravidel</span>
                    <button
                      disabled={usage > 0}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        situationsStore.remove(s.id);
                      }}
                      title={usage > 0 ? `Používá se v ${usage} pravidlech` : "Smazat situaci"}
                      className={cn(
                        "shrink-0 rounded p-1.5 text-muted-foreground transition-colors",
                        usage > 0 ? "opacity-30 cursor-not-allowed" : "hover:text-red-500"
                      )}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </Link>
                );
              })
            )}
          </div>

          <Link to="/" className="mt-6 inline-block text-sm text-muted-foreground hover:text-foreground">
            ← Zpět na pravidla
          </Link>
        </div>
      </div>
    </div>
  );
}
