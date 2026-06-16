import { useState } from "react";
import { Check, ChevronDown, Lightbulb, Plus, X } from "lucide-react";
import { PlainToken } from "@/components/common/PlainToken";
import { cn } from "@/lib/utils";

interface Props {
  milestoneLabel: string;
}

export function CheckpointWizard({ milestoneLabel }: Props) {
  const [hasTiming, setHasTiming] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-background p-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-base font-medium">Nastavení milníku</span>
        <span className="text-sm text-muted-foreground">Krok 2 ze 3</span>
      </div>
      <p className="text-sm text-muted-foreground mt-0.5">
        {milestoneLabel} · trasa FedEx Air → CZ
      </p>

      {/* Suggestion banner */}
      <div className="flex items-center gap-2.5 rounded-md border border-border p-2.5 my-3">
        <Lightbulb className="text-primary size-[17px] shrink-0" />
        <span className="flex-1 text-xs text-muted-foreground">
          Stejný milník je jinde nastaven jako stav „In customs". Použít jako základ?
        </span>
        <button className="text-xs px-3 py-1 rounded-md border border-border shrink-0">
          Použít
        </button>
      </div>

      {/* Vertical steps block */}
      <div className="relative">
        {/* Vertical axis line */}
        <div className="absolute left-[14px] top-4 bottom-4 w-0.5 bg-border" />

        <div className="flex flex-col gap-5">
          {/* Step 1 — DONE */}
          <div className="relative flex gap-4">
            <div
              className={cn(
                "size-7 rounded-full grid place-items-center text-[13px] font-medium shrink-0 relative z-10",
                "bg-emerald-100 text-emerald-700"
              )}
            >
              <Check size={16} />
            </div>
            <div className="flex-1 flex items-center justify-between min-w-0">
              <div>
                <p className="text-xs text-muted-foreground leading-none mb-0.5">
                  Jaký milník to je?
                </p>
                <p className="text-[15px] font-medium">{milestoneLabel}</p>
              </div>
              <button className="text-xs px-3 py-1 rounded-md border border-border shrink-0 ml-3">
                Upravit
              </button>
            </div>
          </div>

          {/* Step 2 — ACTIVE */}
          <div className="relative flex gap-4">
            <div
              className={cn(
                "size-7 rounded-full grid place-items-center text-[13px] font-medium shrink-0 relative z-10",
                "bg-primary text-primary-foreground"
              )}
            >
              2
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-medium mb-2.5">
                Jak poznáme, že nastal?
              </p>
              <p className="text-[15px] leading-[2.3] text-foreground">
                Když má záznam z trackingu{" "}
                <PlainToken chevron>stav</PlainToken> ={" "}
                <PlainToken chevron>„In customs"</PlainToken> a{" "}
                <PlainToken chevron>země</PlainToken> ={" "}
                <PlainToken chevron>CZ</PlainToken>
              </p>
              <button className="flex items-center gap-1 text-primary text-sm mt-2">
                <Plus size={16} />
                přidat podrobnost
              </button>
            </div>
          </div>

          {/* Step 3 — UPCOMING */}
          <div className="relative flex gap-4">
            <div
              className={cn(
                "size-7 rounded-full grid place-items-center text-[13px] font-medium shrink-0 relative z-10",
                hasTiming ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}
            >
              3
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-3">
                <p className={cn("text-[15px] font-medium", hasTiming ? "text-foreground" : "text-muted-foreground")}>
                  Jak má správně proběhnout?
                </p>
                <span className="text-sm text-muted-foreground">· volitelné</span>
              </div>

              {!hasTiming ? (
                <>
                  {/* Empty state — no checkbox */}
                  <button
                    onClick={() => setHasTiming(true)}
                    className="w-full rounded-md border border-dashed border-border p-3.5 text-center text-sm text-primary flex items-center justify-center gap-1.5"
                  >
                    <Plus size={16} />
                    přidat časové očekávání
                  </button>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Necháš prázdné = milník nemá žádné časové očekávání.
                  </p>
                </>
              ) : (
                <div className="rounded-md border border-border p-3">
                  <p className="text-[15px] leading-[2.3] text-foreground">
                    Mělo by proběhnout{" "}
                    <PlainToken chevron>do</PlainToken>{" "}
                    <PlainToken>2</PlainToken>{" "}
                    <PlainToken chevron>hod</PlainToken> od{" "}
                    <PlainToken chevron>milníku „Odlet ze země odeslání"</PlainToken>
                  </p>

                  <button
                    onClick={() => setShowAdvanced((v) => !v)}
                    className="flex items-center gap-1 text-primary text-sm mt-2"
                  >
                    <ChevronDown size={15} className={cn("transition-transform", showAdvanced && "rotate-180")} />
                    pokročilé
                  </button>
                  {showAdvanced && (
                    <p className="text-[15px] leading-[2.3] text-foreground mt-1">
                      Měřit{" "}
                      <PlainToken chevron>čas události</PlainToken>{" "}
                      <span className="text-muted-foreground">· typ dne</span>{" "}
                      <PlainToken chevron>kterýkoli den</PlainToken>
                    </p>
                  )}

                  <button
                    onClick={() => {
                      setHasTiming(false);
                      setShowAdvanced(false);
                    }}
                    className="flex items-center gap-1 text-xs text-muted-foreground mt-2.5"
                  >
                    <X size={13} />
                    odebrat časové očekávání
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-5 pt-3.5 border-t border-border">
        <button className="text-sm text-muted-foreground">← Zpět na trasu</button>
        <button className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium">
          Uložit milník
        </button>
      </div>
    </div>
  );
}
