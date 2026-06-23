/**
 * Export / Import veškerých dat prototypu (trasy, úseky, milníky, pravidla)
 * jako jeden JSON soubor. Slouží jako:
 *   1) záloha mezi prohlížeči / doménami (preview vs publikovaná verze),
 *   2) podklad pro přelití do seedu (`src/lib/model/seed.ts`) — pošli soubor
 *      AI a řekni „použij jako seed".
 */

import {
  routesStore,
  rulesStore,
  segmentsStore,
  checkpointTypesStore,
} from "./model/store";
import type {
  CheckpointType,
  Route,
  Rule,
  Segment,
} from "./model/types";

export const EXPORT_KIND = "bytorp-export" as const;
export const EXPORT_VERSION = "v1" as const;

export interface BytorpExport {
  kind: typeof EXPORT_KIND;
  version: string;
  exportedAt: string;
  routes: Route[];
  segments: Segment[];
  checkpointTypes: CheckpointType[];
  rules: Rule[];
}

export function buildExport(): BytorpExport {
  return {
    kind: EXPORT_KIND,
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    routes: routesStore.all(),
    segments: segmentsStore.all(),
    checkpointTypes: checkpointTypesStore.all(),
    rules: rulesStore.all(),
  };
}

export function downloadExport(): void {
  const data = buildExport();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const date = new Date().toISOString().slice(0, 10);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bytorp-data-${date}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function validate(raw: unknown): asserts raw is BytorpExport {
  if (!raw || typeof raw !== "object") throw new Error("Soubor není JSON objekt.");
  const r = raw as Record<string, unknown>;
  if (r.kind !== EXPORT_KIND) throw new Error(`Neznámý formát souboru (kind != "${EXPORT_KIND}").`);
  for (const k of ["routes", "segments", "checkpointTypes", "rules"] as const) {
    if (!Array.isArray(r[k])) throw new Error(`Pole \`${k}\` chybí nebo není seznam.`);
  }
}

export async function importFromFile(file: File): Promise<void> {
  const text = await file.text();
  const parsed = JSON.parse(text) as unknown;
  validate(parsed);
  // Pořadí nezáleží — všechny stores jsou nezávislé.
  checkpointTypesStore.replaceAll(parsed.checkpointTypes);
  segmentsStore.replaceAll(parsed.segments);
  routesStore.replaceAll(parsed.routes);
  rulesStore.replaceAll(parsed.rules);
}
