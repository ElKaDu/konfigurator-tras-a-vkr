import { useState, useRef, useEffect } from "react";
import { Search, Plus, X, ChevronRight, ChevronDown, MapPin, Calendar, Clock, Check } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { useSegments, useCheckpointTypes, segmentsStore, checkpointTypesStore } from "@/lib/model/store";
import { milestoneTypeUsage } from "@/lib/model/routeAssembly";
import { cn } from "@/lib/utils";
import type { Checkpoint, CheckpointCorrectness } from "@/lib/model/types";

const MATCH_FIELDS = [
  { id: "status", label: "Status" },
  { id: "status_code", label: "Kód statusu" },
  { id: "location_country_code", label: "Země" },
  { id: "location_postal_code", label: "PSČ" },
  { id: "location_city", label: "Město" },
  { id: "location_type", label: "Typ lokace" },
  { id: "exception_code", label: "Kód výjimky" },
];

const OPERATORS = [
  { id: "eq", label: "=" },
  { id: "contains", label: "obsahuje" },
  { id: "in", label: "je jedním z" },
  { id: "not", label: "není" },
];

type RightPanelMode = "checkpoint_config" | "new_milestone_type";

interface NewMilestoneTypeFormProps {
  onSave: (typeId: string) => void;
  onCancel: () => void;
}

