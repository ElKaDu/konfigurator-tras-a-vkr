import type { CheckpointCorrectness } from "./types";

/** Výchozí Termín "Vyzvednutí zásilky" (pevný čas 12:00, kotva systémová událost). */
export function defaultVyzvednutiTermin(id: string): CheckpointCorrectness {
  return {
    id,
    aspect: "record_event_time",
    mode: "fixed",
    anchorKind: "system_event",
    anchorLabel: "Vyzvednutí zásilky",
    operator: "within",
    fixedOp: "before",
    fixedTime: "12:00",
    fixedTz: "local",
  };
}
