import type { ContextField } from "@/lib/checklist/types";

export function ItemContext({ title, fields }: { title: string; fields: ContextField[] }) {
  return (
    <div className="mt-2.5 rounded-r-lg border border-l-4 border-border border-l-primary bg-background p-3">
      <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        Kontext ze zásilky pro
      </p>
      <h4 className="mb-2.5 text-[13px] font-semibold">{title}</h4>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {fields.map((f) => (
          <div key={f.label}>
            <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{f.label}</div>
            <div className="text-[12.5px]">{f.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
