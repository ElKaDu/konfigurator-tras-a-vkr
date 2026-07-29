import { useChecklistItems } from "@/lib/checklist/store";
import { findingsSummary } from "@/lib/checklist/derived";
import { templateById } from "@/lib/checklist/store";

export function ShrnutiNalezuPanel() {
  const items = useChecklistItems();
  const findings = findingsSummary(items);

  if (findings.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-3.5">
      <p className="mb-0.5 text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">
        Shrnutí nálezů
      </p>
      <p className="mb-2.5 text-[11px] text-muted-foreground">co nebylo v pořádku a jak se to vyřešilo</p>
      <div className="flex flex-col gap-2.5">
        {findings.map((item) => {
          const tpl = templateById(item.templateId);
          return (
            <div key={item.id} className="border-b border-border pb-2.5 last:border-0 last:pb-0">
              <div className="text-[12.5px] font-semibold">{tpl?.title}</div>
              <div className="mt-0.5 text-[11.5px] text-success-foreground">
                <b>Nález:</b> {item.finding}
              </div>
              <div className="text-[11.5px] text-success-foreground">
                <b>Řešení:</b> {item.resolution}
              </div>
              <div className="mt-0.5 text-[10.5px] text-muted-foreground">
                vyřešil{item.resolvedBy ? "a " + item.resolvedBy : "a"}
                {item.resolvedAt ? ", " + new Date(item.resolvedAt).toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" }) : ""}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
