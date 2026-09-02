import type { ReactNode } from "react";
import type { Checkpoint, Segment } from "@/lib/model/types";
import { defaultVyzvednutiTermin } from "@/lib/model/defaults";
import { MatchEditor } from "./MatchEditor";
import { TerminEditor } from "./TerminEditor";
import { TimeLimitEditor } from "./TimeLimitEditor";

/** Bod má dvě části: co musí záznam splnit, a jak dlouho se na něj čeká. */
function Part({
  number,
  title,
  subtitle,
  children,
}: {
  number: number;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-8 last:mb-0">
      <div className="flex items-baseline gap-2.5">
        <span className="grid size-[22px] translate-y-[3px] place-items-center rounded-full bg-primary text-[12px] font-semibold text-primary-foreground">
          {number}
        </span>
        <h2 className="text-[17px] font-semibold leading-[26px]">{title}</h2>
      </div>
      <p className="mb-3.5 ml-8 text-[13px] leading-[19px] text-muted-foreground">{subtitle}</p>
      <div className="ml-8 flex flex-col gap-3.5">{children}</div>
    </section>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-md bg-card elevation-2">
      <h3 className="px-6 pt-4 text-[15px] font-medium leading-[22px] text-muted-foreground">{title}</h3>
      <div className="px-6 pb-5 pt-3.5">{children}</div>
    </div>
  );
}

export function BodDetailPanel({
  segment,
  checkpoint,
  onUpdate,
}: {
  segment: Segment;
  checkpoint: Checkpoint;
  onUpdate: (next: Checkpoint) => void;
}) {
  return (
    <div className="max-w-[760px]">
      <Part
        number={1}
        title="Co musí záznam splnit"
        subtitle="Podle čeho bod poznáme v trackingu a do kdy měl nastat."
      >
        <Card title="Rozpoznání">
          <MatchEditor value={checkpoint.match} onChange={(match) => onUpdate({ ...checkpoint, match })} />
        </Card>

        <Card title="Termín">
          <TerminEditor
            segment={segment}
            currentCheckpointId={checkpoint.id}
            value={checkpoint.correctness[0] ?? defaultVyzvednutiTermin("corr_" + checkpoint.id)}
            onChange={(corr) => onUpdate({ ...checkpoint, correctness: [corr] })}
          />
        </Card>
      </Part>

      <Part
        number={2}
        title="Jak dlouho na něj čekat"
        subtitle="Tracking chodí se zpožděním. Tohle je okamžik, kdy přestaneme čekat."
      >
        <Card title="Konečný limit">
          <TimeLimitEditor
            value={checkpoint.konecnyLimit ?? { mode: "offset", offsetHours: 0 }}
            onChange={(limit) => onUpdate({ ...checkpoint, konecnyLimit: limit })}
          />
        </Card>
      </Part>
    </div>
  );
}
