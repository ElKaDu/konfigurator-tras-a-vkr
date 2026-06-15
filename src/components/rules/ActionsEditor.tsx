import { CircleCheck, AlertTriangle, Plus } from "lucide-react";
import { PlainToken } from "@/components/common/PlainToken";
import type { Area, ActionType } from "@/lib/model/types";

const ACTION_LABELS: Record<ActionType, string> = {
  create_vkr: "Vytvořit VkŘ",
  send_email: "Odeslat e-mail",
  set_field: "Změnit hodnotu pole",
  change_phase: "Změnit fázi zásilky",
  update_vkr: "Upravit existující VkŘ",
  add_note: "Přidat poznámku",
  request_field_from_operator: "Požádat operátora o vyplnění pole",
};

function ActionRow({ type }: { type: ActionType }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <PlainToken chevron>{ACTION_LABELS[type]}</PlainToken>
      <span className="text-muted-foreground">s názvem</span>
      <PlainToken>„… · {"{{shipment_number}}"}"</PlainToken>
    </div>
  );
}

function AddActionAffordance() {
  return (
    <div className="flex items-center gap-1.5 text-sm text-primary cursor-pointer mt-2">
      <Plus size={14} />
      <span>přidat akci</span>
    </div>
  );
}

export function ActionsEditor({ area }: { area: Area }) {
  if (area === "route_compliance") {
    return (
      <div className="flex flex-col gap-3">
        {/* Fulfilled branch */}
        <div className="rounded-md border border-border p-3">
          <div className="flex items-center gap-2 mb-2">
            <CircleCheck size={15} className="text-emerald-600" />
            <span className="text-sm font-medium">Když proběhl správně</span>
          </div>
          <AddActionAffordance />
        </div>

        {/* Not fulfilled branch */}
        <div className="rounded-md border border-border p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={15} className="text-destructive" />
            <span className="text-sm font-medium">Když neproběhl správně</span>
          </div>
          <ActionRow type="create_vkr" />
          <AddActionAffordance />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <ActionRow type="create_vkr" />
      <AddActionAffordance />
    </div>
  );
}
