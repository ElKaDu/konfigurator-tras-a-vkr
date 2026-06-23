import { useState } from "react";
import { Calendar, Check, Lightbulb, MapPin, Plus, X } from "lucide-react";
import { PlainToken } from "@/components/common/PlainToken";
import { useCheckpointTypes } from "@/lib/model/store";
import { cn } from "@/lib/utils";

interface Props {
  milestoneLabel: string;
}

type DateAnchorKind = "today" | "milestone" | "event";
type DateOffsetPos = "in_day" | "before" | "after";
type TimeMode = "absolute" | "offset";
type TimeOffsetPos = "before" | "after";

const DATE_EVENTS = [
  "Vytvoření zásilky",
  "Vyzvednutí zásilky",
  "Vytvoření objednávky",
  "Avizované doručení zákazníkovi (ADD)",
  "Doručení hlášené dopravcem",
];

const TZ_OPTIONS = ["Europe/Prague", "Europe/Berlin", "UTC", "America/New_York"];

export function CheckpointWizard({ milestoneLabel }: Props) {
  const checkpointTypes = useCheckpointTypes();

  const [hasDeadline, setHasDeadline] = useState(false);
  const [anchorOpen, setAnchorOpen] = useState(false);

  // DATUM
  const [anchorKind, setAnchorKind] = useState<DateAnchorKind>("today");
  const [anchorLabel, setAnchorLabel] = useState("dnešní den");
  const [dateOffsetPos, setDateOffsetPos] = useState<DateOffsetPos>("in_day");
  const [dateOffsetDays, setDateOffsetDays] = useState(1);
  const [businessDays, setBusinessDays] = useState(false);

  // ČAS
  const [timeMode, setTimeMode] = useState<TimeMode>("absolute");
  const [timeAbs, setTimeAbs] = useState("08:00");
  const [tz, setTz] = useState("Europe/Prague");
  const [timeOffsetAmount, setTimeOffsetAmount] = useState(2);
  const [timeOffsetUnit, setTimeOffsetUnit] = useState<"min" | "h">("h");
  const [timeOffsetPos, setTimeOffsetPos] = useState<TimeOffsetPos>("before");

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
        <div className="absolute left-[14px] top-4 bottom-4 w-0.5 bg-border" />

        <div className="flex flex-col gap-5">
          {/* Step 1 — DONE */}
          <div className="relative flex gap-4">
            <div className="size-7 rounded-full grid place-items-center text-[13px] font-medium shrink-0 relative z-10 bg-emerald-100 text-emerald-700">
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

          {/* Step 2 — Co musí být na záznamu */}
          <div className="relative flex gap-4">
            <div className="size-7 rounded-full grid place-items-center text-[13px] font-medium shrink-0 relative z-10 bg-primary text-primary-foreground">
              2
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-medium mb-2.5">
                Co musí být na záznamu?
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

          {/* Step 3 — TERMÍN ZÁZNAMU */}
          <div className="relative flex gap-4">
            <div className={cn(
              "size-7 rounded-full grid place-items-center text-[13px] font-medium shrink-0 relative z-10",
              hasDeadline ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
            )}>
              3
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-3">
                <p className={cn("text-[15px] font-medium", hasDeadline ? "text-foreground" : "text-muted-foreground")}>
                  Termín záznamu
                </p>
                <span className="text-sm text-muted-foreground">· volitelné</span>
              </div>

              {!hasDeadline ? (
                <>
                  <button
                    onClick={() => setHasDeadline(true)}
                    className="w-full rounded-md border border-dashed border-border p-3.5 text-center text-sm text-primary flex items-center justify-center gap-1.5"
                  >
                    <Plus size={16} />
                    nastavit termín záznamu
                  </button>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Necháš prázdné = milník nemá žádný termín a stačí, aby kdykoli nastal.
                  </p>
                </>
              ) : (
                <div className="rounded-md border border-border p-3 space-y-3">
                  <p className="text-xs text-muted-foreground leading-snug">
                    Nejpozdější datum a čas, kdy se událost musí na záznamu objevit.
                    Dřívější dny se započítávají automaticky. Pokud splňujících záznamů
                    bude víc, bere se ten nejnovější ≤ termín.
                  </p>

                  {/* DATUM */}
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Datum</div>
                    <div className="flex items-center flex-wrap gap-1.5 text-sm">
                      <select
                        value={dateOffsetPos}
                        onChange={(e) => setDateOffsetPos(e.target.value as DateOffsetPos)}
                        className="rounded border border-border bg-background px-2 py-1 text-xs"
                      >
                        <option value="in_day">v den</option>
                        <option value="before">X dnů před</option>
                        <option value="after">X dnů po</option>
                      </select>
                      {dateOffsetPos !== "in_day" && (
                        <input
                          type="number"
                          min={1}
                          value={dateOffsetDays}
                          onChange={(e) => setDateOffsetDays(Math.max(1, Number(e.target.value) || 1))}
                          className="w-14 rounded border border-border bg-background px-2 py-1 text-xs"
                        />
                      )}
                      <span className="text-xs text-muted-foreground">kotvy</span>
                      <button
                        type="button"
                        onClick={() => setAnchorOpen((v) => !v)}
                        className="align-baseline"
                      >
                        <PlainToken chevron>{anchorLabel}</PlainToken>
                      </button>
                    </div>

                    {anchorOpen && (
                      <div className="mt-2 rounded-lg border border-border overflow-hidden max-w-[420px]">
                        <div className="text-xs text-muted-foreground px-3 pt-2 pb-1">Systémové kotvy</div>
                        <button
                          onClick={() => { setAnchorKind("today"); setAnchorLabel("dnešní den"); setAnchorOpen(false); }}
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-muted"
                        >
                          <Calendar size={15} className="text-muted-foreground" />
                          dnešní den
                        </button>

                        <div className="border-t border-border" />
                        <div className="text-xs text-muted-foreground px-3 pt-2 pb-1">Jiný milník trasy</div>
                        {checkpointTypes.map((ct) => (
                          <button
                            key={ct.id}
                            onClick={() => { setAnchorKind("milestone"); setAnchorLabel(ct.name); setAnchorOpen(false); }}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-muted"
                          >
                            <MapPin size={15} className="text-muted-foreground" />
                            {ct.name}
                          </button>
                        ))}

                        <div className="border-t border-border" />
                        <div className="text-xs text-muted-foreground px-3 pt-2 pb-1">Datum události</div>
                        {DATE_EVENTS.map((d) => {
                          const sel = anchorKind === "event" && anchorLabel === d;
                          return (
                            <button
                              key={d}
                              onClick={() => { setAnchorKind("event"); setAnchorLabel(d); setAnchorOpen(false); }}
                              className={cn(
                                "flex w-full items-center gap-2 px-3 py-1.5 text-sm text-left",
                                sel ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted",
                              )}
                            >
                              <Calendar size={15} className={sel ? "" : "text-muted-foreground"} />
                              {d}
                              {sel && <Check size={15} className="ml-auto" />}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {dateOffsetPos !== "in_day" && (
                      <label className="flex items-center gap-2 text-xs text-muted-foreground mt-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={businessDays}
                          onChange={(e) => setBusinessDays(e.target.checked)}
                          className="accent-primary"
                        />
                        počítat jen pracovní dny
                      </label>
                    )}
                  </div>

                  {/* ČAS */}
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Čas</div>
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="radio"
                          checked={timeMode === "absolute"}
                          onChange={() => setTimeMode("absolute")}
                          className="accent-primary"
                        />
                        <span className="text-xs text-muted-foreground w-16">absolutně</span>
                        {timeMode === "absolute" && (
                          <>
                            <input
                              type="time"
                              value={timeAbs}
                              onChange={(e) => setTimeAbs(e.target.value)}
                              className="rounded border border-border bg-background px-2 py-1 text-xs"
                            />
                            <select
                              value={tz}
                              onChange={(e) => setTz(e.target.value)}
                              className="rounded border border-border bg-background px-2 py-1 text-xs"
                            >
                              {TZ_OPTIONS.map((t) => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                          </>
                        )}
                      </label>

                      <label className="flex items-center gap-2 text-sm cursor-pointer flex-wrap">
                        <input
                          type="radio"
                          checked={timeMode === "offset"}
                          onChange={() => setTimeMode("offset")}
                          className="accent-primary"
                        />
                        <span className="text-xs text-muted-foreground w-16">offset</span>
                        {timeMode === "offset" && (
                          <>
                            <input
                              type="number"
                              min={1}
                              value={timeOffsetAmount}
                              onChange={(e) => setTimeOffsetAmount(Math.max(1, Number(e.target.value) || 1))}
                              className="w-14 rounded border border-border bg-background px-2 py-1 text-xs"
                            />
                            <select
                              value={timeOffsetUnit}
                              onChange={(e) => setTimeOffsetUnit(e.target.value as "min" | "h")}
                              className="rounded border border-border bg-background px-2 py-1 text-xs"
                            >
                              <option value="min">min</option>
                              <option value="h">h</option>
                            </select>
                            <select
                              value={timeOffsetPos}
                              onChange={(e) => setTimeOffsetPos(e.target.value as TimeOffsetPos)}
                              className="rounded border border-border bg-background px-2 py-1 text-xs"
                            >
                              <option value="before">před koncem dne</option>
                              <option value="after">po začátku dne</option>
                            </select>
                          </>
                        )}
                      </label>
                    </div>
                  </div>

                  <div className="rounded-md bg-muted/40 border border-border px-3 py-2 text-[11px] text-muted-foreground leading-snug">
                    ⓘ Příklad: „v den <strong>{anchorLabel}</strong>, do <strong>{timeMode === "absolute" ? `${timeAbs} ${tz}` : `${timeOffsetAmount} ${timeOffsetUnit} ${timeOffsetPos === "before" ? "před koncem dne" : "po začátku dne"}`}</strong>" — záznam přijatý dříve (i v předchozí dny) je splněno.
                  </div>

                  <button
                    onClick={() => { setHasDeadline(false); setAnchorOpen(false); }}
                    className="flex items-center gap-1 text-xs text-muted-foreground mt-1"
                  >
                    <X size={13} />
                    odebrat termín
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

