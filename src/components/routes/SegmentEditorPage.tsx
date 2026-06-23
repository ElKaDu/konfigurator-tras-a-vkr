import { useState, useRef, useEffect } from "react";
import { Search, Plus, X, ChevronRight, ChevronDown, ChevronUp, MapPin, Calendar, Clock, Check } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { Textarea } from "@/components/ui/textarea";
import { useSegments, useCheckpointTypes, segmentsStore, checkpointTypesStore, isCheckpointTypeUsed } from "@/lib/model/store";
import { Trash2 } from "lucide-react";
import { milestoneTypeUsage } from "@/lib/model/routeAssembly";
import { cn } from "@/lib/utils";
import { TRANSPORT_VARIANTS } from "@/lib/routes/types";
import type { Checkpoint, CheckpointType } from "@/lib/model/types";

const CARRIER_OPTIONS = ["FedEx", "UPS", "DHL", "PPL", "GLS"];

const MATCH_FIELDS = [
  { id: "status", label: "Status" },
  { id: "status_code", label: "Kód statusu" },
  { id: "location_country_code", label: "Země" },
  { id: "location_postal_code", label: "PSČ" },
  { id: "location_city", label: "Město" },
  { id: "location_type", label: "Typ lokace" },
  { id: "exception_code", label: "Kód výjimky" },
  { id: "event_time_of_day", label: "Čas uvedený na záznamu" },
];


const OPERATORS = [
  { id: "eq", label: "=" },
  { id: "contains", label: "obsahuje" },
  { id: "in", label: "je jedním z" },
  { id: "not", label: "není" },
];

const TIMEZONE_OPTIONS: { value: string; label: string; hint?: string }[] = [
  { value: "local", label: "Místní čas", hint: "odvozeno z cílové země zásilky" },
  { value: "Europe/Prague", label: "Europe/Prague" },
  { value: "Europe/Berlin", label: "Europe/Berlin" },
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "America/New_York" },
];

const TIME_UNITS_OFFSET = [
  { id: "min", label: "min" },
  { id: "h", label: "h" },
  { id: "d", label: "dní" },
  { id: "bd", label: "prac. dní" },
];


type RightPanelMode = "checkpoint_config" | "new_milestone_type" | "edit_milestone_type";

interface NewMilestoneTypeFormProps {
  onSave: (typeId: string) => void;
  onCancel: () => void;
}

