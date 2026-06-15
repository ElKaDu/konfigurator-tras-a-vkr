import { useState } from "react";
import { Info } from "lucide-react";
import { PlainToken } from "@/components/common/PlainToken";
import { useCheckpointTypes } from "@/lib/model/store";

export function RouteComplianceEditor() {
  const checkpointTypes = useCheckpointTypes();

  const defaultCt =
    checkpointTypes.find((ct) => ct.name === "Příchod na clení") ??
    checkpointTypes[0];

  const [selectedId, setSelectedId] = useState<string>(defaultCt?.id ?? "");

  const selectedName =
    checkpointTypes.find((ct) => ct.id === selectedId)?.name ??
    defaultCt?.name ??
    "milník";

  return (
    <div className="flex flex-col gap-1">
      {/* Plain-language sentence */}
      <p className="text-base leading-[2.2] text-foreground">
        Na trase zásilky sleduj milník{" "}
        <PlainToken chevron>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="bg-transparent outline-none cursor-pointer font-medium text-foreground"
            aria-label="Vybrat milník"
          >
            {checkpointTypes.map((ct) => (
              <option key={ct.id} value={ct.id}>
                {ct.name}
              </option>
            ))}
          </select>
        </PlainToken>
        .
      </p>

      {/* Muted info line */}
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
        <Info size={14} className="shrink-0" />
        <span>
          Co znamená „proběhnout správně", je definováno na trase u tohoto milníku.
        </span>
      </p>
    </div>
  );
}
