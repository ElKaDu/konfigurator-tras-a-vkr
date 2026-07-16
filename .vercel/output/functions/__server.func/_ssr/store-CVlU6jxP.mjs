import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { c as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
function AppHeader({
  current,
  extras
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex h-14 shrink-0 items-center gap-4 border-b border-border bg-surface px-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid size-7 place-items-center rounded-md bg-primary text-primary-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { viewBox: "0 0 24 24", fill: "none", className: "size-4", stroke: "currentColor", strokeWidth: "2.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M13 2L3 14h7l-1 8 10-12h-7l1-8z" }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-lg font-semibold tracking-tight", children: [
        "By",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary", children: "torp" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-5 w-px bg-border" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("nav", { className: "flex items-center gap-1 text-sm font-medium", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(NavLink, { to: "/", active: current === "rules", children: "Pravidla pro tracking" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "span",
        {
          title: "Brzy",
          className: "rounded-md px-2.5 py-1 text-muted-foreground opacity-50 cursor-not-allowed select-none",
          children: "Trasy zásilek"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(NavLink, { to: "/situace", active: current === "situace", children: "Situace a závažnosti" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-md bg-primary-soft px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary", children: "prototyp" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ml-auto flex items-center gap-2", children: extras })
  ] });
}
function NavLink({ to, active, children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Link,
    {
      to,
      className: cn(
        "rounded-md px-2.5 py-1 transition-colors",
        active ? "bg-primary-soft text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
      ),
      children
    }
  );
}
const CHECKPOINT_TYPES = [
  { id: "ct_departure", name: "Odlet ze země odeslání", description: "Zásilka odletěla ze země původu." },
  { id: "ct_customs", name: "Příchod na clení", description: "Zásilka dorazila na celnici v cílové zemi." },
  { id: "ct_first_scan", name: "První scan v cíli", description: "První scan zásilky po průjezdu celnicí." },
  { id: "ct_dest_facility", name: "Destination Facility", description: "Zásilka přijata na cílovém depu." },
  { id: "ct_delivered", name: "Doručeno", description: "Zásilka předána příjemci." }
];
const ACTION_TAGS = [
  { id: "at_call_customer", label: "Zavolat zákazníkovi", icon: "Phone" },
  { id: "at_email_customer", label: "Informovat e-mailem", icon: "Mail" },
  { id: "at_check_carrier", label: "Prověřit u dopravce", icon: "Search" },
  { id: "at_shift_date", label: "Posunout datum doručení", icon: "CalendarClock" }
];
const SITUATIONS = [
  {
    id: "sit_undelivered",
    code: "SIT-UNDELIVERED",
    name: "Nedoručeno",
    description: "Zásilka byla doručována, ale příjemce nebyl zastižen.",
    area: "tracking_records",
    severities: [
      {
        id: "sev_undelivered_normal",
        name: "běžné",
        priority: "low",
        actions: [
          { id: "sa_undelivered_normal_1", actionTagId: "at_email_customer", description: "Informuj zákazníka o neúspěšném pokusu a domluv nový termín." }
        ]
      },
      {
        id: "sev_undelivered_problem",
        name: "problémové",
        priority: "medium",
        actions: [
          { id: "sa_undelivered_problem_1", actionTagId: "at_email_customer", description: "Informuj zákazníka o druhém neúspěšném pokusu." },
          { id: "sa_undelivered_problem_2", actionTagId: "at_check_carrier", description: "Ověř u dopravce důvod opakovaného nedoručení." }
        ]
      },
      {
        id: "sev_undelivered_critical",
        name: "kritické",
        priority: "high",
        actions: [
          { id: "sa_undelivered_critical_1", actionTagId: "at_call_customer", description: "Zavolej zákazníkovi, domluv individuální doručení." },
          { id: "sa_undelivered_critical_2", actionTagId: "at_check_carrier", description: "Ověř u dopravce, proč se opakovaně nedaří doručit." }
        ]
      }
    ]
  },
  {
    id: "sit_damage",
    code: "SIT-DAMAGE",
    name: "Poškození zásilky",
    description: "Tracking hlásí zjištěné poškození zásilky.",
    area: "tracking_records",
    severities: [
      {
        id: "sev_damage_default",
        name: "zjištěno poškození",
        priority: "high",
        actions: [
          { id: "sa_damage_1", actionTagId: "at_call_customer", description: "Informuj zákazníka o poškození a domluv další postup (výměna/reklamace)." }
        ]
      }
    ]
  },
  {
    id: "sit_transport_issue",
    code: "SIT-TRANSPORT",
    name: "Problém v přepravě",
    description: "Zásilka vykazuje známky problému v přepravě.",
    area: "tracking_records",
    severities: [
      {
        id: "sev_transport_possible",
        name: "možný problém",
        priority: "low",
        actions: [
          { id: "sa_transport_possible_1", actionTagId: "at_check_carrier", description: "Ověř kontext statusu (místo, čas) a rozhodni, zda jde o skutečný problém." }
        ]
      },
      {
        id: "sev_transport_stuck",
        name: "zaseknutá na místě",
        priority: "medium",
        actions: [
          { id: "sa_transport_stuck_1", actionTagId: "at_check_carrier", description: "Ověř u dopravce, proč se zásilka nehýbe." }
        ]
      },
      {
        id: "sev_transport_lost_suspect",
        name: "podezření na ztrátu",
        priority: "high",
        actions: [
          { id: "sa_lost_1", actionTagId: "at_check_carrier", description: "Zahaj šetření ztráty u dopravce." },
          { id: "sa_lost_2", actionTagId: "at_call_customer", description: "Informuj zákazníka o možném zpoždění." }
        ]
      }
    ]
  }
];
const SEGMENTS = [
  {
    id: "seg_cz_arrival",
    name: "ČR → Příchod na clení",
    description: "Sdílený vstup do CZ.",
    carriers: ["FedEx"],
    serviceTypes: ["ECONOMY"],
    checkpoints: [
      {
        id: "cp_departure",
        checkpointTypeId: "ct_departure",
        note: "Odlet z letiště původu.",
        match: {
          status: ["Picked up", "Departed FedEx location"],
          latest: false
        },
        correctness: []
      },
      {
        id: "cp_customs",
        checkpointTypeId: "ct_customs",
        note: "Celní odbavení v CZ.",
        match: {
          status: ["In customs"],
          location_country_code: ["CZ"],
          latest: true
        },
        correctness: [
          {
            id: "corr_customs_within_2h",
            aspect: "record_event_time",
            operator: "within",
            anchorKind: "checkpoint",
            anchorLabel: "od milníku Odlet ze země odeslání",
            anchorCheckpointTypeId: "ct_departure",
            value: 2,
            unit: "h"
          }
        ]
      }
    ]
  },
  {
    id: "seg_cz_lastmile",
    name: "Příchod na clení → Doručeno",
    description: "Poslední míle v CZ.",
    carriers: ["FedEx"],
    serviceTypes: ["ECONOMY"],
    checkpoints: [
      {
        id: "cp_first_scan",
        checkpointTypeId: "ct_first_scan",
        note: "První scan po celnici.",
        match: {
          status: ["At local FedEx facility"],
          location_country_code: ["CZ"],
          latest: false
        },
        correctness: []
      },
      {
        id: "cp_dest_facility",
        checkpointTypeId: "ct_dest_facility",
        note: "Cílové depo v ČR.",
        match: {
          location_type: ["Destination Facility"],
          location_country_code: ["CZ"],
          zip_matches_destination: true
        },
        correctness: []
      },
      {
        id: "cp_delivered",
        checkpointTypeId: "ct_delivered",
        note: "Doručení příjemci.",
        match: {
          status: ["Delivered"],
          latest: true
        },
        correctness: []
      }
    ]
  }
];
const ROUTES = [
  {
    id: "route_fx_air_cz",
    code: "R-FX-AIR-CZ",
    name: "FedEx Air — CZ",
    active: true,
    carriers: ["FedEx"],
    serviceTypes: ["ECONOMY"],
    destCountries: ["CZ"],
    segmentIds: ["seg_cz_arrival", "seg_cz_lastmile"]
  }
];
const RULES = [
  {
    id: "rule_r10",
    code: "R10",
    name: "Příchod na clení neproběhl správně",
    area: "route_compliance",
    active: true,
    priority: "high",
    trigger: { kind: "condition_met", label: "při každé nové tracking události" },
    conditions: [
      {
        kind: "route_compliance",
        mode: "checkpoint_type",
        checkpointTypeId: "ct_customs"
      }
    ],
    actions: [
      {
        id: "act_r10_vkr",
        type: "create_vkr",
        runWhenRouteCondition: "not_fulfilled",
        title: "Clení v prodlení · {{shipment_number}}",
        priority: "high"
      }
    ]
  },
  {
    id: "rule_t01",
    code: "T01",
    name: "Zásilka se zasekla na jednom místě",
    area: "tracking_records",
    active: true,
    priority: "low",
    situationId: "sit_transport_issue",
    severityId: "sev_transport_stuck",
    trigger: { kind: "condition_met", label: "při každé nové tracking události" },
    conditions: [
      {
        kind: "tracking_aggregate",
        trackingFieldId: "location_city",
        valueMode: "same_repeats",
        count: 3,
        occurrence: "consecutive"
      }
    ],
    actions: [
      {
        id: "act_t01_vkr",
        type: "create_vkr",
        title: "Zaseklá zásilka · {{shipment_number}}",
        priority: "low"
      }
    ]
  },
  {
    id: "rule_r11",
    code: "R11",
    name: "Doručeno mimo předepsanou trasu",
    area: "route_compliance",
    active: true,
    priority: "medium",
    trigger: { kind: "condition_met", label: "při každé nové tracking události" },
    conditions: [
      {
        kind: "route_compliance",
        mode: "general",
        generalCheck: "unrecognized_location"
      }
    ],
    actions: [
      {
        id: "act_r11_vkr",
        type: "create_vkr",
        title: "Mimo trasu · {{shipment_number}}",
        priority: "medium"
      }
    ]
  },
  {
    id: "rule_t02",
    code: "T02",
    name: "Opakovaný pokus o doručení",
    area: "tracking_records",
    active: false,
    priority: "low",
    trigger: { kind: "condition_met", label: "při každé nové tracking události" },
    conditions: [
      {
        kind: "tracking_aggregate",
        trackingFieldId: "status_code",
        valueMode: "specific",
        expectedValue: "DELIVERY_ATTEMPTED",
        count: 2,
        occurrence: "any"
      }
    ],
    actions: [
      {
        id: "act_t02_vkr",
        type: "create_vkr",
        title: "Opakovaný pokus · {{shipment_number}}",
        priority: "low"
      }
    ]
  }
];
const SAMPLE_SHIPMENTS = [
  {
    id: "ship_1",
    label: "FedEx Air → Praha (clení)",
    carrier: "FedEx",
    service_type: "ECONOMY",
    country_import: "CZ",
    state: "IN_TRANSPORT",
    dest_postal_code: "11000",
    etd: "2026-06-13T08:00:00Z",
    eta: "2026-06-16T18:00:00Z",
    activities: [
      {
        status: "Picked up",
        status_code: "PU",
        location_city: "Shanghai",
        location_country_code: "CN",
        location_postal_code: "200120",
        latest: false,
        status_datetime: "2026-06-13T07:45:00Z"
      },
      {
        status: "Departed FedEx location",
        status_code: "DP",
        location_city: "Shanghai",
        location_country_code: "CN",
        location_postal_code: "200120",
        latest: false,
        status_datetime: "2026-06-13T09:30:00Z"
      },
      {
        status: "In customs",
        status_code: "CC",
        location_city: "Praha",
        location_country_code: "CZ",
        location_postal_code: "16000",
        latest: false,
        status_datetime: "2026-06-14T06:10:00Z"
      },
      {
        status: "At local FedEx facility",
        status_code: "AF",
        location_city: "Praha",
        location_country_code: "CZ",
        location_postal_code: "19000",
        latest: true,
        status_datetime: "2026-06-14T10:55:00Z"
      }
    ]
  },
  {
    id: "ship_2",
    label: "FedEx Air → Brno (zaseklá zásilka)",
    carrier: "FedEx",
    service_type: "ECONOMY",
    country_import: "CZ",
    state: "IN_TRANSPORT",
    dest_postal_code: "60200",
    etd: "2026-06-10T10:00:00Z",
    eta: "2026-06-14T18:00:00Z",
    activities: [
      {
        status: "Picked up",
        status_code: "PU",
        location_city: "Hong Kong",
        location_country_code: "HK",
        location_postal_code: "999077",
        latest: false,
        status_datetime: "2026-06-10T09:00:00Z"
      },
      {
        status: "Departed FedEx location",
        status_code: "DP",
        location_city: "Hong Kong",
        location_country_code: "HK",
        location_postal_code: "999077",
        latest: false,
        status_datetime: "2026-06-10T11:20:00Z"
      },
      // Three consecutive events at the same city — triggers T01
      {
        status: "In transit",
        status_code: "IT",
        location_city: "Leipzig",
        location_country_code: "DE",
        location_postal_code: "04435",
        latest: false,
        status_datetime: "2026-06-11T14:00:00Z"
      },
      {
        status: "In transit",
        status_code: "IT",
        location_city: "Leipzig",
        location_country_code: "DE",
        location_postal_code: "04435",
        latest: false,
        status_datetime: "2026-06-12T08:30:00Z"
      },
      {
        status: "In transit",
        status_code: "IT",
        location_city: "Leipzig",
        location_country_code: "DE",
        location_postal_code: "04435",
        latest: true,
        status_datetime: "2026-06-13T09:15:00Z"
      }
    ]
  }
];
function makeStore(seed, storageKey) {
  function loadInitial() {
    if (typeof window === "undefined" || !storageKey) return [...seed];
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return [...seed];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [...seed];
      return parsed;
    } catch {
      return [...seed];
    }
  }
  let state = [...seed];
  let hydrated = false;
  const listeners = /* @__PURE__ */ new Set();
  function ensureHydrated() {
    if (hydrated || typeof window === "undefined" || !storageKey) return;
    state = loadInitial();
    hydrated = true;
  }
  function persist() {
    if (typeof window !== "undefined" && storageKey) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(state));
      } catch {
      }
    }
  }
  function notify() {
    listeners.forEach((l) => l());
  }
  function getState() {
    ensureHydrated();
    return state;
  }
  function setState(next) {
    state = next;
    persist();
    notify();
  }
  function useItems() {
    const [, force] = reactExports.useState(0);
    reactExports.useEffect(() => {
      ensureHydrated();
      force((n) => n + 1);
      const l = () => force((n) => n + 1);
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    }, []);
    return state;
  }
  return { getState, setState, useItems, seed };
}
const _rules = makeStore(RULES, "model_rules_v1");
function useRules() {
  return _rules.useItems();
}
const rulesStore = {
  all: () => _rules.getState(),
  byId: (id) => _rules.getState().find((r) => r.id === id),
  upsert(rule) {
    const cur = _rules.getState();
    const idx = cur.findIndex((r) => r.id === rule.id);
    _rules.setState(
      idx >= 0 ? cur.map((r) => r.id === rule.id ? rule : r) : [...cur, rule]
    );
  },
  remove(id) {
    _rules.setState(_rules.getState().filter((r) => r.id !== id));
  },
  reset() {
    _rules.setState([..._rules.seed]);
  },
  replaceAll(next) {
    _rules.setState(next);
  }
};
const _actionTags = makeStore(ACTION_TAGS, "model_action_tags_v1");
function useActionTags() {
  return _actionTags.useItems();
}
const actionTagsStore = {
  all: () => _actionTags.getState(),
  byId: (id) => _actionTags.getState().find((t) => t.id === id),
  upsert(tag) {
    const cur = _actionTags.getState();
    const idx = cur.findIndex((t) => t.id === tag.id);
    _actionTags.setState(idx >= 0 ? cur.map((t) => t.id === tag.id ? tag : t) : [...cur, tag]);
  },
  remove(id) {
    _actionTags.setState(_actionTags.getState().filter((t) => t.id !== id));
  }
};
const _situations = makeStore(SITUATIONS, "model_situations_v1");
function useSituations() {
  return _situations.useItems();
}
const situationsStore = {
  all: () => _situations.getState(),
  byId: (id) => _situations.getState().find((s) => s.id === id),
  upsert(situation) {
    const cur = _situations.getState();
    const idx = cur.findIndex((s) => s.id === situation.id);
    _situations.setState(idx >= 0 ? cur.map((s) => s.id === situation.id ? situation : s) : [...cur, situation]);
  },
  remove(id) {
    _situations.setState(_situations.getState().filter((s) => s.id !== id));
  }
};
function severityUsageCount(severityId) {
  return _rules.getState().filter((r) => r.severityId === severityId).length;
}
const _routes = makeStore(ROUTES, "model_routes_v1");
function useRoutes() {
  return _routes.useItems();
}
const routesStore = {
  all: () => _routes.getState(),
  byId: (id) => _routes.getState().find((r) => r.id === id),
  upsert(route) {
    const cur = _routes.getState();
    const idx = cur.findIndex((r) => r.id === route.id);
    _routes.setState(
      idx >= 0 ? cur.map((r) => r.id === route.id ? route : r) : [...cur, route]
    );
  },
  remove(id) {
    _routes.setState(_routes.getState().filter((r) => r.id !== id));
  },
  reset() {
    _routes.setState([..._routes.seed]);
  },
  replaceAll(next) {
    _routes.setState(next);
  }
};
const _cts = makeStore(CHECKPOINT_TYPES, "model_checkpoint_types_v1");
function useCheckpointTypes() {
  return _cts.useItems();
}
const checkpointTypesStore = {
  all: () => _cts.getState(),
  byId: (id) => _cts.getState().find((ct) => ct.id === id),
  upsert(ct) {
    const cur = _cts.getState();
    const idx = cur.findIndex((c) => c.id === ct.id);
    _cts.setState(
      idx >= 0 ? cur.map((c) => c.id === ct.id ? ct : c) : [...cur, ct]
    );
  },
  remove(id) {
    _cts.setState(_cts.getState().filter((ct) => ct.id !== id));
  },
  replaceAll(next) {
    _cts.setState(next);
  }
};
const _ships = makeStore(SAMPLE_SHIPMENTS);
function useSampleShipments() {
  return _ships.useItems();
}
const _segments = makeStore(SEGMENTS, "model_segments_v1");
function useSegments() {
  return _segments.useItems();
}
const segmentsStore = {
  all: () => _segments.getState(),
  byId: (id) => _segments.getState().find((s) => s.id === id),
  upsert(seg) {
    const cur = _segments.getState();
    const idx = cur.findIndex((s) => s.id === seg.id);
    _segments.setState(idx >= 0 ? cur.map((s) => s.id === seg.id ? seg : s) : [...cur, seg]);
  },
  remove(id) {
    _segments.setState(_segments.getState().filter((s) => s.id !== id));
  },
  reset() {
    _segments.setState([..._segments.seed]);
  },
  replaceAll(next) {
    _segments.setState(next);
  }
};
function isSegmentUsed(segId) {
  const count = _routes.getState().filter((r) => r.segmentIds.includes(segId)).length;
  return { used: count > 0, count };
}
function isCheckpointTypeUsed(ctId) {
  const count = _segments.getState().filter(
    (s) => s.checkpoints.some((cp) => cp.checkpointTypeId === ctId)
  ).length;
  return { used: count > 0, count };
}
export {
  AppHeader as A,
  useSegments as a,
  useCheckpointTypes as b,
  cn as c,
  checkpointTypesStore as d,
  rulesStore as e,
  useSampleShipments as f,
  useRules as g,
  useSituations as h,
  isSegmentUsed as i,
  situationsStore as j,
  isCheckpointTypeUsed as k,
  severityUsageCount as l,
  useActionTags as m,
  actionTagsStore as n,
  routesStore as r,
  segmentsStore as s,
  useRoutes as u
};
