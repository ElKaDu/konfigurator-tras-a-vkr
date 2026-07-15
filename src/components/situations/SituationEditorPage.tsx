import { Trash2 } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { SeverityCard } from "./SeverityCard";
import { useSituations, situationsStore, severityUsageCount } from "@/lib/model/store";
import type { Severity } from "@/lib/model/types";

export function SituationEditorPage({ situationId }: { situationId: string }) {
  const situations = useSituations();
  const navigate = useNavigate();
  const situation = situations.find((s) => s.id === situationId);

  if (!situation) {
    return (
      <div className="flex h-screen w-screen flex-col bg-background text-foreground">
        <AppHeader current="rules" />
        <div className="p-6 text-sm text-muted-foreground">Situace nenalezena. <Link to="/situace" className="text-primary underline">Zpět na seznam</Link></div>
      </div>
    );
  }

  function updateSeverity(next: Severity) {
    if (!situation) return;
    situationsStore.upsert({
      ...situation,
      severities: situation.severities.map((s) => (s.id === next.id ? next : s)),
    });
  }

  function removeSeverity(severityId: string) {
    if (!situation) return;
    situationsStore.upsert({
      ...situation,
      severities: situation.severities.filter((s) => s.id !== severityId),
    });
  }

  function addSeverity() {
    if (!situation) return;
    const newSeverity: Severity = {
      id: "sev_" + Date.now(),
      name: "Nová závažnost",
      vkrTitle: "",
      priority: "medium",
      actions: [],
    };
    situationsStore.upsert({ ...situation, severities: [...situation.severities, newSeverity] });
  }

  const totalUsage = situation.severities.reduce((sum, s) => sum + severityUsageCount(s.id), 0);

  return (
    <div className="flex h-screen w-screen flex-col bg-background text-foreground">
      <AppHeader current="rules" />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl p-6 space-y-5">
          <Link to="/situace" className="text-xs text-muted-foreground hover:text-foreground">
            ← Zpět na situace
          </Link>

          <div className="flex items-center gap-2">
            <input
              value={situation.name}
              onChange={(e) => situationsStore.upsert({ ...situation, name: e.target.value })}
              className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-lg font-semibold"
            />
            <button
              disabled={totalUsage > 0}
              onClick={() => {
                situationsStore.remove(situation.id);
                navigate({ to: "/situace" });
              }}
              title={totalUsage > 0 ? `Používá se v ${totalUsage} pravidlech` : "Smazat situaci"}
              className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:border-red-300 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <Trash2 className="size-4" /> Smazat
            </button>
          </div>

          <textarea
            value={situation.description ?? ""}
            onChange={(e) => situationsStore.upsert({ ...situation, description: e.target.value })}
            placeholder="Popis situace…"
            rows={2}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm resize-none"
          />

          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Závažnosti ({situation.severities.length})
            </div>
            <div className="space-y-3">
              {situation.severities.map((sev) => (
                <SeverityCard
                  key={sev.id}
                  severity={sev}
                  situationId={situation.id}
                  usageCount={severityUsageCount(sev.id)}
                  onChange={updateSeverity}
                  onRemove={() => removeSeverity(sev.id)}
                />
              ))}
            </div>
            <button
              onClick={addSeverity}
              className="mt-3 w-full rounded-lg border border-dashed border-border py-2 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              + Přidat závažnost
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
