import { useState } from "react";
import { useCheckpointTypes, useSegments, checkpointTypesStore } from "@/lib/model/store";
import { milestoneTypeUsage } from "@/lib/model/routeAssembly";

export function MilestoneLibrary({ onPick }: { onPick: (checkpointTypeId: string) => void }) {
  const types = useCheckpointTypes();
  const usage = milestoneTypeUsage(useSegments());
  const [draft, setDraft] = useState("");

  function createType() {
    const name = draft.trim();
    if (!name) return;
    const id = "ct_" + Date.now();
    checkpointTypesStore.upsert({ id, name });
    onPick(id);
    setDraft("");
  }

  return (
    <div className="flex flex-col gap-1">
      <p className="mb-1 text-sm font-medium text-muted-foreground">Knihovna milníků</p>
      {types.map((t) => (
        <button
          key={t.id}
          onClick={() => onPick(t.id)}
          className="flex items-center justify-between rounded-md px-2.5 py-2 text-sm hover:bg-muted"
        >
          <span>{t.name}</span>
          <span className="text-xs text-muted-foreground">{usage.get(t.id) ?? 0}×</span>
        </button>
      ))}
      <div className="mt-1 flex gap-1.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && createType()}
          placeholder="Nový milník…"
          className="flex-1 rounded-md border border-border px-2 py-1 text-sm"
        />
        <button onClick={createType} className="rounded-md border border-border px-2 text-sm text-primary">
          +
        </button>
      </div>
    </div>
  );
}