export function SegmentEditorPage({ segmentId }: { segmentId: string }) {
  const segments = useSegments();
  const checkpointTypes = useCheckpointTypes();
  const segment = segments.find((s) => s.id === segmentId);

  const [selectedCheckpointIdx, setSelectedCheckpointIdx] = useState<number | null>(
    segment && segment.checkpoints.length > 0 ? 0 : null
  );
  const [rightPanel, setRightPanel] = useState<RightPanelMode>("checkpoint_config");
  const [libSearch, setLibSearch] = useState("");

  const usage = milestoneTypeUsage(segments);

  if (!segment) {
    return (
      <div className="flex h-screen w-screen flex-col bg-background text-foreground">
        <AppHeader current="routes" />
        <div className="p-8 text-sm text-muted-foreground">Úsek nenalezen.</div>
      </div>
    );
  }

  const typeName = (id: string) => checkpointTypes.find((t) => t.id === id)?.name ?? id;
  const selectedCp: Checkpoint | null = selectedCheckpointIdx !== null
    ? segment.checkpoints[selectedCheckpointIdx] ?? null
    : null;

  function addMilestone(checkpointTypeId: string) {
    const newCp: Checkpoint = {
      id: "cp_" + Date.now(),
      checkpointTypeId,
      match: {},
      correctness: [],
    };
    const updated = { ...segment!, checkpoints: [...segment!.checkpoints, newCp] };
    segmentsStore.upsert(updated);
    setSelectedCheckpointIdx(updated.checkpoints.length - 1);
    setRightPanel("checkpoint_config");
  }

  function removeCheckpoint(idx: number) {
    const updated = { ...segment!, checkpoints: segment!.checkpoints.filter((_, i) => i !== idx) };
    segmentsStore.upsert(updated);
    setSelectedCheckpointIdx((prev) => (prev === null ? null : Math.min(prev, updated.checkpoints.length - 1)));
  }

  function updateCheckpoint(idx: number, cp: Checkpoint) {
    const updated = {
      ...segment!,
      checkpoints: segment!.checkpoints.map((c, i) => (i === idx ? cp : c)),
    };
    segmentsStore.upsert(updated);
  }

  const filteredTypes = checkpointTypes.filter((t) =>
    !libSearch || t.name.toLowerCase().includes(libSearch.toLowerCase())
  );

  return (
    <div className="flex h-screen w-screen flex-col bg-background text-foreground">
      <AppHeader current="routes" />

      <div className="flex flex-1 min-h-0">
        {/* LEFT — Basic info */}
        <div className="flex w-[260px] shrink-0 flex-col border-r border-border">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Základní info</div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Název úseku</label>
              <input
                value={segment.name}
                onChange={(e) => segmentsStore.upsert({ ...segment, name: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Popis (volitelný)</label>
              <textarea
                value={segment.description ?? ""}
                onChange={(e) => segmentsStore.upsert({ ...segment, description: e.target.value || undefined })}
                rows={3}
                placeholder="Krátký popis…"
                className="w-full resize-none rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Dopravci</label>
              <div className="flex flex-wrap gap-1.5">
                {segment.carriers.map((c) => (
                  <span key={c} className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs">
                    {c}
                    <button
                      onClick={() => segmentsStore.upsert({ ...segment, carriers: segment.carriers.filter((x) => x !== c) })}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
                <button className="flex items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-0.5 text-xs text-muted-foreground hover:bg-muted transition-colors">
                  <Plus className="size-3" /> přidat
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Typ služby</label>
              <div className="flex flex-wrap gap-1.5">
                {segment.serviceTypes.map((t) => (
                  <span key={t} className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs">
                    {t}
                    <button
                      onClick={() => segmentsStore.upsert({ ...segment, serviceTypes: segment.serviceTypes.filter((x) => x !== t) })}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
                <button className="flex items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-0.5 text-xs text-muted-foreground hover:bg-muted transition-colors">
                  <Plus className="size-3" /> přidat
                </button>
              </div>
            </div>
          </div>

          {/* Save */}
          <div className="border-t border-border p-4 space-y-2">
            <Link
              to="/trasy"
              className="block w-full rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Uložit úsek
            </Link>
            <Link
              to="/trasy"
              className="block w-full rounded-lg border border-border px-4 py-2 text-center text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              ← Zpět na trasy
            </Link>
          </div>
        </div>

        {/* MIDDLE — Milníky + knihovna */}
        <div className="flex flex-1 min-w-0 flex-col border-r border-border">
          <div className="flex-1 overflow-y-auto p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Milníky úseku ({segment.checkpoints.length})
            </div>

            {/* Milestones list */}
            <div className="flex flex-col gap-1.5 mb-6">
              {segment.checkpoints.length === 0 && (
                <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground italic text-center">
                  Zatím žádné milníky.
                </div>
              )}
              {segment.checkpoints.map((cp, idx) => {
                const name = typeName(cp.checkpointTypeId);
                const matchCount = Object.values(cp.match).filter((v) =>
                  v !== undefined && (Array.isArray(v) ? v.length > 0 : true)
                ).length;
                const isSelected = selectedCheckpointIdx === idx && rightPanel === "checkpoint_config";

                return (
                  <button
                    key={cp.id}
                    onClick={() => { setSelectedCheckpointIdx(idx); setRightPanel("checkpoint_config"); }}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                      isSelected ? "border-primary bg-primary-soft/30 text-primary" : "border-border hover:bg-muted/40"
                    )}
                  >
                    <span className="tabular-nums text-xs text-muted-foreground shrink-0">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{name}</div>
                      <div className="text-xs text-muted-foreground">
                        {matchCount} podmínek
                        {cp.expectedDurationHours && ` · ${cp.expectedDurationHours} h`}
                      </div>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    <button
                      onClick={(e) => { e.stopPropagation(); removeCheckpoint(idx); }}
                      className="shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground transition-opacity"
                    >
                      <X className="size-4" />
                    </button>
                  </button>
                );
              })}
            </div>

            {/* Separator */}
            <div className="border-t border-border my-4" />
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Přidat milník</div>

            {/* Library search */}
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input
                value={libSearch}
                onChange={(e) => setLibSearch(e.target.value)}
                placeholder="Hledat v knihovně…"
                className="w-full rounded-md border border-border bg-background pl-8 pr-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Milestone type list */}
            <div className="flex flex-col gap-1">
              {filteredTypes.map((t) => (
                <div key={t.id} className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-muted/40 transition-colors">
                  <span className="flex-1 text-sm">{t.name}</span>
                  <span className="text-xs text-muted-foreground">{usage.get(t.id) ?? 0}×</span>
                  <button
                    onClick={() => addMilestone(t.id)}
                    className="shrink-0 text-primary hover:text-primary/80 text-xs font-medium"
                  >
                    + přidat
                  </button>
                </div>
              ))}
            </div>

            {/* Create new type */}
            <button
              onClick={() => setRightPanel("new_milestone_type")}
              className="mt-3 flex w-full items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-primary hover:bg-primary-soft/20 transition-colors"
            >
              <Plus className="size-4" /> Vytvořit nový typ milníku
            </button>
          </div>
        </div>

        {/* RIGHT — Config or new type form */}
        <div className="flex w-[360px] shrink-0 flex-col overflow-y-auto">
          {rightPanel === "new_milestone_type" && (
            <NewMilestoneTypeForm
              onSave={(typeId) => { addMilestone(typeId); }}
              onCancel={() => setRightPanel("checkpoint_config")}
            />
          )}

          {rightPanel === "checkpoint_config" && selectedCp !== null && selectedCheckpointIdx !== null && (
            <CheckpointConfig
              cp={selectedCp}
              index={selectedCheckpointIdx}
              label={typeName(selectedCp.checkpointTypeId)}
              onChange={(updated) => updateCheckpoint(selectedCheckpointIdx, updated)}
            />
          )}

          {rightPanel === "checkpoint_config" && selectedCp === null && (
            <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground text-center">
              Vyber milník ze seznamu pro zobrazení konfigurace.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── New Milestone Type Form ────────────────────────────── */

function NewMilestoneTypeForm({ onSave, onCancel }: NewMilestoneTypeFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const id = "ct_" + Date.now();
    checkpointTypesStore.upsert({ id, name: trimmed, description: description.trim() || undefined });
    onSave(id);
  }

  return (
    <div className="p-5 space-y-4">
      <div>
        <div className="text-sm font-semibold mb-0.5">Nový typ milníku</div>
        <div className="text-xs text-muted-foreground">Po uložení se milník automaticky přidá do úseku.</div>
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Název *</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Např. Celní odbavení výstupní"
          autoFocus
          className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Popis (volitelný)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Krátký popis milníku…"
          className="w-full resize-none rounded-md border border-border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={!name.trim()}
          className={cn(
            "flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            name.trim() ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          Uložit typ milníku
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
        >
          Zrušit
        </button>
      </div>
    </div>
  );
}

/* ─── Checkpoint Config ──────────────────────────────────── */

interface MatchRow {
  id: string;
  field: string;
  operator: string;
  value: string;
}

function CheckpointConfig({
  cp, index, label, onChange,
}: {
  cp: Checkpoint;
  index: number;
  label: string;
  onChange: (updated: Checkpoint) => void;
}) {
  const [matchRows, setMatchRows] = useState<MatchRow[]>(() => buildMatchRows(cp));

  function buildMatchRows(cp: Checkpoint): MatchRow[] {
    const rows: MatchRow[] = [];
    for (const [field, value] of Object.entries(cp.match)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value) && value.length === 0) continue;
      rows.push({
        id: "mr_" + field,
        field,
        operator: "eq",
        value: Array.isArray(value) ? value.join(", ") : String(value),
      });
    }
    return rows;
  }

  function applyRows(rows: MatchRow[]) {
    setMatchRows(rows);
    const match: Checkpoint["match"] = {};
    for (const row of rows) {
      if (row.field === "latest" || row.field === "zip_matches_destination") {
        (match as any)[row.field] = row.value === "true";
      } else {
        (match as any)[row.field] = row.value.split(",").map((v) => v.trim()).filter(Boolean);
      }
    }
    onChange({ ...cp, match });
  }

  function addRow() {
    applyRows([...matchRows, { id: "mr_" + Date.now(), field: "status", operator: "eq", value: "" }]);
  }

  function removeRow(id: string) {
    applyRows(matchRows.filter((r) => r.id !== id));
  }

  function updateRow(id: string, patch: Partial<MatchRow>) {
    applyRows(matchRows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  return (
    <div className="p-5 space-y-5">
      {/* Header */}
      <div>
        <div className="text-xs text-muted-foreground">Milník {index + 1}</div>
        <div className="text-sm font-semibold mt-0.5">{label}</div>
      </div>

      {/* Match conditions */}
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Match podmínky
        </div>
        <div className="text-xs text-muted-foreground mb-2">Jak poznáme, že milník nastal</div>
        <div className="flex flex-col gap-2">
          {matchRows.map((row) => (
            <div key={row.id} className="flex items-center gap-1.5">
              <select
                value={row.field}
                onChange={(e) => updateRow(row.id, { field: e.target.value })}
                className="rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none"
              >
                {MATCH_FIELDS.map((f) => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </select>
              <select
                value={row.operator}
                onChange={(e) => updateRow(row.id, { operator: e.target.value })}
                className="rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none"
              >
                {OPERATORS.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
              <input
                value={row.value}
                onChange={(e) => updateRow(row.id, { value: e.target.value })}
                placeholder="hodnota"
                className="flex-1 rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none"
              />
              <button onClick={() => removeRow(row.id)} className="text-muted-foreground hover:text-foreground">
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={addRow}
          className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <Plus className="size-3" /> přidat podmínku
        </button>
      </div>

      {/* Duration thresholds */}
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Trvání na milníku
        </div>

        {/* Očekávané trvání */}
        <div className="flex items-center gap-2 mb-4">
          <span className="size-2.5 rounded-full bg-green-500 shrink-0" />
          <span className="text-xs font-medium w-28 shrink-0">Očekávané trvání</span>
          <span className="text-xs text-muted-foreground">do</span>
          <input
            type="number"
            value={cp.expectedDurationHours ?? ""}
            onChange={(e) => onChange({ ...cp, expectedDurationHours: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="—"
            className="w-14 rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none"
          />
          <span className="text-xs text-muted-foreground">hodin</span>
        </div>

        {/* Visual axis */}
        {(cp.expectedDurationHours || cp.warnAfterHours || cp.criticalAfterHours) && (
          <div className="relative h-6 mb-3 mx-2">
            <div className="absolute inset-x-0 top-3 h-1.5 rounded-full bg-gradient-to-r from-green-400 via-amber-400 to-red-500 opacity-70" />
            {cp.expectedDurationHours && (
              <div
                className="absolute top-0 text-[9px] font-semibold text-green-600"
                style={{ left: "33%" }}
              >
                {cp.expectedDurationHours} h
              </div>
            )}
            {cp.warnAfterHours && (
              <div
                className="absolute top-0 text-[9px] font-semibold text-amber-600"
                style={{ left: "62%" }}
              >
                {cp.warnAfterHours} h
              </div>
            )}
            <div className="absolute bottom-0 left-[16%] text-[9px] text-green-600">v pořádku</div>
            <div className="absolute bottom-0 left-[45%] text-[9px] text-amber-600">dlouho</div>
            <div className="absolute bottom-0 left-[75%] text-[9px] text-red-600">kriticky</div>
          </div>
        )}

        {/* Warn threshold */}
        <div className="flex items-center gap-2 mb-3">
          <span className="size-2.5 rounded-full bg-amber-500 shrink-0" />
          <span className="text-xs font-medium w-28 shrink-0">Dlouho od</span>
          <input
            type="number"
            value={cp.warnAfterHours ?? ""}
            onChange={(e) => onChange({ ...cp, warnAfterHours: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="—"
            className="w-14 rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none"
          />
          <span className="text-xs text-muted-foreground">hodin</span>
        </div>

        {/* Critical threshold */}
        <div className="flex items-center gap-2 mb-3">
          <span className="size-2.5 rounded-full bg-red-500 shrink-0" />
          <span className="text-xs font-medium w-28 shrink-0">Kriticky od</span>
          <input
            type="number"
            value={cp.criticalAfterHours ?? ""}
            onChange={(e) => onChange({ ...cp, criticalAfterHours: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="—"
            className="w-14 rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none"
          />
          <span className="text-xs text-muted-foreground">hodin</span>
        </div>

        {(cp.expectedDurationHours || cp.warnAfterHours || cp.criticalAfterHours) && (
          <div className="rounded-md bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground leading-relaxed">
            Pásmo <strong>Dlouho</strong> = od {cp.expectedDurationHours ?? "?"} h do {cp.warnAfterHours ?? "?"} h.
            Pásmo <strong>Kriticky dlouho</strong> = od {cp.warnAfterHours ?? "?"} h dál.
          </div>
        )}
      </div>

      {/* Správnost */}
      <div>
        <div className="flex items-center gap-1.5 mb-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Jak má správně proběhnout
          </div>
          <span className="text-[10px] text-muted-foreground">· volitelné</span>
        </div>

        {(cp.correctness ?? []).length === 0 && (
          <div className="rounded-lg border border-dashed border-border px-3 py-3 text-xs text-muted-foreground italic mb-2">
            Přidej pravidlo pro hlídání časování tohoto milníku.
          </div>
        )}

        {(cp.correctness ?? []).map((rule, idx) => (
          <CorrectnessRuleCard
            key={rule.id}
            rule={rule}
            onChange={(updated) => {
              const all = [...(cp.correctness ?? [])];
              all[idx] = updated;
              onChange({ ...cp, correctness: all });
            }}
            onRemove={() => {
              onChange({ ...cp, correctness: (cp.correctness ?? []).filter((_, i) => i !== idx) });
            }}
          />
        ))}

        <button
          onClick={() => {
            const newRule: CheckpointCorrectness = {
              id: "cor_" + Date.now(),
              operator: "within",
              anchorKind: "date_event",
              anchorLabel: "Vyzvednutí zásilky",
              anchorCheckpointTypeId: "sys_pickup",
              value: 2,
              unit: "h",
            };
            onChange({ ...cp, correctness: [...(cp.correctness ?? []), newRule] });
          }}
          className="mt-1 flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <Plus className="size-3" /> přidat pravidlo správnosti
        </button>
      </div>
    </div>
  );
}

const SYS_DATE_OPTIONS = [
  { id: "sys_created", label: "Vytvoření zásilky" },
  { id: "sys_pickup", label: "Vyzvednutí zásilky" },
  { id: "sys_order_created", label: "Vytvoření objednávky" },
  { id: "sys_add", label: "Avizované doručení zákazníkovi (ADD)" },
  { id: "sys_carrier_delivery", label: "Doručení hlášené dopravcem" },
];

function CorrectnessRuleCard({
  rule, onChange, onRemove,
}: {
  rule: CheckpointCorrectness;
  onChange: (r: CheckpointCorrectness) => void;
  onRemove: () => void;
}) {
  const checkpointTypes = useCheckpointTypes();
  const [anchorOpen, setAnchorOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAnchorOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function selectAnchor(id: string, label: string, kind: "checkpoint" | "date_event") {
    onChange({ ...rule, anchorCheckpointTypeId: id, anchorLabel: label, anchorKind: kind });
    setAnchorOpen(false);
  }

  return (
    <div className="mb-3 rounded-lg border border-border bg-background p-3 space-y-3">
      {/* Row 1: Mělo by proběhnout [op] [value] [unit] od */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground text-xs shrink-0">Mělo by proběhnout</span>
        <select
          value={rule.operator}
          onChange={(e) => onChange({ ...rule, operator: e.target.value as CheckpointCorrectness["operator"] })}
          className="rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
        >
          <option value="within">do</option>
          <option value="longer_than">déle než</option>
          <option value="exact">přesně</option>
        </select>
        <input
          type="number"
          value={rule.value ?? ""}
          onChange={(e) => onChange({ ...rule, value: e.target.value ? Number(e.target.value) : undefined })}
          placeholder="—"
          className="w-12 rounded-md border border-border bg-background px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary/40"
        />
        <select
          value={rule.unit ?? "h"}
          onChange={(e) => onChange({ ...rule, unit: e.target.value as CheckpointCorrectness["unit"] })}
          className="rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
        >
          <option value="h">hod</option>
          <option value="d">dní</option>
          <option value="bd">prac. dní</option>
        </select>
        <span className="text-muted-foreground text-xs shrink-0">od</span>
      </div>

      {/* Anchor selector */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setAnchorOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-muted/30 transition-colors"
        >
          <span className={rule.anchorLabel ? "text-foreground" : "text-muted-foreground"}>
            {rule.anchorLabel || "Vyber kotvu…"}
          </span>
          <ChevronDown className="size-4 text-muted-foreground shrink-0" />
        </button>

        {anchorOpen && (
          <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg">
            {/* Milníky trasy */}
            <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
              Jiný milník trasy
            </div>
            <div className="py-1">
              {checkpointTypes.map((ct) => (
                <button
                  key={ct.id}
                  onClick={() => selectAnchor(ct.id, ct.name, "checkpoint")}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted/50 transition-colors text-left"
                >
                  <MapPin className="size-4 text-muted-foreground shrink-0" />
                  <span className="flex-1">{ct.name}</span>
                  {rule.anchorCheckpointTypeId === ct.id && <Check className="size-4 text-primary shrink-0" />}
                </button>
              ))}
            </div>

            {/* Systémová data */}
            <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-t border-border border-b">
              Datum události · systémová data i pole, na jednom místě
            </div>
            <div className="py-1">
              {SYS_DATE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => selectAnchor(opt.id, opt.label, "date_event")}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted/50 transition-colors text-left",
                    rule.anchorCheckpointTypeId === opt.id && "bg-primary/5 text-primary"
                  )}
                >
                  <Calendar className={cn("size-4 shrink-0", rule.anchorCheckpointTypeId === opt.id ? "text-primary" : "text-muted-foreground")} />
                  <span className="flex-1">{opt.label}</span>
                  {rule.anchorCheckpointTypeId === opt.id && <Check className="size-4 text-primary shrink-0" />}
                </button>
              ))}
              <button className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-primary hover:bg-muted/50 transition-colors text-left">
                <Clock className="size-4 shrink-0" />
                <span className="flex-1">...v konkrétní čas v daný den</span>
                <ChevronRight className="size-4 shrink-0" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Advanced */}
      {advancedOpen && (
        <div className="space-y-2">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Aspekt (volitelné)</label>
            <input
              type="text"
              value={rule.aspect ?? ""}
              onChange={(e) => onChange({ ...rule, aspect: e.target.value || undefined })}
              placeholder="např. timestamp_actual"
              className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Footer actions */}
      <div className="flex items-center justify-between pt-1 border-t border-border">
        <button
          onClick={() => setAdvancedOpen((v) => !v)}
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <ChevronDown className={cn("size-3 transition-transform", advancedOpen && "rotate-180")} />
          pokročilé
        </button>
        <button
          onClick={onRemove}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="size-3" /> odebrat časové očekávání
        </button>
      </div>
    </div>
  );
}
