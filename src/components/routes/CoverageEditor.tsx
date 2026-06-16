import type { Route } from "@/lib/model/types";

const LABEL_CLASS =
  "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5";

const PILL_SELECTED =
  "bg-primary text-primary-foreground rounded-full px-3 py-1 text-sm";

const PILL_UNSELECTED =
  "border border-border text-muted-foreground rounded-full px-3 py-1 text-sm";

const PILL_DASHED =
  "border border-dashed border-border text-muted-foreground rounded-full px-3 py-1 text-sm cursor-pointer hover:bg-muted";

function PillGroup({
  label,
  selected,
  unselected,
  addLabel,
}: {
  label: string;
  selected: string[];
  unselected: string[];
  addLabel: string;
}) {
  return (
    <div className="flex flex-col">
      <div className={LABEL_CLASS}>{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {selected.map((v) => (
          <span key={v} className={PILL_SELECTED}>
            {v}
          </span>
        ))}
        {unselected.map((v) => (
          <span key={v} className={PILL_UNSELECTED}>
            {v}
          </span>
        ))}
        <span className={PILL_DASHED}>{addLabel}</span>
      </div>
    </div>
  );
}

const CARRIER_OPTIONS = ["UPS", "DHL", "PPL", "GLS"];
const SERVICE_OPTIONS = ["EXPRESS", "ECONOMY"];
const COUNTRY_OPTIONS: string[] = [];

export function CoverageEditor({ route }: { route: Route }) {
  const unselectedCarriers = CARRIER_OPTIONS.filter(
    (c) => !route.carriers.includes(c)
  ).slice(0, 2);

  const unselectedTransport = SERVICE_OPTIONS.filter(
    (t) => !route.serviceTypes.includes(t)
  ).slice(0, 2);

  return (
    <div className="flex flex-col gap-4">
      <PillGroup
        label="Dopravce"
        selected={route.carriers}
        unselected={unselectedCarriers}
        addLabel="+"
      />
      <PillGroup
        label="Služba (service_type)"
        selected={route.serviceTypes}
        unselected={unselectedTransport}
        addLabel="+"
      />
      <PillGroup
        label="Cílová země"
        selected={route.destCountries}
        unselected={COUNTRY_OPTIONS}
        addLabel="+ země"
      />
      <PillGroup
        label="Jemnější cíl (stát / PSČ) · volitelné"
        selected={route.destZone ?? []}
        unselected={[]}
        addLabel="+ zóna"
      />
    </div>
  );
}
