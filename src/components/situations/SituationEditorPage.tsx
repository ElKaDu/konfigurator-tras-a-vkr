import { useEffect, useRef, useState } from "react";
import { DeleteEntityButton } from "@/components/common/DeleteEntityButton";
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

  /*
   * Situace, kterou uživatel sám založil, žije jen v localStorage a store se
   * hydratuje až po prvním renderu. Závislost jen na situationId proto draft
   * nikdy nenaplnila — formulář zůstal prázdný a uložení by data přepsalo.
   * Načteme tedy jakmile situace dorazí, ale jen jednou pro dané id, aby se
   * rozpracované úpravy nepřepisovaly při každé změně store.
   */
  const loadedForId = useRef<string | null>(null);
  useEffect(() => {
    if (!situation || loadedForId.current === situation.id) return;
    loadedForId.current = situation.id;
    setDraftName(situation.name);
    setDraftDescription(situation.description ?? "");
    setDraftSeverities(situation.severities ?? []);
  }, [situation]);

  if (!situation) {
    return (
      <AppShell current="situace" title="Situace" backTo="/situace" backSearch={{ open: situationId }}>
        <div className="rounded-md bg-card px-6 py-10 text-center text-sm text-muted-foreground elevation-2">
          Situace nenalezena. <Link to="/situace" search={{ open: undefined }} className="text-primary underline">Zpět na seznam</Link>
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
    navigate({ to: "/situace", search: { open: situationId } });
  }

  const totalUsage = (activeSituation.severities ?? []).reduce((sum, s) => sum + severityUsageCount(s.id), 0);

  return (
    <AppShell current="situace" title={situation.name || "Situace"} backTo="/situace" backSearch={{ open: situationId }}>
      <div className="grid items-start gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
        {/* LEVÝ SLOUPEC — název, popis, akce */}
        <div className="flex flex-col gap-5">
          <div className="rounded-md bg-card px-6 py-5 elevation-2">
            <div className="text-overline mb-2">Název situace</div>
            <input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              className="h-[42px] w-full rounded-md border border-input bg-card px-3.5 text-base font-medium outline-none transition-colors focus:border-primary"
            />

            <div className="text-overline mb-2 mt-5">Popis</div>
            <textarea
              value={draftDescription}
              onChange={(e) => setDraftDescription(e.target.value)}
              placeholder="Popis situace…"
              rows={4}
              className="w-full resize-none rounded-md border border-input bg-card px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-primary"
            />
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              onClick={handleSave}
              className="w-full rounded-md bg-primary px-4 py-2.5 text-[15px] font-medium text-primary-foreground elevation-1 transition-colors hover:bg-[#7E4EE6]"
            >
              Uložit
            </button>
            <DeleteEntityButton
              label="Smazat situaci"
              disabled={totalUsage > 0}
              disabledReason={`Používá se na ${totalUsage} pravidlech`}
              onDelete={() => {
                situationsStore.remove(situation.id);
                navigate({ to: "/situace", search: { open: undefined } });
              }}
            />
          </div>
        </div>

        {/* PRAVÁ ČÁST — každá závažnost ve vlastním boxu, dvě pod sebou, pak nový sloupec */}
        <div>
          <div className="text-overline mb-3">Závažnosti ({draftSeverities.length})</div>
          <div className="grid grid-flow-col grid-rows-2 gap-5 overflow-x-auto pb-2 auto-cols-[minmax(320px,1fr)]">
            {draftSeverities.map((sev) => (
              <SeverityCard
                key={sev.id}
                severity={sev}
                usageCount={severityUsageCount(sev.id)}
                onChange={updateSeverity}
                onRemove={() => removeSeverity(sev.id)}
              />
            ))}
            <button
              onClick={addSeverity}
              className="flex min-h-[120px] items-center justify-center rounded-md border border-dashed border-input text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              + Přidat závažnost
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
