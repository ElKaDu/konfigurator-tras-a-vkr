import { useState } from "react";
import type { ChecklistItem, ChecklistItemTemplate } from "@/lib/checklist/types";
import { checklistItemsStore, checklistVkrStore } from "@/lib/checklist/store";
import { deriveItemState, waitingContactDetail } from "@/lib/checklist/derived";
import { syncKontaktAttachment } from "@/lib/checklist/kontaktSync";
import { ItemContext } from "./ItemContext";
import { TemplatedField } from "./TemplatedField";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ChecklistItemRow({ item, template }: { item: ChecklistItem; template: ChecklistItemTemplate }) {
  const [expanded, setExpanded] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const state = deriveItemState(item);

  function patch(fields: Partial<ChecklistItem>) {
    checklistItemsStore.update(item.id, fields);
    const fresh = checklistItemsStore.byId(item.id);
    if (fresh) syncKontaktAttachment(fresh);
  }

  function resolve() {
    checklistItemsStore.update(item.id, {
      manuallyResolved: true,
      resolvedAt: new Date().toISOString(),
      resolvedBy: "J. Nováková",
    });
  }

  function reopen() {
    checklistItemsStore.update(item.id, { manuallyResolved: false, resolvedAt: undefined, resolvedBy: undefined });
  }

  function createTrackingVkr() {
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
    checklistItemsStore.update(item.id, { trackingVkrId: id });
  }

  const trackingTag = item.trackingVkrId && (
    <button
      onClick={(e) => {
        e.stopPropagation();
        const el = document.getElementById(`vkr-${item.trackingVkrId}`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        el?.animate([{ opacity: 0.35 }, { opacity: 1 }], { duration: 900, iterations: 2 });
      }}
      className="rounded-full border border-dashed border-info px-2 py-0.5 text-[9.5px] font-bold text-info-foreground hover:bg-info/10"
      title="Zobrazit věc k řešení"
    >
      ⏳ sleduje se →
    </button>
  );

  const contextButton = (
    <button
      onClick={() => setShowContext((s) => !s)}
      aria-expanded={showContext}
      className="text-[11px] font-semibold text-primary hover:underline"
    >
      🛈 kontext zásilky
    </button>
  );


  if (state === "resolved") {
    return (
      <div className="border-b border-border py-3 last:border-0">
        <div className="flex gap-2.5">
          <span className="mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border border-success bg-success text-[10px] text-success-foreground">
            ✓
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[13.5px] font-semibold text-muted-foreground">{template.title}</span>
              {contextButton}
              <span className="rounded-full bg-success/15 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-success-foreground">
                vyřešeno
              </span>
              {trackingTag}
            </div>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">
              {[item.findingValue && `Nález: ${item.findingValue}`, item.resolutionValue && `Řešení: ${item.resolutionValue}`]
                .filter(Boolean)
                .join(" · ") || "Označeno bez nálezu."}
            </p>
            {showContext && (
              <div className="mt-2">
                <ItemContext title={template.title} fields={template.context} />
              </div>
            )}
            <button onClick={reopen} className="mt-1.5 text-[11px] font-medium text-primary hover:underline">
              ↺ vrátit do otevřeného stavu
            </button>
          </div>
        </div>
      </div>
    );
  }

  const detail = state === "waiting_contact" ? waitingContactDetail(item) : undefined;

  return (
    <div className="border-b border-border py-3 last:border-0">
      <div className="flex gap-2.5">
        <StateDot state={state} />
        <div className="min-w-0 flex-1">
          <div
            onClick={() => setExpanded((e) => !e)}
            role="button"
            tabIndex={0}
            aria-expanded={expanded}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setExpanded((exp) => !exp);
              }
            }}
            className="-mx-2 flex flex-wrap items-center gap-2 rounded-md px-2 py-1 cursor-pointer hover:bg-muted"
          >
            <span className="text-[13px] text-muted-foreground">{expanded ? "▾" : "▸"}</span>
            <span className="text-[13.5px] font-semibold">{template.title}</span>
            {state === "waiting_contact" && (
              <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-warning-foreground">
                čeká na kontakt · {detail === "needs_confirm" ? "řešení k potvrzení" : "řešení chybí"}
              </span>
            )}
            {trackingTag}
          </div>

          {expanded && (
            <div className="mt-2 pl-[22px]">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[12.5px] text-muted-foreground">{template.description}</p>
                {contextButton}
              </div>

              {showContext && (
                <div className="mt-2">
                  <ItemContext title={template.title} fields={template.context} />
                </div>
              )}

              <div className="mt-2.5 flex flex-col gap-2">
                <TemplatedField
                  label="Nález"
                  options={template.findingOptions}
                  value={item.findingValue}
                  onChange={(v) => patch({ findingValue: v })}
                  checkboxLabel="podezření"
                  checked={item.findingIsSuspicion}
                  onCheckedChange={(c) => patch({ findingIsSuspicion: c })}
                />
                <TemplatedField
                  label="Řešení"
                  options={template.resolutionOptions}
                  value={item.resolutionValue}
                  onChange={(v) => patch({ resolutionValue: v })}
                  checkboxLabel="potvrdit s klientem"
                  checked={item.resolutionNeedsConfirm}
                  onCheckedChange={(c) => patch({ resolutionNeedsConfirm: c })}
                />
                <div className="flex items-start gap-1.5">
                  <span className="w-14 shrink-0 pt-1.5 text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">
                    Pozn.
                  </span>
                  <Textarea
                    value={item.noteValue ?? ""}
                    onChange={(e) => patch({ noteValue: e.target.value || undefined })}
                    rows={1}
                    className="flex-1 text-[12.5px]"
                    placeholder="Poznámka…"
                    aria-label="Poznámka"
                  />
                </div>
                <div className="flex flex-wrap gap-2 pt-0.5">
                  <Button size="sm" onClick={resolve}>
                    ✓ Označit jako vyřešeno
                  </Button>
                  {item.resolutionValue && !item.trackingVkrId && (
                    <Button size="sm" variant="outline" onClick={createTrackingVkr}>
                      + Založit věc k řešení
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StateDot({ state }: { state: "open" | "waiting_contact" }) {
  if (state === "waiting_contact") {
    return (
      <span className="mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border border-warning bg-warning/15 text-[10px] text-warning-foreground">
        📞
      </span>
    );
  }
  // Vědomě NE tvar checkboxu — jen stavová tečka, není klikací a nic se sem nezaškrtává.
  return <span className="mt-[9px] size-2 shrink-0 rounded-full bg-border" />;
}
