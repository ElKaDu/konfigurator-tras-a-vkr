import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as useNavigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { g as useRules, h as useSituations, m as useActionTags, A as AppHeader, c as cn, e as rulesStore } from "./store-CVlU6jxP.mjs";
import { T as Textarea } from "./textarea-DgXTv_qS.mjs";
import { A as ActionTagPicker, P as Popover, a as PopoverTrigger, b as PopoverContent } from "./ActionTagPicker-ClAME-lt.mjs";
import { X, P as Plus, I as Info, S as Search } from "../_libs/lucide-react.mjs";
const VKR_CONDITION_CATALOG = [
  {
    id: "carrier_announced_delivery_at",
    label: "Datum doručení dopravce",
    category: "Zásilka",
    description: "Datum doručení hlášené dopravcem v trackingu",
    operators: [
      { id: "is_today", label: "je dnes" },
      { id: "is_tomorrow", label: "je zítra" },
      {
        id: "within_days",
        label: "v rozmezí … dnů",
        needsValue: true,
        valueType: "number",
        valuePlaceholder: "3",
        valueSuffix: "dnů"
      }
    ]
  },
  {
    id: "customer.tenure",
    label: "Stálost zákazníka",
    category: "Zákazník",
    description: "Nový vs. dlouhodobý zákazník",
    operators: [
      {
        id: "is",
        label: "je",
        valueOptions: [
          { value: "new", label: "nový" },
          { value: "longterm", label: "dlouhodobý" }
        ]
      },
      {
        id: "is_not",
        label: "není",
        valueOptions: [
          { value: "new", label: "nový" },
          { value: "longterm", label: "dlouhodobý" }
        ]
      }
    ]
  }
];
function findVkrField(id) {
  return VKR_CONDITION_CATALOG.find((f) => f.id === id);
}
function findVkrOperator(fieldId, operatorId) {
  return findVkrField(fieldId)?.operators.find((o) => o.id === operatorId);
}
const DEFAULT_TIME_SPEC = {
  mode: "absolute",
  day: { kind: "fixed_date", date: "" },
  time: "10:00",
  tz: "destination"
};
const MODE_LABELS = [
  { id: "absolute", label: "Konkrétní čas" },
  { id: "since_previous", label: "Odstup od minulého záznamu" },
  { id: "since_matching", label: "Odstup od záznamu splňujícího podmínky" }
];
const DAY_KIND_LABELS = [
  { id: "fixed_date", label: "Pevné datum" },
  { id: "relative_field", label: "Relativně k poli zásilky" },
  { id: "relative_system", label: "Relativně k systémové události" },
  { id: "relative_checkpoint", label: "Relativně k checkpointu" }
];
const TRACKING_FIELDS_MINI = ["derivedStatus", "exceptionCode", "city", "countryCode", "locationId", "eventType"];
const OPS_MINI = ["je jedním z", "není žádným z", "obsahuje"];
function TrackingTimeValueEditor({
  value,
  onChange
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full rounded-lg border border-border bg-muted/30 p-2.5 space-y-2.5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1", children: MODE_LABELS.map((m) => {
      const active = value.mode === m.id;
      return /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => onChange(switchMode(m.id, value)),
          className: "rounded border px-2 py-1 text-[11px] transition-colors " + (active ? "border-primary bg-primary-soft/40 text-primary font-medium" : "border-border bg-background text-muted-foreground hover:text-foreground"),
          children: m.label
        },
        m.id
      );
    }) }),
    value.mode === "absolute" && /* @__PURE__ */ jsxRuntimeExports.jsx(AbsoluteEditor, { value, onChange }),
    value.mode === "since_previous" && /* @__PURE__ */ jsxRuntimeExports.jsx(OffsetEditor, { value, onChange }),
    value.mode === "since_matching" && /* @__PURE__ */ jsxRuntimeExports.jsx(SinceMatchingEditor, { value, onChange })
  ] });
}
function switchMode(mode, prev) {
  if (mode === prev.mode) return prev;
  if (mode === "absolute") return DEFAULT_TIME_SPEC;
  if (mode === "since_previous") return { mode, offset: { value: 2, unit: "h", dir: "longer_than" } };
  return { mode: "since_matching", offset: { value: 2, unit: "h", dir: "longer_than" }, anchorConditions: [{ id: "ac_" + Date.now(), field: "derivedStatus", operator: "je jedním z", value: "" }] };
}
function AbsoluteEditor({ value, onChange }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-1.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] text-muted-foreground", children: "Den:" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "select",
        {
          value: value.day.kind,
          onChange: (e) => onChange({ ...value, day: { ...value.day, kind: e.target.value } }),
          className: "rounded border border-border bg-background px-2 py-1 text-xs",
          children: DAY_KIND_LABELS.map((d) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: d.id, children: d.label }, d.id))
        }
      ),
      value.day.kind === "fixed_date" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          type: "date",
          value: value.day.date ?? "",
          onChange: (e) => onChange({ ...value, day: { ...value.day, date: e.target.value } }),
          className: "rounded border border-border bg-background px-2 py-1 text-xs"
        }
      ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          value: value.day.ref ?? "",
          onChange: (e) => onChange({ ...value, day: { ...value.day, ref: e.target.value } }),
          placeholder: value.day.kind === "relative_checkpoint" ? "CP …" : "pole / událost",
          className: "rounded border border-border bg-background px-2 py-1 text-xs min-w-[140px]"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-1.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] text-muted-foreground", children: "Čas:" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          type: "time",
          value: value.time,
          onChange: (e) => onChange({ ...value, time: e.target.value }),
          className: "rounded border border-border bg-background px-2 py-1 text-xs"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "select",
        {
          value: value.tz,
          onChange: (e) => onChange({ ...value, tz: e.target.value }),
          className: "rounded border border-border bg-background px-2 py-1 text-xs",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "destination", children: "TZ cíle" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "origin", children: "TZ odesílatele" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "fixed", children: "Pevná TZ" })
          ]
        }
      )
    ] })
  ] });
}
function OffsetEditor({ value, onChange }) {
  const o = value.offset;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-1.5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "select",
      {
        value: o.dir,
        onChange: (e) => onChange({ ...value, offset: { ...o, dir: e.target.value } }),
        className: "rounded border border-border bg-background px-2 py-1 text-xs",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "longer_than", children: "déle než" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "within", children: "do" })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "input",
      {
        type: "number",
        min: 0,
        value: o.value,
        onChange: (e) => onChange({ ...value, offset: { ...o, value: Number(e.target.value) || 0 } }),
        className: "w-16 rounded border border-border bg-background px-2 py-1 text-xs"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "select",
      {
        value: o.unit,
        onChange: (e) => onChange({ ...value, offset: { ...o, unit: e.target.value } }),
        className: "rounded border border-border bg-background px-2 py-1 text-xs",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "min", children: "min" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "h", children: "hod" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "d", children: "dnů" })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] text-muted-foreground", children: "od minulého záznamu" })
  ] });
}
function SinceMatchingEditor({ value, onChange }) {
  const o = value.offset;
  function updateAnchor(id, patch) {
    onChange({ ...value, anchorConditions: value.anchorConditions.map((r) => r.id === id ? { ...r, ...patch } : r) });
  }
  function addAnchor() {
    onChange({ ...value, anchorConditions: [...value.anchorConditions, { id: "ac_" + Date.now(), field: "derivedStatus", operator: "je jedním z", value: "" }] });
  }
  function removeAnchor(id) {
    if (value.anchorConditions.length <= 1) return;
    onChange({ ...value, anchorConditions: value.anchorConditions.filter((r) => r.id !== id) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-1.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "select",
        {
          value: o.dir,
          onChange: (e) => onChange({ ...value, offset: { ...o, dir: e.target.value } }),
          className: "rounded border border-border bg-background px-2 py-1 text-xs",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "longer_than", children: "déle než" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "within", children: "do" })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          type: "number",
          min: 0,
          value: o.value,
          onChange: (e) => onChange({ ...value, offset: { ...o, value: Number(e.target.value) || 0 } }),
          className: "w-16 rounded border border-border bg-background px-2 py-1 text-xs"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "select",
        {
          value: o.unit,
          onChange: (e) => onChange({ ...value, offset: { ...o, unit: e.target.value } }),
          className: "rounded border border-border bg-background px-2 py-1 text-xs",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "min", children: "min" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "h", children: "hod" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "d", children: "dnů" })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] text-muted-foreground", children: "od záznamu, který splňuje:" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded border border-dashed border-border bg-background p-2 space-y-1.5", children: [
      value.anchorConditions.map((row, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        idx > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] text-muted-foreground my-1", children: "A" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 flex-wrap", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "select",
            {
              value: row.field,
              onChange: (e) => updateAnchor(row.id, { field: e.target.value }),
              className: "rounded border border-border bg-background px-2 py-1 text-xs",
              children: TRACKING_FIELDS_MINI.map((f) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: f, children: f }, f))
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "select",
            {
              value: row.operator,
              onChange: (e) => updateAnchor(row.id, { operator: e.target.value }),
              className: "rounded border border-border bg-background px-2 py-1 text-xs",
              children: OPS_MINI.map((op) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { children: op }, op))
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              value: row.value,
              onChange: (e) => updateAnchor(row.id, { value: e.target.value }),
              placeholder: "hodnota…",
              className: "flex-1 min-w-[100px] rounded border border-border bg-background px-2 py-1 text-xs"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => removeAnchor(row.id),
              disabled: value.anchorConditions.length <= 1,
              className: "text-muted-foreground hover:text-foreground disabled:opacity-30",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "size-3.5" })
            }
          )
        ] })
      ] }, row.id)),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: addAnchor,
          className: "flex items-center gap-1 rounded border border-dashed border-border px-2 py-1 text-[11px] text-muted-foreground hover:border-primary hover:text-primary",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-3" }),
            " přidat podmínku"
          ]
        }
      )
    ] })
  ] });
}
function parseTimeSpec(value) {
  if (!value) return DEFAULT_TIME_SPEC;
  try {
    return JSON.parse(value);
  } catch {
    return DEFAULT_TIME_SPEC;
  }
}
function VkrConditionsBuilder({
  conditions,
  onChange,
  title,
  emptyText
}) {
  function addCondition(field) {
    const firstOp = field.operators[0];
    const defaultValue = firstOp?.valueOptions?.[0]?.value ?? "";
    onChange([
      ...conditions,
      {
        id: "vc_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
        fieldId: field.id,
        operator: firstOp?.id ?? "",
        value: defaultValue
      }
    ]);
  }
  function updateCondition(id, patch) {
    onChange(conditions.map((c) => c.id === id ? { ...c, ...patch } : c));
  }
  function removeCondition(id) {
    onChange(conditions.filter((c) => c.id !== id));
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-muted/10 p-3 space-y-2.5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground", children: title ?? "Podmínky zásilky" }) }),
    conditions.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-dashed border-border bg-background px-3 py-3 text-xs text-muted-foreground italic", children: emptyText ?? "Žádné podmínky — akce se spustí vždy, když nastane spouštěč." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-1.5", children: conditions.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      ConditionRow,
      {
        condition: c,
        onUpdate: (patch) => updateCondition(c.id, patch),
        onRemove: () => removeCondition(c.id)
      },
      c.id
    )) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      AddConditionButton,
      {
        usedFieldIds: conditions.map((c) => c.fieldId),
        onPick: addCondition
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-1.5 text-[10px] text-muted-foreground leading-snug pt-0.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { size: 11, className: "mt-0.5 shrink-0" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Když nejsou splněny, VkŘ se nevytvoří a akce se nespustí." })
    ] })
  ] });
}
function ConditionRow({
  condition,
  onUpdate,
  onRemove
}) {
  const field = findVkrField(condition.fieldId);
  const operator = findVkrOperator(condition.fieldId, condition.operator);
  if (!field) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-destructive/40 bg-background p-2 text-xs text-destructive flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
        "Neznámé pole: ",
        condition.fieldId
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onRemove, children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "size-3.5" }) })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-border bg-background p-2.5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 flex-wrap", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium text-foreground", children: field.label }),
    field.customValueEditor !== "tracking_time" && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "select",
      {
        value: condition.operator,
        onChange: (e) => {
          const newOp = findVkrOperator(field.id, e.target.value);
          const defaultValue = newOp?.valueOptions?.[0]?.value ?? "";
          onUpdate({ operator: e.target.value, value: defaultValue });
        },
        className: "rounded border border-border bg-background px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40",
        children: field.operators.map((op) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: op.id, children: op.label }, op.id))
      }
    ),
    field.customValueEditor === "tracking_time" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 min-w-[260px]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      TrackingTimeValueEditor,
      {
        value: parseTimeSpec(condition.value),
        onChange: (v) => onUpdate({ value: JSON.stringify(v) })
      }
    ) }),
    field.customValueEditor !== "tracking_time" && operator?.valueOptions && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "select",
      {
        value: condition.value ?? "",
        onChange: (e) => onUpdate({ value: e.target.value }),
        className: "rounded border border-border bg-background px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40",
        children: operator.valueOptions.map((v) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: v.value, children: v.label }, v.value))
      }
    ),
    field.customValueEditor !== "tracking_time" && operator?.needsValue && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          type: operator.valueType ?? "text",
          min: operator.valueType === "number" ? 1 : void 0,
          value: condition.value ?? "",
          placeholder: operator.valuePlaceholder,
          onChange: (e) => onUpdate({ value: e.target.value }),
          className: "flex-1 min-w-[120px] rounded border border-border bg-background px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
        }
      ),
      operator.valueSuffix && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] text-muted-foreground", children: operator.valueSuffix })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        onClick: onRemove,
        className: "ml-auto text-muted-foreground hover:text-foreground",
        title: "Odstranit podmínku",
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "size-3.5" })
      }
    )
  ] }) });
}
function AddConditionButton({
  usedFieldIds,
  onPick
}) {
  const [open, setOpen] = reactExports.useState(false);
  const [query, setQuery] = reactExports.useState("");
  const filtered = VKR_CONDITION_CATALOG.filter(
    (f) => (f.label + " " + f.category + " " + (f.description ?? "")).toLowerCase().includes(query.toLowerCase())
  );
  const grouped = filtered.reduce(
    (acc, f) => {
      (acc[f.category] ??= []).push(f);
      return acc;
    },
    {}
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Popover, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "flex items-center gap-1.5 rounded-lg border border-dashed border-border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-3.5" }),
      " Přidat podmínku"
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      PopoverContent,
      {
        align: "start",
        className: "w-72 p-0 overflow-hidden",
        sideOffset: 4,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 border-b border-border px-2.5 py-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "size-3.5 text-muted-foreground" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                autoFocus: true,
                value: query,
                onChange: (e) => setQuery(e.target.value),
                placeholder: "Hledat podmínku…",
                className: "flex-1 bg-transparent text-xs focus:outline-none"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-h-64 overflow-y-auto p-1", children: [
            Object.keys(grouped).length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-2 py-3 text-center text-xs text-muted-foreground", children: "Nic nenalezeno" }),
            Object.entries(grouped).map(([category, fields]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-1.5 last:mb-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground", children: category }),
              fields.map((f) => {
                const isUsed = usedFieldIds.includes(f.id);
                return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    onClick: () => {
                      onPick(f);
                      setOpen(false);
                      setQuery("");
                    },
                    className: cn(
                      "w-full rounded-md px-2 py-1.5 text-left hover:bg-muted/60",
                      isUsed && "opacity-60"
                    ),
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs font-medium flex items-center gap-1.5", children: [
                        f.label,
                        isUsed && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] uppercase tracking-wider text-muted-foreground", children: "již přidáno" })
                      ] }),
                      f.description && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] text-muted-foreground leading-snug", children: f.description })
                    ]
                  },
                  f.id
                );
              })
            ] }, category))
          ] })
        ]
      }
    )
  ] });
}
const TRACKING_FIELDS = [
  { value: "eventType", label: "Typ záznamu (eventType)", group: "Typ a status" },
  { value: "derivedStatus", label: "Odvozený status", group: "Typ a status" },
  { value: "derivedStatusCode", label: "Kód odvozeného statusu", group: "Typ a status" },
  { value: "eventDescription", label: "Popis události", group: "Typ a status" },
  { value: "exceptionCode", label: "Kód výjimky", group: "Výjimka" },
  { value: "exceptionDescription", label: "Popis výjimky", group: "Výjimka" },
  { value: "locationType", label: "Typ místa", group: "Lokace" },
  { value: "locationId", label: "ID místa", group: "Lokace" },
  { value: "city", label: "Město", group: "Lokace" },
  { value: "countryCode", label: "Kód země", group: "Lokace" },
  { value: "postalCode", label: "PSČ", group: "Lokace" },
  { value: "deliveryAttempts", label: "Počet pokusů o doručení", group: "Doručení" },
  { value: "eventTime", label: "Čas záznamu (eventTime)", group: "Čas" }
];
const REPEATABLE_FIELDS = TRACKING_FIELDS.filter(
  (f) => ["locationId", "city", "countryCode"].includes(f.value)
);
function isTrackingConditionRow(c) {
  return c.kind === "field" || c.kind === "tracking_aggregate";
}
function rowKindOf(c) {
  if (c.kind === "field") return c.operator === "není" ? "is_not" : "is";
  if (c.kind === "tracking_aggregate" && c.valueMode === "same_repeats") return "repeats";
  return "history";
}
function isHistoryCondition(c) {
  return isTrackingConditionRow(c) && rowKindOf(c) === "history";
}
function fieldIdOf(row) {
  if (row.kind === "field") return row.fieldId;
  if (row.kind === "tracking_aggregate") return row.trackingFieldId;
  return "";
}
function TrackingConditionsBuilder({
  conditions,
  onChange,
  allowCurrentRecord
}) {
  const rows = conditions.filter(isTrackingConditionRow).filter((c) => allowCurrentRecord || rowKindOf(c) === "history");
  function updateAt(index, next) {
    const target = rows[index];
    onChange(conditions.map((c) => c === target ? next : c));
  }
  function removeAt(index) {
    const target = rows[index];
    onChange(conditions.filter((c) => c !== target));
  }
  function addRow() {
    const next = allowCurrentRecord ? { kind: "field", fieldId: "derivedStatus", operator: "je", value: "" } : { kind: "tracking_aggregate", trackingFieldId: "derivedStatus", valueMode: "specific", expectedValue: "", mode: "contains", count: 1, occurrence: "any" };
    onChange([...conditions, next]);
  }
  function changeKind(index, kind) {
    const row = rows[index];
    const fieldId = fieldIdOf(row);
    if (kind === "is" || kind === "is_not") {
      updateAt(index, { kind: "field", fieldId, operator: kind === "is" ? "je" : "není", value: row.kind === "field" ? row.value ?? "" : "" });
    } else if (kind === "repeats") {
      const repeatableField = REPEATABLE_FIELDS.some((f) => f.value === fieldId) ? fieldId : REPEATABLE_FIELDS[0].value;
      updateAt(index, { kind: "tracking_aggregate", trackingFieldId: repeatableField, valueMode: "same_repeats", count: 4, occurrence: "consecutive" });
    } else {
      updateAt(index, { kind: "tracking_aggregate", trackingFieldId: fieldId, valueMode: "specific", expectedValue: "", mode: "contains", count: 1, occurrence: "any" });
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
    rows.map((row, i) => {
      const kind = rowKindOf(row);
      const fieldOptions = kind === "repeats" ? REPEATABLE_FIELDS : TRACKING_FIELDS;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border bg-background p-2.5 space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 flex-wrap", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "select",
            {
              value: fieldIdOf(row),
              onChange: (e) => {
                if (row.kind === "field") updateAt(i, { ...row, fieldId: e.target.value });
                else if (row.kind === "tracking_aggregate") updateAt(i, { ...row, trackingFieldId: e.target.value });
              },
              className: "rounded border border-border bg-background px-2 py-1.5 text-xs",
              children: fieldOptions.map((f) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: f.value, children: f.label }, f.value))
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "select",
            {
              value: kind,
              onChange: (e) => changeKind(i, e.target.value),
              className: "rounded border border-border bg-background px-2 py-1.5 text-xs",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "is", children: "je" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "is_not", children: "není" }),
                allowCurrentRecord && /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "repeats", children: "opakuje se" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "history", children: "bylo v historii" })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => removeAt(i), className: "ml-auto text-muted-foreground hover:text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "size-3.5" }) })
        ] }),
        (kind === "is" || kind === "is_not") && row.kind === "field" && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            value: row.value ?? "",
            onChange: (e) => updateAt(i, { ...row, value: e.target.value }),
            placeholder: "hodnota…",
            className: "w-full rounded border border-border bg-background px-2 py-1.5 text-xs"
          }
        ),
        kind === "repeats" && row.kind === "tracking_aggregate" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] text-muted-foreground", children: "Bez konkrétní hodnoty — hlídá, že stejná hodnota se opakuje, počítaje v to i tento nový záznam." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "number",
                min: 2,
                value: row.count,
                onChange: (e) => updateAt(i, { ...row, count: Number(e.target.value) }),
                className: "w-16 rounded border border-border bg-background px-2 py-1.5 text-xs text-center"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "po sobě jdoucích záznamů" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 text-xs", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "checkbox",
                checked: row.occurrence === "consecutive",
                onChange: (e) => updateAt(i, { ...row, occurrence: e.target.checked ? "consecutive" : "any" })
              }
            ),
            "musí být nepřerušeně"
          ] })
        ] }),
        kind === "history" && row.kind === "tracking_aggregate" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => updateAt(i, { ...row, mode: "contains" }),
                className: cn("rounded-md px-2 py-1 text-[11px] font-medium", (row.mode ?? "contains") === "contains" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"),
                children: "je"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => updateAt(i, { ...row, mode: "not_contains" }),
                className: cn("rounded-md px-2 py-1 text-[11px] font-medium", row.mode === "not_contains" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"),
                children: "není"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              value: row.expectedValue ?? "",
              onChange: (e) => updateAt(i, { ...row, expectedValue: e.target.value }),
              placeholder: "hodnota…",
              className: "w-full rounded border border-border bg-background px-2 py-1.5 text-xs"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 text-xs flex-wrap", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "radio", checked: row.count <= 1, onChange: () => updateAt(i, { ...row, count: 1 }) }),
              "v posledním záznamu"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: cn("flex items-center gap-1.5", row.count <= 1 && "opacity-40"), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "radio", checked: row.count > 1, onChange: () => updateAt(i, { ...row, count: Math.max(2, row.count) }) }),
              "v posledních",
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "number",
                  min: 2,
                  disabled: row.count <= 1,
                  value: row.count > 1 ? row.count : 2,
                  onChange: (e) => updateAt(i, { ...row, count: Math.max(2, Number(e.target.value)) }),
                  className: "w-14 rounded border border-border bg-background px-1.5 py-1 text-xs text-center"
                }
              ),
              "záznamech"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: cn("flex items-center gap-2 text-xs", row.count <= 1 && "opacity-40"), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "checkbox",
                disabled: row.count <= 1,
                checked: row.occurrence === "consecutive",
                onChange: (e) => updateAt(i, { ...row, occurrence: e.target.checked ? "consecutive" : "any" })
              }
            ),
            "musí být nepřerušeně"
          ] })
        ] })
      ] }, i);
    }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        onClick: addRow,
        className: "flex items-center gap-1 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-3" }),
          " přidat podmínku"
        ]
      }
    )
  ] });
}
function inferTriggerType(rule) {
  if (!rule || rule.area !== "tracking_records") return "automatic";
  return rule.trigger.kind === "schedule" ? "timer" : "automatic";
}
function trackingConditionsFromRule(rule) {
  if (!rule) return [];
  return rule.conditions.filter((c) => c.kind === "field" || c.kind === "tracking_aggregate");
}
function severityActionRowsFromRule(rule) {
  if (!rule || rule.area !== "tracking_records") return [];
  return rule.actions.filter((a) => a.actionTagId).map((a) => ({ id: a.id, actionTagId: a.actionTagId, enabled: true, description: a.vkrText ?? "" }));
}
function getInitialFormState(rule) {
  const ui = rule?.uiState ?? {};
  return {
    selectedArea: rule?.area ?? "tracking_records",
    ruleName: rule?.name ?? "",
    ruleDescription: rule?.description ?? "",
    priority: rule?.priority ?? "medium",
    active: rule?.active ?? true,
    selectedSituationId: ui.selectedSituationId ?? rule?.situationId ?? null,
    selectedSeverityId: ui.selectedSeverityId ?? rule?.severityId ?? null,
    triggerType: ui.triggerType ?? inferTriggerType(rule),
    trackingConditions: ui.trackingConditions ?? trackingConditionsFromRule(rule),
    noMovementDuration: ui.noMovementDuration ?? 72,
    noMovementUnit: ui.noMovementUnit ?? "h",
    severityActions: ui.severityActions ?? severityActionRowsFromRule(rule),
    vkrConditions: ui.vkrConditions ?? []
  };
}
function RuleCreatorPage({
  ruleId,
  initialSituationId,
  initialSeverityId
} = {}) {
  const rules = useRules();
  const navigate = useNavigate();
  const existingRule = ruleId ? rules.find((r) => r.id === ruleId) : void 0;
  const initialState = reactExports.useMemo(() => getInitialFormState(existingRule), [existingRule]);
  const isEdit = !!ruleId;
  const selectedArea = initialState.selectedArea;
  const [selectedSituationId, setSelectedSituationId] = reactExports.useState(initialState.selectedSituationId);
  const [selectedSeverityId, setSelectedSeverityId] = reactExports.useState(initialState.selectedSeverityId);
  const [triggerType, setTriggerType] = reactExports.useState(initialState.triggerType);
  const [trackingConditions, setTrackingConditions] = reactExports.useState(initialState.trackingConditions);
  const [noMovementDuration, setNoMovementDuration] = reactExports.useState(initialState.noMovementDuration);
  const [noMovementUnit, setNoMovementUnit] = reactExports.useState(initialState.noMovementUnit);
  const [severityActions, setSeverityActions] = reactExports.useState(initialState.severityActions);
  const [ruleName, setRuleName] = reactExports.useState(initialState.ruleName);
  const [ruleDescription, setRuleDescription] = reactExports.useState(initialState.ruleDescription);
  const [priority, setPriority] = reactExports.useState(initialState.priority);
  const [active, setActive] = reactExports.useState(initialState.active);
  const [vkrConditions, setVkrConditions] = reactExports.useState(initialState.vkrConditions);
  reactExports.useEffect(() => {
    setSelectedSituationId(initialState.selectedSituationId);
    setSelectedSeverityId(initialState.selectedSeverityId);
    setTriggerType(initialState.triggerType);
    setTrackingConditions(initialState.trackingConditions);
    setNoMovementDuration(initialState.noMovementDuration);
    setNoMovementUnit(initialState.noMovementUnit);
    setSeverityActions(initialState.severityActions);
    setRuleName(initialState.ruleName);
    setRuleDescription(initialState.ruleDescription);
    setPriority(initialState.priority);
    setActive(initialState.active);
    setVkrConditions(initialState.vkrConditions);
  }, [initialState]);
  const isTrackingRecords = selectedArea === "tracking_records";
  const situations = useSituations();
  const actionTags = useActionTags();
  const selectedSituationObj = situations.find((s) => s.id === selectedSituationId);
  selectedSituationObj?.severities.find((s) => s.id === selectedSeverityId);
  function applySeverityTemplate(severity) {
    setPriority(severity.priority);
    setSeverityActions(
      severity.actions.map((a) => ({ id: a.id, actionTagId: a.actionTagId, enabled: true, description: a.description ?? "" }))
    );
  }
  function handleSelectSituation(situationId) {
    setSelectedSituationId(situationId);
    const nextSituation = situations.find((s) => s.id === situationId);
    const firstSeverity = nextSituation?.severities[0];
    setSelectedSeverityId(firstSeverity?.id ?? null);
    if (firstSeverity) applySeverityTemplate(firstSeverity);
  }
  function handleSelectSeverity(severity) {
    setSelectedSeverityId(severity.id);
    applySeverityTemplate(severity);
  }
  reactExports.useEffect(() => {
    if (isEdit || !initialSituationId) return;
    setSelectedSituationId(initialSituationId);
    const situation = situations.find((s) => s.id === initialSituationId);
    const severity = situation?.severities.find((s) => s.id === initialSeverityId) ?? situation?.severities[0];
    if (severity) {
      setSelectedSeverityId(severity.id);
      applySeverityTemplate(severity);
    }
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-screen w-screen flex-col bg-background text-foreground", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(AppHeader, { current: "rules" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-1 min-h-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex w-[260px] shrink-0 flex-col border-r border-border", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-y-auto p-4 space-y-4", children: isTrackingRecords && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2", children: "Situace" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "select",
            {
              value: selectedSituationId ?? "",
              onChange: (e) => handleSelectSituation(e.target.value),
              className: "w-full rounded-md border border-border bg-background px-3 py-2 text-sm mb-3",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", disabled: true, children: "— vyber situaci —" }),
                situations.filter((s) => s.area === "tracking_records").map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: s.id, children: s.name }, s.id))
              ]
            }
          ),
          selectedSituationObj && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2", children: "Závažnost" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col gap-1.5", children: selectedSituationObj.severities.map((sev) => {
              const isSelected = selectedSeverityId === sev.id;
              return /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: () => handleSelectSeverity(sev),
                  className: cn(
                    "rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors",
                    isSelected ? "border-primary bg-primary-soft/40 text-primary" : "border-border hover:border-primary/30 hover:bg-muted/30 text-foreground"
                  ),
                  children: sev.name
                },
                sev.id
              );
            }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-[10px] italic text-muted-foreground leading-relaxed", children: "Předvyplní název/popis/prioritu a akce vpravo — dál nezávisle editovatelné." })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-border p-4 space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              disabled: !ruleName,
              onClick: () => {
                const id = existingRule?.id ?? "rule_" + Date.now();
                const code = existingRule?.code ?? "R" + Math.floor(Math.random() * 90 + 10);
                const trackingTrigger = triggerType === "timer" ? { kind: "schedule", label: "Časový plán — kontroluje periodicky" } : { kind: "condition_met", label: "Reaktivní — při každém novém tracking záznamu" };
                const trackingConditionsOut = triggerType === "timer" ? trackingConditions.filter(isHistoryCondition) : trackingConditions;
                const trackingActionsOut = severityActions.filter((a) => a.enabled).map((a) => ({
                  id: a.id,
                  type: "create_vkr",
                  title: ruleName,
                  vkrText: a.description || void 0,
                  actionTagId: a.actionTagId
                }));
                rulesStore.upsert({
                  id,
                  code,
                  name: ruleName,
                  description: ruleDescription || void 0,
                  area: selectedArea,
                  active,
                  priority,
                  trigger: isTrackingRecords ? trackingTrigger : existingRule?.trigger ?? { kind: "condition_met", label: "—" },
                  conditions: isTrackingRecords ? trackingConditionsOut : existingRule?.conditions ?? [],
                  situationId: isTrackingRecords ? selectedSituationId ?? void 0 : existingRule?.situationId,
                  severityId: isTrackingRecords ? selectedSeverityId ?? void 0 : existingRule?.severityId,
                  actions: isTrackingRecords ? trackingActionsOut : existingRule?.actions ?? [],
                  uiState: {
                    selectedSituationId,
                    selectedSeverityId,
                    triggerType,
                    trackingConditions,
                    noMovementDuration,
                    noMovementUnit,
                    severityActions,
                    vkrConditions
                  }
                });
                toast.success(isEdit ? "Pravidlo upraveno" : "Pravidlo uloženo");
                navigate({ to: "/" });
              },
              className: cn(
                "w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                ruleName ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-muted-foreground cursor-not-allowed"
              ),
              children: isEdit ? "Uložit změny" : "Uložit pravidlo"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Link,
            {
              to: "/",
              className: "block w-full rounded-lg border border-border px-4 py-2 text-center text-sm text-muted-foreground hover:bg-muted transition-colors",
              children: "← Zpět na pravidla"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-1 min-w-0 flex-col border-r border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-y-auto p-5 space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground", children: "Nastavení pravidla" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs text-muted-foreground mb-1 block", children: "Název pravidla" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                value: ruleName,
                onChange: (e) => setRuleName(e.target.value),
                placeholder: "Pojmenuj pravidlo…",
                className: "w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs text-muted-foreground mb-1 block", children: "Popis (volitelný)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Textarea,
              {
                value: ruleDescription,
                onChange: (e) => setRuleDescription(e.target.value),
                placeholder: "Krátký popis pravidla…",
                rows: 2,
                className: "resize-none text-sm"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs text-muted-foreground mb-1 block", children: "Priorita" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "select",
              {
                value: priority,
                onChange: (e) => setPriority(e.target.value),
                className: "w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "low", children: "LOW" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "medium", children: "MEDIUM" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "high", children: "HIGH" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "urgent", children: "URGENT" })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "Aktivní" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => setActive((v) => !v),
                className: cn(
                  "relative inline-block h-5 w-9 rounded-full transition-colors",
                  active ? "bg-primary" : "bg-muted"
                ),
                children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn(
                  "absolute top-0.5 size-4 rounded-full bg-white transition-all shadow",
                  active ? "right-0.5" : "left-0.5"
                ) })
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-t border-border" }),
        !isTrackingRecords && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-dashed border-border p-8 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-muted-foreground", children: "Konfigurace podmínek pro tuto oblast bude přidána později." }) }),
        isTrackingRecords && !selectedSeverityId && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-dashed border-border p-8 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-muted-foreground", children: "Vyber situaci a závažnost v levém sloupci." }) }),
        isTrackingRecords && selectedSeverityId && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2", children: "Spouštěč" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1.5 rounded-lg bg-muted/40 p-1 max-w-xs", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: () => setTriggerType("automatic"),
                  className: cn(
                    "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    triggerType === "automatic" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  ),
                  children: "⚡ Automaticky"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: () => setTriggerType("timer"),
                  className: cn(
                    "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    triggerType === "timer" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  ),
                  children: "🕐 Časovač"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1.5 text-[11px] text-muted-foreground", children: triggerType === "automatic" ? "Vyhodnotí se při každém novém tracking záznamu." : "Kontroluje periodicky, jestli od posledního záznamu neuplynula nastavená doba." })
          ] }),
          triggerType === "timer" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2", children: "Zásilka nemá nový záznam déle než" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "number",
                  min: 1,
                  value: noMovementDuration,
                  onChange: (e) => setNoMovementDuration(Number(e.target.value)),
                  className: "w-20 rounded border border-border bg-background px-2 py-1.5 text-sm text-center"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "select",
                {
                  value: noMovementUnit,
                  onChange: (e) => setNoMovementUnit(e.target.value),
                  className: "rounded border border-border bg-background px-2 py-1.5 text-xs",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "h", children: "hodin" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "d", children: "dní" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "bd", children: "pracovních dní" })
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "od posledního záznamu" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-semibold uppercase tracking-wider text-foreground mb-3 pb-2 border-b border-border", children: "Podmínky" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2", children: "Co platí o záznamech v trackingu" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                TrackingConditionsBuilder,
                {
                  conditions: trackingConditions,
                  onChange: setTrackingConditions,
                  allowCurrentRecord: triggerType === "automatic"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2", children: "Co dále platí" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                VkrConditionsBuilder,
                {
                  conditions: vkrConditions,
                  onChange: setVkrConditions
                }
              )
            ] })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex w-[340px] shrink-0 flex-col", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-y-auto p-4 space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground", children: "Akce" }),
        isTrackingRecords && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          severityActions.map((row) => {
            const tag = actionTags.find((t) => t.id === row.actionTagId);
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border bg-background p-2.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    type: "checkbox",
                    checked: row.enabled,
                    onChange: (e) => setSeverityActions((prev) => prev.map((a) => a.id === row.id ? { ...a, enabled: e.target.checked } : a))
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary flex-1", children: tag?.label ?? row.actionTagId }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    onClick: () => setSeverityActions((prev) => prev.filter((a) => a.id !== row.id)),
                    className: "text-muted-foreground hover:text-foreground",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "size-3.5" })
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Textarea,
                {
                  value: row.description,
                  onChange: (e) => setSeverityActions((prev) => prev.map((a) => a.id === row.id ? { ...a, description: e.target.value } : a)),
                  placeholder: "Co má operátor udělat…",
                  rows: 2,
                  className: "resize-none text-xs",
                  disabled: !row.enabled
                }
              )
            ] }, row.id);
          }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            ActionTagPicker,
            {
              excludeIds: severityActions.map((a) => a.actionTagId),
              onPick: (tag) => setSeverityActions((prev) => [...prev, { id: "sa_" + Date.now(), actionTagId: tag.id, enabled: true, description: "" }])
            }
          )
        ] }),
        !isTrackingRecords && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-dashed border-border p-8 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-muted-foreground", children: "Pro tuto oblast se akce nekonfigurují přes wizard." }) })
      ] }) })
    ] })
  ] });
}
export {
  RuleCreatorPage as R
};
