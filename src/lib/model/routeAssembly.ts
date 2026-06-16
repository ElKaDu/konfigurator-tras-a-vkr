import type { Route, Segment, Checkpoint } from "./types";

/** Složená trasa = zřetězení checkpointů úseků v pořadí segmentIds. */
export function assembledCheckpoints(route: Route, segments: Segment[]): Checkpoint[] {
  const byId = new Map(segments.map((s) => [s.id, s]));
  return route.segmentIds.flatMap((id) => byId.get(id)?.checkpoints ?? []);
}

/** Kolik tras úsek používá (pro „použito na N trasách"). */
export function segmentUsageCount(segmentId: string, routes: Route[]): number {
  return routes.filter((r) => r.segmentIds.includes(segmentId)).length;
}

/** Počet použití každého typu milníku napříč všemi úseky. */
export function milestoneTypeUsage(segments: Segment[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const s of segments)
    for (const cp of s.checkpoints)
      m.set(cp.checkpointTypeId, (m.get(cp.checkpointTypeId) ?? 0) + 1);
  return m;
}

/** Typy milníků, na které kotvy úseku míří, ale úsek je sám nepřináší. */
export function segmentDependencies(segment: Segment): string[] {
  const own = new Set(segment.checkpoints.map((cp) => cp.checkpointTypeId));
  const deps = new Set<string>();
  for (const cp of segment.checkpoints)
    for (const c of cp.correctness)
      if (c.anchorKind === "checkpoint" && c.anchorCheckpointTypeId && !own.has(c.anchorCheckpointTypeId))
        deps.add(c.anchorCheckpointTypeId);
  return [...deps];
}

export interface CompositionIssue {
  kind: "duplicate_type" | "anchor_missing" | "anchor_order";
  checkpointTypeId: string;
  message: string;
}

/** Validace složené trasy: unikátnost typu + kotvy (přítomnost a pořadí). */
export function validateRouteComposition(segmentIds: string[], segments: Segment[]): CompositionIssue[] {
  const byId = new Map(segments.map((s) => [s.id, s]));
  const ordered = segmentIds.map((id) => byId.get(id)).filter(Boolean) as Segment[];
  const issues: CompositionIssue[] = [];

  const typeFirstPos = new Map<string, number>();
  const typeCount = new Map<string, number>();
  let pos = 0;
  for (const seg of ordered)
    for (const cp of seg.checkpoints) {
      typeCount.set(cp.checkpointTypeId, (typeCount.get(cp.checkpointTypeId) ?? 0) + 1);
      if (!typeFirstPos.has(cp.checkpointTypeId)) typeFirstPos.set(cp.checkpointTypeId, pos);
      pos++;
    }

  for (const [t, n] of typeCount)
    if (n > 1) issues.push({ kind: "duplicate_type", checkpointTypeId: t, message: `Milník je na trase ${n}×` });

  pos = 0;
  for (const seg of ordered)
    for (const cp of seg.checkpoints) {
      for (const c of cp.correctness)
        if (c.anchorKind === "checkpoint" && c.anchorCheckpointTypeId) {
          const target = c.anchorCheckpointTypeId;
          if (!typeFirstPos.has(target))
            issues.push({ kind: "anchor_missing", checkpointTypeId: target, message: "Kotva míří na milník, který na trase není" });
          else if (typeFirstPos.get(target)! >= pos)
            issues.push({ kind: "anchor_order", checkpointTypeId: target, message: "Kotvený milník není na trase dříve" });
        }
      pos++;
    }

  return issues;
}

/** Vhodné úseky pro přidání: shoda podpisu; `conflict=true` = přinesl by už přítomný typ. */
export function eligibleSegments(
  route: Pick<Route, "carriers" | "serviceTypes" | "segmentIds">,
  segments: Segment[],
): { segment: Segment; conflict: boolean }[] {
  const byId = new Map(segments.map((s) => [s.id, s]));
  const present = new Set(
    route.segmentIds.flatMap((id) => byId.get(id)?.checkpoints.map((c) => c.checkpointTypeId) ?? []),
  );
  const sigOk = (s: Segment) =>
    s.carriers.some((c) => route.carriers.includes(c)) &&
    s.serviceTypes.some((t) => route.serviceTypes.includes(t));
  return segments
    .filter((s) => sigOk(s) && !route.segmentIds.includes(s.id))
    .map((s) => ({ segment: s, conflict: s.checkpoints.some((c) => present.has(c.checkpointTypeId)) }));
}