export function SegmentEditorPage({ segmentId, fromRouteId }: { segmentId: string; fromRouteId?: string | null }) {
  const segments = useSegments();
  const checkpointTypes = useCheckpointTypes();
  const segment = segments.find((s) => s.id === segmentId);
  const navigate = useNavigate();

  function handleSaveSegment() {
    toast.success("Úsek uložen");
    if (fromRouteId) navigate({ to: "/trasa/$id", params: { id: fromRouteId } });
    else navigate({ to: "/trasy" });
  }


  const [selectedCheckpointIdx, setSelectedCheckpointIdx] = useState<number | null>(
    segment && segment.checkpoints.length > 0 ? 0 : null
  );
  const [rightPanel, setRightPanel] = useState<RightPanelMode>("checkpoint_config");
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [libSearch, setLibSearch] = useState("");

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const usage = milestoneTypeUsage(segments);

  if (!mounted) {
    return (
      <div className="flex h-screen w-screen flex-col bg-background text-foreground">
        <AppHeader current="routes" />
      </div>
    );
  }

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
                {CARRIER_OPTIONS.map((c) => {
                  const selected = segment.carriers.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() =>
                        segmentsStore.upsert({
                          ...segment,
                          carriers: selected
                            ? segment.carriers.filter((x) => x !== c)
                            : [...segment.carriers, c],
                        })
                      }
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs transition-colors border",
                        selected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Typ služby</label>
              <div className="flex flex-wrap gap-1.5">
                {TRANSPORT_VARIANTS.map((v) => {
                  const selected = segment.serviceTypes.includes(v.value);
                  return (
                    <button
                      key={v.value}
                      type="button"
                      onClick={() =>
                        segmentsStore.upsert({
                          ...segment,
                          serviceTypes: selected
                            ? segment.serviceTypes.filter((x) => x !== v.value)
                            : [...segment.serviceTypes, v.value],
                        })
                      }
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs transition-colors border",
                        selected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {v.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Save */}
          <div className="border-t border-border p-4 space-y-2">
            <button
              onClick={handleSaveSegment}
              className="block w-full rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Uložit úsek
            </button>
            {fromRouteId ? (
              <Link
                to="/trasa/$id"
                params={{ id: fromRouteId }}
                className="block w-full rounded-lg border border-border px-4 py-2 text-center text-sm text-muted-foreground hover:bg-muted transition-colors"
              >
                ← Zpět na trasu
              </Link>
            ) : (
              <Link
                to="/trasy"
                className="block w-full rounded-lg border border-border px-4 py-2 text-center text-sm text-muted-foreground hover:bg-muted transition-colors"
              >
                ← Zpět na trasy
              </Link>
            )}
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
                const moveCp = (dir: -1 | 1) => {
                  const next = [...segment.checkpoints];
                  const j = idx + dir;
                  if (j < 0 || j >= next.length) return;
                  [next[idx], next[j]] = [next[j], next[idx]];
                  segmentsStore.upsert({ ...segment, checkpoints: next });
                  if (selectedCheckpointIdx === idx) setSelectedCheckpointIdx(j);
                  else if (selectedCheckpointIdx === j) setSelectedCheckpointIdx(idx);
                };

                return (
                  <div
                    key={cp.id}
                    onClick={() => { setSelectedCheckpointIdx(idx); setRightPanel("checkpoint_config"); }}
                    className={cn(
                      "group flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left cursor-pointer transition-colors",
                      isSelected ? "border-primary bg-primary-soft/30 text-primary" : "border-border hover:bg-muted/40"
                    )}
                  >
                    <span className="tabular-nums text-xs text-muted-foreground shrink-0">{idx + 1}</span>
                    <div className="flex flex-col shrink-0">
                      <button
                        disabled={idx === 0}
                        onClick={(e) => { e.stopPropagation(); moveCp(-1); }}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Posunout nahoru"
                      >
                        <ChevronUp className="size-3.5" />
                      </button>
                      <button
                        disabled={idx === segment.checkpoints.length - 1}
                        onClick={(e) => { e.stopPropagation(); moveCp(1); }}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Posunout dolů"
                      >
                        <ChevronDown className="size-3.5" />
                      </button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{name}</div>
                      <div className="text-xs text-muted-foreground">
                        {matchCount} podmínek
                      </div>

                    </div>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    <button
                      onClick={(e) => { e.stopPropagation(); removeCheckpoint(idx); }}
                      className="shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground transition-opacity"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
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
              {filteredTypes.map((t) => {
                const { used, count } = isCheckpointTypeUsed(t.id);
                const isEditing = rightPanel === "edit_milestone_type" && editingTypeId === t.id;
                return (
                  <div
                    key={t.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setEditingTypeId(t.id);
                      setRightPanel("edit_milestone_type");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setEditingTypeId(t.id);
                        setRightPanel("edit_milestone_type");
                      }
                    }}
                    className={cn(
                      "group flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition-colors",
                      isEditing ? "bg-primary-soft/30 ring-1 ring-primary/30" : "hover:bg-muted/40"
                    )}
                  >
                    <span className="flex-1 text-sm">{t.name}</span>
                    <span className="text-xs text-muted-foreground">{usage.get(t.id) ?? 0}×</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); addMilestone(t.id); }}
                      className="shrink-0 text-primary hover:text-primary/80 text-xs font-medium"
                    >
                      + přidat
                    </button>
                    <button
                      disabled={used}
                      onClick={(e) => { e.stopPropagation(); checkpointTypesStore.remove(t.id); }}
                      title={used ? `Používá se v ${count} ${count === 1 ? "úseku" : "úsecích"}` : "Smazat typ milníku"}
                      className={cn(
                        "shrink-0 opacity-0 group-hover:opacity-100 rounded p-0.5 transition-all",
                        used ? "text-muted-foreground/30 cursor-not-allowed" : "text-muted-foreground hover:text-red-500"
                      )}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                );
              })}
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
        <div className="flex w-[460px] shrink-0 flex-col overflow-y-auto">
          {rightPanel === "new_milestone_type" && (
            <NewMilestoneTypeForm
              onSave={(typeId) => { addMilestone(typeId); }}
              onCancel={() => setRightPanel("checkpoint_config")}
            />
          )}


          {rightPanel === "edit_milestone_type" && editingTypeId && (
            <EditMilestoneTypeForm
              key={editingTypeId}
              type={checkpointTypes.find((t) => t.id === editingTypeId)!}
              usageCount={usage.get(editingTypeId) ?? 0}
              onDone={() => { setRightPanel("checkpoint_config"); setEditingTypeId(null); }}
            />
          )}

          {rightPanel === "checkpoint_config" && selectedCp !== null && selectedCheckpointIdx !== null && (
            <CheckpointConfig
              key={selectedCp.id}
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

/* ─── Edit Milestone Type Form ───────────────────────────── */

function EditMilestoneTypeForm({
  type, usageCount, onDone,
}: {
  type: CheckpointType;
  usageCount: number;
  onDone: () => void;
}) {
  const [name, setName] = useState(type.name);
  const [description, setDescription] = useState(type.description ?? "");

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    checkpointTypesStore.upsert({ ...type, name: trimmed, description: description.trim() || undefined });
    onDone();
  }

  return (
    <div className="p-5 space-y-4">
      <div>
        <div className="text-sm font-semibold mb-0.5">Upravit typ milníku</div>
        <div className="text-xs text-muted-foreground">
          {usageCount > 0
            ? `Změna se projeví ve všech ${usageCount} úsecích, kde se používá.`
            : "Tento typ zatím není použit v žádném úseku."}
        </div>
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Název *</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
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
          Uložit změny
        </button>
        <button
          onClick={onDone}
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
  // jen pro event_time_of_day:
  timeMode?: "fixed" | "offset";
  tz?: string;
  // offset mode — odstup od události:
  offsetValue?: number;
  offsetUnit?: "min" | "h" | "d" | "bd";
  offsetDirection?: "before" | "after";
  anchorKind?: "checkpoint" | "system_event";
  anchorId?: string;
  anchorLabel?: string;
  // fixed mode — konkrétní den a čas:
  dayAnchorKind?: "today" | "checkpoint" | "system_event";
  dayAnchorId?: string;
  dayAnchorLabel?: string;
  dayOffset?: number;
  dayMode?: "calendar" | "business";
  dayDirection?: "before" | "after";
}

const SYS_DATE_OPTIONS = [
  { id: "sys_created", label: "Vytvoření zásilky" },
  { id: "sys_pickup", label: "Vyzvednutí zásilky" },
  { id: "sys_order_created", label: "Vytvoření objednávky" },
  { id: "sys_add", label: "Avizované doručení zákazníkovi (ADD)" },
  { id: "sys_carrier_delivery", label: "Doručení hlášené dopravcem" },
];

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
      if (field === "event_time_of_day" && typeof value === "object") {
        const etod = value as {
          mode?: "fixed" | "offset";
          op?: string; from?: string; to?: string; tz?: string;
          offsetOp?: string; offsetValue?: number; offsetUnit?: "min" | "h" | "d" | "bd";
          offsetDirection?: "before" | "after";
          anchorKind?: "checkpoint" | "system_event"; anchorId?: string; anchorLabel?: string;
          dayAnchorKind?: "today" | "checkpoint" | "system_event"; dayAnchorId?: string; dayAnchorLabel?: string;
          dayOffset?: number; dayMode?: "calendar" | "business"; dayDirection?: "before" | "after";
        };
        const mode = etod.mode ?? "fixed";
        if (mode === "offset") {
          rows.push({
            id: "mr_" + field,
            field, operator: etod.offsetOp ?? "within",
            value: String(etod.offsetValue ?? ""),
            timeMode: "offset",
            offsetValue: etod.offsetValue, offsetUnit: etod.offsetUnit ?? "h",
            offsetDirection: etod.offsetDirection ?? "after",
            anchorKind: etod.anchorKind ?? "system_event",
            anchorId: etod.anchorId, anchorLabel: etod.anchorLabel,
          });
        } else {
          rows.push({
            id: "mr_" + field,
            field, operator: "before",
            value: etod.from || "",
            timeMode: "fixed",
            tz: etod.tz ?? "local",
            dayAnchorKind: etod.dayAnchorKind ?? "today",
            dayAnchorId: etod.dayAnchorId,
            dayAnchorLabel: etod.dayAnchorLabel,
            dayOffset: etod.dayOffset ?? 0,
            dayMode: etod.dayMode ?? "calendar",
            dayDirection: etod.dayDirection ?? "after",
          });
        }
        continue;
      }
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
        (match as Record<string, unknown>)[row.field] = row.value === "true";
      } else if (row.field === "event_time_of_day") {
        if (row.timeMode === "offset") {
          (match as Record<string, unknown>).event_time_of_day = {
            mode: "offset",
            offsetOp: row.operator,
            offsetValue: row.offsetValue,
            offsetUnit: row.offsetUnit,
            offsetDirection: row.offsetDirection,
            anchorKind: row.anchorKind,
            anchorId: row.anchorId,
            anchorLabel: row.anchorLabel,
          };
        } else {
          (match as Record<string, unknown>).event_time_of_day = {
            mode: "fixed",
            op: "before",
            from: row.value,
            tz: row.tz ?? "local",
            dayAnchorKind: row.dayAnchorKind ?? "today",
            dayAnchorId: row.dayAnchorId,
            dayAnchorLabel: row.dayAnchorLabel,
            dayOffset: row.dayOffset ?? 0,
            dayMode: row.dayMode ?? "calendar",
            dayDirection: row.dayDirection ?? "after",
          };
        }
      } else {
        (match as Record<string, unknown>)[row.field] = row.value.split(",").map((v) => v.trim()).filter(Boolean);
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
    <div className="p-5 space-y-6">
      {/* Header */}
      <div>
        <div className="text-xs text-muted-foreground">Milník {index + 1}</div>
        <div className="text-sm font-semibold mt-0.5">{label}</div>
      </div>

      {/* Description */}
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Popis (volitelný)
        </div>
        <Textarea
          value={cp.note ?? ""}
          onChange={(e) => onChange({ ...cp, note: e.target.value || undefined })}
          placeholder="Krátká poznámka k nastavení tohoto milníku…"
          rows={2}
          className="resize-none text-sm"
        />
      </div>

      {/* ═══ CO MUSÍ BÝT NA ZÁZNAMU ═══ */}
      <div>
        <div className="rounded-md bg-primary-soft/40 border border-primary/20 px-3 py-1.5 mb-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-primary">
            Co musí být na záznamu
          </div>
          <div className="text-[11px] text-muted-foreground">Match podmínky — jak poznáme, že milník nastal</div>
        </div>

        <div className="flex flex-col gap-2">
          {matchRows.map((row) => {
            const isTime = row.field === "event_time_of_day";
            return (
              <div key={row.id} className="rounded-lg border border-border bg-background p-2.5 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">Pole</span>
                  <select
                    value={row.field}
                    onChange={(e) => {
                      const newField = e.target.value;
                      const switchingToTime = newField === "event_time_of_day";
                      const patch: Partial<MatchRow> = {
                        field: newField,
                        operator: switchingToTime ? "before" : "eq",
                        value: "",
                      };
                      if (switchingToTime) {
                        patch.timeMode = "fixed";
                        patch.tz = "local";
                      } else {
                        patch.timeMode = undefined;
                      }
                      updateRow(row.id, patch);
                    }}
                    className="flex-1 rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none"
                  >
                    {MATCH_FIELDS.map((f) => (
                      <option key={f.id} value={f.id}>{f.label}</option>
                    ))}
                  </select>
                  <button onClick={() => removeRow(row.id)} className="text-muted-foreground hover:text-foreground shrink-0">
                    <X className="size-3.5" />
                  </button>
                </div>

                {isTime ? (
                  <MatchTimeRow row={row} onChange={(p) => updateRow(row.id, p)} />
                ) : (
                  <div className="flex items-center gap-1.5">
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
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <button
          onClick={addRow}
          className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <Plus className="size-3" /> přidat podmínku
        </button>
      </div>



    </div>
  );
}

/* ─── Match time row — „Čas uvedený na záznamu" ─── */

function MatchTimeRow({
  row, onChange,
}: {
  row: MatchRow;
  onChange: (patch: Partial<MatchRow>) => void;
}) {
  const mode = row.timeMode ?? "fixed";
  const checkpointTypes = useCheckpointTypes();
  const [dayOpen, setDayOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const dayRef = useRef<HTMLDivElement>(null);
  const eventRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dayRef.current && !dayRef.current.contains(e.target as Node)) setDayOpen(false);
      if (eventRef.current && !eventRef.current.contains(e.target as Node)) setEventOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const dayKind = row.dayAnchorKind ?? "today";
  const dayOffset = row.dayOffset ?? 0;
  const dayLabel = dayKind === "today" ? "Dnešní den" : (row.dayAnchorLabel || "Vyber den…");

  const preview = (() => {
    if (mode === "fixed") {
      if (!row.value) return "";
      const tzLabel = (row.tz ?? "local") === "local" ? "místního času" : (row.tz ?? "");
      let dayStr: string;
      if (dayKind === "today") {
        if (dayOffset === 0) dayStr = "dnes";
        else {
          const dir = row.dayDirection === "before" ? "před" : "po";
          const word = dayOffset === 1 ? "den" : (dayOffset < 5 ? "dny" : "dní");
          dayStr = `${dayOffset} ${word} ${dir} dnešku`;
        }
      } else if (row.dayAnchorLabel) {
        if (dayOffset === 0) dayStr = `v den události „${row.dayAnchorLabel}"`;
        else {
          const dir = row.dayDirection === "before" ? "před" : "po";
          const modeWord = row.dayMode === "business" ? "prac. " : "";
          const word = dayOffset === 1 ? "den" : (dayOffset < 5 ? "dny" : "dní");
          dayStr = `${dayOffset} ${modeWord}${word} ${dir} události „${row.dayAnchorLabel}"`;
        }
      } else dayStr = "—";
      return `nejpozději ${dayStr} v ${row.value} ${tzLabel}`;
    }
    if (!row.anchorLabel || row.offsetValue == null) return "";
    const dir = row.offsetDirection === "before" ? "před" : "po";
    const unit = row.offsetUnit === "h" ? "hod" : row.offsetUnit === "min" ? "min" : row.offsetUnit === "bd" ? "prac. dní" : "dní";
    return `nejpozději ${row.offsetValue} ${unit} ${dir} události „${row.anchorLabel}"`;
  })();

  return (
    <div className="space-y-2.5">
      <div className="text-[11px] font-medium text-foreground">Musí být nejpozději:</div>

      {/* Mode toggle */}
      <div className="flex flex-col gap-1 text-xs">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="radio"
            checked={mode === "fixed"}
            onChange={() => onChange({
              timeMode: "fixed",
              operator: "before",
              value: row.value || "",
              tz: row.tz ?? "local",
              dayAnchorKind: row.dayAnchorKind ?? "today",
              dayAnchorId: row.dayAnchorId,
              dayAnchorLabel: row.dayAnchorLabel,
              dayOffset: row.dayOffset ?? 0,
              dayMode: row.dayMode ?? "calendar",
              dayDirection: row.dayDirection ?? "after",
            })}
            className="accent-primary"
          />
          v konkrétní den a čas
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="radio"
            checked={mode === "offset"}
            onChange={() => onChange({
              timeMode: "offset",
              operator: "within",
              value: "2",
              offsetValue: 2,
              offsetUnit: "h",
              offsetDirection: "after",
              anchorKind: row.anchorKind ?? "system_event",
              anchorId: row.anchorId ?? "sys_pickup",
              anchorLabel: row.anchorLabel ?? "Vyzvednutí zásilky",
            })}
            className="accent-primary"
          />
          s odstupem od události
        </label>
      </div>

      {mode === "fixed" ? (
        <div className="space-y-2.5 rounded-md border border-border bg-muted/20 p-2.5">
          {/* DEN */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
              <Calendar className="size-3" /> Den
            </div>
            <div className="relative" ref={dayRef}>
              <button
                type="button"
                onClick={() => setDayOpen((v) => !v)}
                className="flex w-full items-center justify-between rounded border border-border bg-background px-2 py-1 text-xs hover:bg-muted/30"
              >
                <span>{dayLabel}</span>
                <ChevronDown className="size-3" />
              </button>
              {dayOpen && (
                <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg overflow-hidden max-h-64 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => { onChange({ dayAnchorKind: "today", dayAnchorId: undefined, dayAnchorLabel: undefined }); setDayOpen(false); }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted/50 text-left"
                  >
                    <Calendar className="size-3 text-muted-foreground" /> Dnešní den
                  </button>
                  <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30 border-y border-border">Milníky této trasy</div>
                  {checkpointTypes.map((ct) => (
                    <button
                      key={ct.id}
                      type="button"
                      onClick={() => { onChange({ dayAnchorKind: "checkpoint", dayAnchorId: ct.id, dayAnchorLabel: ct.name }); setDayOpen(false); }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted/50 text-left"
                    >
                      <MapPin className="size-3 text-muted-foreground" /> {ct.name}
                    </button>
                  ))}
                  <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30 border-y border-border">Klíčová data zásilky</div>
                  {SYS_DATE_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => { onChange({ dayAnchorKind: "system_event", dayAnchorId: opt.id, dayAnchorLabel: opt.label }); setDayOpen(false); }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted/50 text-left"
                    >
                      <Calendar className="size-3 text-muted-foreground" /> {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Day offset */}
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              <span className="text-[10px] text-muted-foreground">Posun:</span>
              <input
                type="number"
                min={0}
                value={dayOffset}
                onChange={(e) => onChange({ dayOffset: Math.max(0, Number(e.target.value) || 0) })}
                className="w-12 rounded border border-border bg-background px-1.5 py-0.5 text-xs text-center focus:outline-none"
              />
              <span className="text-[10px] text-muted-foreground">dní</span>
              <select
                value={row.dayMode ?? "calendar"}
                onChange={(e) => onChange({ dayMode: e.target.value as "calendar" | "business" })}
                className="rounded border border-border bg-background px-1.5 py-0.5 text-xs focus:outline-none"
              >
                <option value="calendar">kalendářní</option>
                <option value="business">pracovní</option>
              </select>
              {dayOffset > 0 && (
                <select
                  value={row.dayDirection ?? "after"}
                  onChange={(e) => onChange({ dayDirection: e.target.value as "before" | "after" })}
                  className="rounded border border-border bg-background px-1.5 py-0.5 text-xs focus:outline-none"
                >
                  <option value="after">po</option>
                  <option value="before">před</option>
                </select>
              )}
            </div>
          </div>

          {/* ČAS */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
              <Clock className="size-3" /> Čas
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <input
                type="time"
                value={row.value}
                onChange={(e) => onChange({ value: e.target.value, operator: "before" })}
                className="rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none"
              />
              <span className="text-[10px] text-muted-foreground ml-1">pásmo</span>
              <TimezoneSelect value={row.tz ?? "local"} onChange={(v) => onChange({ tz: v })} />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2 rounded-md border border-border bg-muted/20 p-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <input
              type="number"
              min={0}
              value={row.offsetValue ?? ""}
              onChange={(e) => onChange({ offsetValue: e.target.value ? Number(e.target.value) : undefined, value: e.target.value })}
              className="w-14 rounded border border-border bg-background px-2 py-1 text-xs text-center focus:outline-none"
            />
            <select
              value={row.offsetUnit ?? "h"}
              onChange={(e) => onChange({ offsetUnit: e.target.value as MatchRow["offsetUnit"] })}
              className="rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none"
            >
              {TIME_UNITS_OFFSET.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
            </select>
            <select
              value={row.offsetDirection ?? "after"}
              onChange={(e) => onChange({ offsetDirection: e.target.value as "before" | "after" })}
              className="rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none"
            >
              <option value="after">po</option>
              <option value="before">před</option>
            </select>
            <span className="text-[10px] text-muted-foreground">události:</span>
          </div>
          <div className="relative" ref={eventRef}>
            <button
              type="button"
              onClick={() => setEventOpen((v) => !v)}
              className="flex w-full items-center justify-between rounded border border-border bg-background px-2 py-1 text-xs hover:bg-muted/30"
            >
              <span>{row.anchorLabel || "Vyber událost…"}</span>
              <ChevronDown className="size-3" />
            </button>
            {eventOpen && (
              <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg overflow-hidden max-h-64 overflow-y-auto">
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30 border-b border-border">Milníky této trasy</div>
                {checkpointTypes.map((ct) => (
                  <button
                    key={ct.id}
                    type="button"
                    onClick={() => { onChange({ anchorKind: "checkpoint", anchorId: ct.id, anchorLabel: ct.name }); setEventOpen(false); }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted/50 text-left"
                  >
                    <MapPin className="size-3 text-muted-foreground" /> {ct.name}
                  </button>
                ))}
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30 border-t border-b border-border">Klíčová data zásilky</div>
                {SYS_DATE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => { onChange({ anchorKind: "system_event", anchorId: opt.id, anchorLabel: opt.label }); setEventOpen(false); }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted/50 text-left"
                  >
                    <Calendar className="size-3 text-muted-foreground" /> {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Náhled */}
      {preview && (
        <div className="flex items-start gap-1.5 rounded-md bg-primary/5 border border-primary/20 px-2.5 py-1.5 text-[11px] text-primary leading-snug">
          <Check className="size-3 shrink-0 mt-0.5" />
          <div>
            <div>{preview}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {mode === "fixed"
                ? "Dřívější dny se započítávají automaticky."
                : "Může spadnout i na jiný den — to je v pořádku."}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


/* ─── Timezone select with sticky „Místní čas" ─── */

function TimezoneSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none"
      title={value === "local" ? "Odvozeno z cílové země zásilky" : value}
    >
      {TIMEZONE_OPTIONS.map((tz) => (
        <option key={tz.value} value={tz.value}>{tz.label}</option>
      ))}
    </select>
  );
}




