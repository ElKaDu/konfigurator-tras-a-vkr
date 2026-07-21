import { useActionTags, useSituations } from "@/lib/model/store";

export function SituaceCard({
  situationId,
  severityId,
  headline,
}: {
  situationId: string;
  severityId: string;
  headline: string;
}) {
  const situations = useSituations();
  const actionTags = useActionTags();
  const situation = situations.find((s) => s.id === situationId);
  const severity = situation?.severities.find((s) => s.id === severityId);

  if (!situation || !severity) {
    return <div className="text-xs text-destructive">Situace „{situationId}" nenalezena v katalogu.</div>;
  }

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="text-xs font-semibold text-muted-foreground mb-2">{headline}</div>
      <div className="mb-2">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1.5">
          Situace <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] normal-case">🔒 needitovatelné</span>
        </div>
        <div className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-1 text-sm font-medium">
          {situation.name}
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">{severity.name}</span>
        </div>
      </div>
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Akce</div>
        <ul className="flex flex-col gap-1">
          {severity.actions.map((a) => {
            const tag = actionTags.find((t) => t.id === a.actionTagId);
            return (
              <li key={a.id} className="flex items-start gap-1.5 text-xs">
                <span className="mt-1 size-1 rounded-full bg-muted-foreground shrink-0" />
                <span>{tag?.label ?? a.actionTagId}{a.description ? ` — ${a.description}` : ""}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
