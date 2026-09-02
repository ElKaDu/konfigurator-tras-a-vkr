import type { ReactNode } from "react";
import type { Checkpoint, Segment } from "@/lib/model/types";
import { defaultVyzvednutiTermin } from "@/lib/model/defaults";
import { MatchEditor } from "./MatchEditor";
import { TerminEditor } from "./TerminEditor";
import { TimeLimitEditor } from "./TimeLimitEditor";

/**
 * Bod má dvě části: co musí záznam splnit, a jak dlouho se na něj čeká.
 * Každá je jedna karta s hlavičkou — vnořené karty v kartě působily rozsypaně.
 */
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
    <section className="rounded-md bg-card elevation-2">
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-baseline gap-2.5">
          <span className="grid size-[22px] translate-y-[3px] place-items-center rounded-full bg-primary text-[12px] font-semibold text-primary-foreground">
            {number}
          </span>
          <h2 className="text-[17px] font-semibold leading-[26px]">{title}</h2>
        </div>
        <p className="ml-8 text-[13px] leading-[19px] text-muted-foreground">{subtitle}</p>
      </div>
      <div className="divide-y divide-border">{children}</div>
    </section>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="px-6 py-5">
      <div className="text-overline mb-3">{title}</div>
      {children}
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
    <div className="flex max-w-[760px] flex-col gap-5">
      <Part
        number={1}
        title="Co musí záznam splnit"
        subtitle="Podle čeho bod poznáme v trackingu a do kdy měl nastat."
      >
        <Section title="Rozpoznání">
          <MatchEditor value={checkpoint.match} onChange={(match) => onUpdate({ ...checkpoint, match })} />
        </Section>

        <Section title="Termín">
          <TerminEditor
            segment={segment}
            currentCheckpointId={checkpoint.id}
            value={checkpoint.correctness[0] ?? defaultVyzvednutiTermin("corr_" + checkpoint.id)}
            onChange={(corr) => onUpdate({ ...checkpoint, correctness: [corr] })}
          />
        </Section>
      </Part>

      <Part
        number={2}
        title="Jak dlouho na něj čekat"
        subtitle="Tracking může chodit se zpožděním. Do tohoto okamžiku budeme čekat, než vytvoříme věc k řešení."
      >
        <Section title="Konečný limit">
          <TimeLimitEditor
            value={checkpoint.konecnyLimit ?? { mode: "offset", offsetHours: 0 }}
            onChange={(limit) => onUpdate({ ...checkpoint, konecnyLimit: limit })}
          />
        </Section>
      </Part>
    </div>
  );
}
