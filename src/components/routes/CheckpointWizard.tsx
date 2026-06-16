import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  ChevronDown,
  Clock,
  Lightbulb,
  MapPin,
  Plus,
  X,
} from "lucide-react";
import { PlainToken } from "@/components/common/PlainToken";
import { useCheckpointTypes } from "@/lib/model/store";
import { cn } from "@/lib/utils";

interface Props {
  milestoneLabel: string;
}

type AnchorMode = "milestone" | "date_event" | "absolute";

const DATE_EVENTS = [
  "Vytvoření zásilky",
  "Vyzvednutí zásilky",
  "Vytvoření objednávky",
  "Avizované doručení zákazníkovi (ADD)",
  "Doručení hlášené dopravcem",
];

export function CheckpointWizard({ milestoneLabel }: Props) {
  const checkpointTypes = useCheckpointTypes();

  const [hasTiming, setHasTiming] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [anchorMode, setAnchorMode] = useState<AnchorMode>("date_event");
  const [anchorOpen, setAnchorOpen] = useState(false);
  const [anchorLabel, setAnchorLabel] = useState("Vyzvednutí zásilky");
  const [anchorCheckpointTypeId, setAnchorCheckpointTypeId] = useState<string | null>(null);
  const [fromRecordCreated, setFromRecordCreated] = useState(false);

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

          {/* Step 3 — UPCOMING / timing */}
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
                  {anchorMode === "absolute" ? (
                    <>
                      <p className="text-[15px] leading-[2.3] text-foreground">
                        Mělo by nastat v{" "}
                        <PlainToken chevron>09:00</PlainToken>{" "}
                        <PlainToken chevron>čas cílové země</PlainToken> dne{" "}
                        <PlainToken chevron>v den, kdy ADD</PlainToken>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        „den" nabízí: pevné datum · podle data události · ± posun o dny.
                      </p>
                      <button
                        onClick={() => setAnchorMode("date_event")}
                        className="flex items-center gap-1 text-xs text-muted-foreground mt-2"
                      >
                        <ArrowLeft size={13} />
                        zpět na „od …"
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-[15px] leading-[2.3] text-foreground">
                        Mělo by proběhnout{" "}
                        <PlainToken chevron>do</PlainToken>{" "}
                        <PlainToken>2</PlainToken>{" "}
                        <PlainToken chevron>hod</PlainToken> od{" "}
                        <button
                          type="button"
                          onClick={() => setAnchorOpen((v) => !v)}
                          className="align-baseline"
                        >
                          <PlainToken chevron>{anchorLabel}</PlainToken>
                        </button>
                      </p>

                      {anchorOpen && (
                        <div className="mt-2 rounded-lg border border-border overflow-hidden max-w-[420px]">
                          <div className="text-xs text-muted-foreground px-3 pt-2 pb-1">
                            Jiný milník trasy
                          </div>
                          {checkpointTypes.map((ct) => (
                            <button
                              key={ct.id}
                              onClick={() => {
                                setAnchorMode("milestone");
                                setAnchorLabel(ct.name);
                                setAnchorCheckpointTypeId(ct.id);
                                setAnchorOpen(false);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-muted"
                            >
                              <MapPin size={15} className="text-muted-foreground" />
                              {ct.name}
                            </button>
                          ))}
                          <div className="border-t border-border" />
                          <div className="text-xs text-muted-foreground px-3 pt-2 pb-1">
                            Datum události{" "}
                            <span className="text-muted-foreground">· systémová data i pole, na jednom místě</span>
                          </div>
                          {DATE_EVENTS.map((d) => {
                            const sel = anchorMode === "date_event" && anchorLabel === d;
                            return (
                              <button
                                key={d}
                                onClick={() => {
                                  setAnchorMode("date_event");
                                  setAnchorLabel(d);
                                  setAnchorCheckpointTypeId(null);
                                  setAnchorOpen(false);
                                }}
                                className={cn(
                                  "flex w-full items-center gap-2 px-3 py-1.5 text-sm text-left",
                                  sel ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
                                )}
                              >
                                <Calendar size={15} className={sel ? "" : "text-muted-foreground"} />
                                {d}
                                {sel && <Check size={15} className="ml-auto" />}
                              </button>
                            );
                          })}
                          <div className="border-t border-border" />
                          <button
                            onClick={() => {
                              setAnchorMode("absolute");
                              setAnchorCheckpointTypeId(null);
                              setAnchorOpen(false);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-left text-primary font-medium hover:bg-muted"
                          >
                            <Clock size={15} />
                            …v konkrétní čas v daný den
                            <ArrowRight size={15} className="ml-auto" />
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {/* Advanced — single toggle */}
                  <button
                    onClick={() => setShowAdvanced((v) => !v)}
                    className="flex items-center gap-1 text-primary text-sm mt-2"
                  >
                    <ChevronDown size={15} className={cn("transition-transform", showAdvanced && "rotate-180")} />
                    pokročilé
                  </button>
                  {showAdvanced && (
                    <div className="mt-1.5">
                      <button
                        onClick={() => setFromRecordCreated((v) => !v)}
                        className="flex items-center gap-2 text-sm"
                      >
                        <span
                          className={cn(
                            "w-[34px] h-[18px] rounded-full relative inline-block transition-colors shrink-0",
                            fromRecordCreated ? "bg-primary" : "bg-muted"
                          )}
                        >
                          <span
                            className={cn(
                              "absolute top-0.5 size-3.5 rounded-full bg-white transition-all",
                              fromRecordCreated ? "right-0.5" : "left-0.5"
                            )}
                          />
                        </span>
                        počítat od vytvoření záznamu v trackingu
                      </button>
                      <p className="text-xs text-muted-foreground mt-1">
                        Výchozí: počítá se od času události.
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setHasTiming(false);
                      setShowAdvanced(false);
                      setAnchorOpen(false);
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
