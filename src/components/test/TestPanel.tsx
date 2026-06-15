import { useState } from "react";
import { PlayCircle, AlertTriangle, CircleCheck } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { AreaBadge } from "@/components/common/AreaBadge";
import { useSampleShipments, useRules } from "@/lib/model/store";
import { cn } from "@/lib/utils";
import type { Rule, SampleShipment } from "@/lib/model/types";

// ---------------------------------------------------------------------------
// Heuristic: derive a plausible branch without real evaluation logic
// ---------------------------------------------------------------------------

function inferBranch(rule: Rule): "fulfilled" | "not_fulfilled" {
  const lc = rule.name.toLowerCase();
  if (
    lc.includes("neproběhl") ||
    lc.includes("mimo") ||
    lc.includes("zasekla") ||
    lc.includes("opakovaný")
  ) {
    return "not_fulfilled";
  }
  return "fulfilled";
}

// ---------------------------------------------------------------------------
// Stub bullet lines based on area + branch
// ---------------------------------------------------------------------------

function stubLines(
  rule: Rule,
  shipment: SampleShipment,
  branch: "fulfilled" | "not_fulfilled",
): string[] {
  const carrier = [shipment.carrier, shipment.transport_type]
    .filter(Boolean)
    .join(" ");
  const dest = shipment.country_import;
  const vkrTitle = rule.actions[0]?.title ?? rule.name;

  if (rule.area === "route_compliance") {
    const lines: string[] = [
      `Trasa zásilky: ${carrier} → ${dest}`,
      branch === "not_fulfilled"
        ? `Milník „Příchod na clení": nenastal v očekávaném čase`
        : `Všechny milníky proběhly ve správném pořadí a čase`,
    ];
    if (branch === "not_fulfilled") {
      lines.push(`Vznikla by VkŘ: „${vkrTitle}"`);
    }
    return lines;
  }

  if (rule.area === "tracking_records") {
    const city =
      shipment.activities.find((a) => a.location_city)?.location_city ??
      "Leipzig";
    const lines: string[] = [
      `Tracking: stejná hodnota „${city}" na 3 po sobě jdoucích záznamech`,
      branch === "not_fulfilled"
        ? `Podmínka splněna → vznikla by VkŘ: „${vkrTitle}"`
        : `Podmínka splněna → pravidlo proběhlo v pořádku`,
    ];
    return lines;
  }

  // Generic fallback for other areas
  const lines: string[] = [
    `Zásilka ${shipment.label} (${carrier} → ${dest})`,
    branch === "not_fulfilled"
      ? `Podmínka pravidla byla vyhodnocena jako nenaplněná`
      : `Podmínka pravidla byla vyhodnocena jako splněná`,
  ];
  if (branch === "not_fulfilled") {
    lines.push(`Vznikla by VkŘ: „${vkrTitle}"`);
  }
  return lines;
}

// ---------------------------------------------------------------------------
// Outcome card
// ---------------------------------------------------------------------------

function OutcomeCard({
  rule,
  shipment,
}: {
  rule: Rule;
  shipment: SampleShipment;
}) {
  const branch = inferBranch(rule);
  const lines = stubLines(rule, shipment, branch);

  return (
    <div className="rounded-xl border border-border bg-background p-5 flex flex-col gap-4">
      {/* Header row */}
      <div className="flex items-center gap-3 flex-wrap">
        {branch === "not_fulfilled" ? (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium",
              "bg-destructive/10 text-destructive",
            )}
          >
            <AlertTriangle size={14} />
            Odchylka — vznikla by VkŘ
          </span>
        ) : (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium",
              "bg-emerald-50 text-emerald-700",
            )}
          >
            <CircleCheck size={14} />
            V pořádku — žádná VkŘ
          </span>
        )}
        <AreaBadge area={rule.area} />
      </div>

      {/* Bullet lines */}
      <ul className="flex flex-col gap-1.5 pl-4 list-disc text-sm text-foreground">
        {lines.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>

      {/* Muted footer note */}
      <p className="text-xs text-muted-foreground border-t border-border pt-3 mt-1">
        Ukázkový výsledek — skutečné vyhodnocení doplní další fáze.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main TestPanel
// ---------------------------------------------------------------------------

export function TestPanel() {
  const shipments = useSampleShipments();
  const rules = useRules();

  const [selectedShipmentId, setSelectedShipmentId] = useState<string>(
    shipments[0]?.id ?? "",
  );
  const [selectedRuleId, setSelectedRuleId] = useState<string>(
    rules[0]?.id ?? "",
  );
  const [show, setShow] = useState(false);

  const selectedShipment = shipments.find((s) => s.id === selectedShipmentId);
  const selectedRule = rules.find((r) => r.id === selectedRuleId);

  return (
    <div className="flex h-screen w-screen flex-col bg-background text-foreground">
      <AppHeader current="rules" />

      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-3xl w-full p-6 flex flex-col gap-4">
          {/* Title */}
          <div>
            <h1 className="text-lg font-semibold">Otestovat pravidlo</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Vyber vzorovou zásilku a pravidlo — uvidíš, co by se stalo.
              (Vyhodnocení je zatím ukázkové.)
            </p>
          </div>

          {/* Selects */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Vzorová zásilka
              </label>
              <select
                value={selectedShipmentId}
                onChange={(e) => {
                  setSelectedShipmentId(e.target.value);
                  setShow(false);
                }}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              >
                {shipments.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Pravidlo
              </label>
              <select
                value={selectedRuleId}
                onChange={(e) => {
                  setSelectedRuleId(e.target.value);
                  setShow(false);
                }}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              >
                {rules.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.code} · {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Otestovat button */}
          <button
            onClick={() => setShow(true)}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium self-start hover:opacity-90 transition-opacity"
          >
            <PlayCircle size={15} />
            Otestovat
          </button>

          {/* Stubbed outcome card */}
          {show && selectedRule && selectedShipment && (
            <OutcomeCard rule={selectedRule} shipment={selectedShipment} />
          )}
        </div>
      </div>
    </div>
  );
}
