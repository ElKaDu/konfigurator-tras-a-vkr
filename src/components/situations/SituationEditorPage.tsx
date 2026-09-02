import { useEffect, useState } from "react";
import { Trash2 } from "@/components/ui/icon";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { SeverityCard } from "./SeverityCard";
import { useSituations, situationsStore, severityUsageCount } from "@/lib/model/store";
import type { Severity } from "@/lib/model/types";

export function SituationEditorPage({ situationId }: { situationId: string }) {
  const situations = useSituations();
  const navigate = useNavigate();
  const situation = situations.find((s) => s.id === situationId);

  const [draftName, setDraftName] = useState(situation?.name ?? "");
  const [draftDescription, setDraftDescription] = useState(situation?.description ?? "");
  const [draftSeverities, setDraftSeverities] = useState<Severity[]>(situation?.severities ?? []);

  useEffect(() => {
    if (!situation) return;
    setDraftName(situation.name);
    setDraftDescription(situation.description ?? "");
    setDraftSeverities(situation.severities);
    // Resetuje draft jen při přepnutí na jinou Situaci, ne při každé změně store (aby se nepřepsaly rozpracované úpravy).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [situationId]);

  if (!situation) {
    return (
      <AppShell current="situace" title="Situace" backTo="/situace">
        <div className="rounded-md bg-card px-6 py-10 text-center text-sm text-muted-foreground elevation-2">
          Situace nenalezena. <Link to="/situace" className="text-primary underline">Zpět na seznam</Link>
        </div>
      </AppShell>
    );
  }

  const activeSituation = situation;

  function updateSeverity(next: Severity) {
    setDraftSeverities((cur) => cur.map((s) => (s.id === next.id ? next : s)));
  }

  function removeSeverity(severityId: string) {
    setDraftSeverities((cur) => cur.filter((s) => s.id !== severityId));
  }

  function addSeverity() {
    const newSeverity: Severity = {
      id: "sev_" + Date.now(),
      name: "Nová závažnost",
      priority: "medium",
      actions: [],
    };
    setDraftSeverities((cur) => [...cur, newSeverity]);
  }

  function handleSave() {
    situationsStore.upsert({
      ...activeSituation,
      name: draftName,
      description: draftDescription || undefined,
      severities: draftSeverities,
    });
    toast.success("Situace uložena");
    navigate({ to: "/situace" });
  }

  const totalUsage = activeSituation.severities.reduce((sum, s) => sum + severityUsageCount(s.id), 0);

  return (
    <AppShell current="situace" title={situation.name || "Situace"} backTo="/situace">
      <div>
        <div className="max-w-3xl space-y-5">
          <div className="rounded-md bg-card px-6 py-5 elevation-2">
            <div className="flex items-center gap-3">
              <input
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                className="h-[42px] w-full rounded-md border border-input bg-card px-3.5 text-sm outline-none transition-colors focus:border-primary flex-1 text-base font-medium"
              />
              <button
                disabled={totalUsage > 0}
                onClick={() => {
                  situationsStore.remove(situation.id);
                  navigate({ to: "/situace" });
                }}
                title={totalUsage > 0 ? "Situace se používá na pravidlech" : "Smazat situaci"}
                className="flex shrink-0 items-center gap-1.5 rounded-md border border-destructive/50 px-4 py-2 text-[15px] text-destructive transition-colors hover:bg-destructive/[0.06] disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Trash2 size={18} /> Smazat
              </button>
            </div>

            <textarea
              value={draftDescription}
              onChange={(e) => setDraftDescription(e.target.value)}
              placeholder="Popis situace…"
              rows={2}
              className="mt-4 w-full resize-none rounded-md border border-input bg-card px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-primary"
            />
          </div>

          <div className="rounded-md bg-card px-6 py-5 elevation-2">
            <div className="text-overline mb-3">Závažnosti ({draftSeverities.length})</div>
            <div className="space-y-3">
              {draftSeverities.map((sev) => (
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
              className="mt-3 w-full rounded-md border border-dashed border-input py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              + Přidat závažnost
            </button>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={handleSave}
              className="w-full rounded-md bg-primary px-4 py-2.5 text-[15px] font-medium text-primary-foreground elevation-1 transition-colors hover:bg-[#7E4EE6]"
            >
              Uložit
            </button>
            <Link
              to="/situace"
              className="block w-full rounded-md border border-input px-4 py-2 text-center text-[15px] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              ← Zpět na situace
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
