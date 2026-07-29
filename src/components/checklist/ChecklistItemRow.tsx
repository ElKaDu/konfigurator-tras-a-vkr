import { useState } from "react";
import type { ChecklistItem, ChecklistItemTemplate } from "@/lib/checklist/types";
import { checklistItemsStore, checklistVkrStore } from "@/lib/checklist/store";
import { kontaktyStore, useKontakty } from "@/lib/checklist/store";
import { formatKontaktDateTime } from "@/lib/checklist/derived";
import { ItemContext } from "./ItemContext";
import { ItemResolutionForm, type ResolutionOutcome } from "./ItemResolutionForm";
import { KontaktSchedulerDialog } from "./KontaktSchedulerDialog";
import { Button } from "@/components/ui/button";

export function ChecklistItemRow({ item, template }: { item: ChecklistItem; template: ChecklistItemTemplate }) {
  const [showContext, setShowContext] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [scheduling, setScheduling] = useState<{ preselectedItemId: string } | null>(null);
  const kontakty = useKontakty();
  const linkedKontakt = item.kontaktId ? kontakty.find((k) => k.id === item.kontaktId) : undefined;

  function handleOutcome(outcome: ResolutionOutcome) {
    setResolving(false);
    if (outcome.kind === "ok") {
      checklistItemsStore.update(item.id, { state: "resolved_ok", resolvedAt: new Date().toISOString(), resolvedBy: "E. Kadubcová" });
      return;
    }
    if (outcome.kind === "found") {
      checklistItemsStore.update(item.id, {
        state: "resolved_found",
        finding: outcome.finding,
        resolution: outcome.resolution,
        resolvedAt: new Date().toISOString(),
        resolvedBy: "E. Kadubcová",
      });
      return;
    }
    if (outcome.kind === "found_waiting_delivery") {
      checklistItemsStore.update(item.id, {
        state: "waiting_delivery",
        finding: outcome.finding,
        resolution: outcome.resolution,
      });
      return;
    }
    // needs_contact — otevři scheduler, item se propojí na Kontakt po submitu dialogu
    setScheduling({ preselectedItemId: item.id });
  }

  function createSledovaniVkr() {
    const id = "vkr_" + Date.now();
    const due = new Date();
    due.setDate(due.getDate() + 2);
    checklistVkrStore.create({
      id,
      title: `Sledovat: ${template.title}`,
      itemId: item.id,
      dueAt: due.toISOString(),
      createdAt: new Date().toISOString(),
      resolved: false,
    });
    checklistItemsStore.update(item.id, { vkrId: id });
  }

  function markKontaktDone() {
    if (!linkedKontakt) return;
    kontaktyStore.update(linkedKontakt.id, { status: "done" });
  }

  const isDone = item.state === "resolved_ok" || item.state === "resolved_found";
  const afterContactResolvable = item.state === "waiting_contact" && linkedKontakt?.status === "done";

  return (
    <div className="border-b border-border py-3 last:border-0">
      <div className="flex gap-2.5">
        <StateIcon state={item.state} />
        <div className="min-w-0 flex-1">
          <button
            onClick={() => setShowContext((s) => !s)}
            className="flex flex-wrap items-center gap-2 text-left"
          >
            <span className={`text-[13.5px] font-semibold ${isDone ? "text-muted-foreground font-medium" : ""}`}>
              {template.title}
            </span>
            <StateTag state={item.state} />
          </button>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">{template.description}</p>

          {isDone && item.state === "resolved_found" && (
            <p className="mt-1 text-[11.5px] text-success-foreground">
              <b>Nález:</b> {item.finding} <b>Řešení:</b> {item.resolution}
            </p>
          )}

          {item.state === "waiting_contact" && linkedKontakt && (
            <p className="mt-1 text-[11.5px] text-muted-foreground">
              Navázáno na Kontakt {formatKontaktDateTime(linkedKontakt.scheduledAt)} ({linkedKontakt.status === "done" ? "proběhl" : "naplánováno"}).
              {linkedKontakt.status === "planned" && (
                <button onClick={markKontaktDone} className="ml-1.5 text-primary underline">
                  označit jako proběhlý
                </button>
              )}
            </p>
          )}

          {item.state === "waiting_delivery" && (
            <div className="mt-1.5">
              {item.vkrId ? (
                <p className="text-[11.5px] text-muted-foreground">
                  Sledování má VkŘ — viz panel „Věci k řešení na checklistu“.
                </p>
              ) : (
                <button onClick={createSledovaniVkr} className="rounded-md border border-dashed border-input px-2.5 py-1 text-[12px] font-medium text-primary">
                  + Vytvořit věc k řešení pro sledování
                </button>
              )}
            </div>
          )}

          {showContext && <ItemContext title={template.title} fields={template.context} />}

          {item.state === "open" && !resolving && (
            <div className="mt-2.5">
              <Button size="sm" onClick={() => setResolving(true)}>
                Vyhodnotit
              </Button>
            </div>
          )}
          {item.state === "open" && resolving && (
            <ItemResolutionForm template={template} mode="initial" onSubmit={handleOutcome} onCancel={() => setResolving(false)} />
          )}

          {afterContactResolvable && !resolving && (
            <div className="mt-2.5">
              <Button size="sm" onClick={() => setResolving(true)}>
                Vyhodnotit po kontaktu
              </Button>
            </div>
          )}
          {afterContactResolvable && resolving && (
            <ItemResolutionForm template={template} mode="after_contact" onSubmit={handleOutcome} onCancel={() => setResolving(false)} />
          )}
        </div>
      </div>

      {scheduling && (
        <KontaktSchedulerDialog
          preselectedItemIds={[scheduling.preselectedItemId]}
          onClose={() => setScheduling(null)}
        />
      )}
    </div>
  );
}

function StateIcon({ state }: { state: ChecklistItem["state"] }) {
  const base = "mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border text-[10px]";
  if (state === "resolved_ok" || state === "resolved_found") return <span className={`${base} border-success bg-success text-success-foreground`}>✓</span>;
  if (state === "waiting_contact") return <span className={`${base} border-warning bg-warning/15 text-warning-foreground`}>📞</span>;
  if (state === "waiting_delivery") return <span className={`${base} border-info bg-info/15 text-info-foreground`}>⏳</span>;
  return <span className={`${base} border-input bg-transparent`} />;
}

function StateTag({ state }: { state: ChecklistItem["state"] }) {
  const map: Record<ChecklistItem["state"], { label: string; cls: string } | null> = {
    open: null,
    resolved_ok: { label: "vyřešeno", cls: "bg-success/15 text-success-foreground" },
    resolved_found: { label: "vyřešeno · s nálezem", cls: "bg-success/15 text-success-foreground" },
    waiting_contact: { label: "čeká na kontakt", cls: "bg-warning/15 text-warning-foreground" },
    waiting_delivery: { label: "čeká na dodání", cls: "bg-info/15 text-info-foreground" },
  };
  const t = map[state];
  if (!t) return null;
  return <span className={`rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide ${t.cls}`}>{t.label}</span>;
}
