// src/lib/model/routeEligibility.ts
import type { Route, Segment } from "./types";

/**
 * Úseky, které lze přidat na trasu: aspoň jeden společný dopravce A aspoň jeden společný
 * typ služby, a ještě nejsou na trase připojené. Bez kontroly na duplicitní typ milníku —
 * checkpointType je dnes vestigiální (natvrdo "ct_first_scan" u nových bodů), viz
 * docs/superpowers/specs/2026-07-20-soulad-s-trasou-crud-dashboard-design.md §1.
 */
export function eligibleSegments(
  route: Pick<Route, "carriers" | "serviceTypes" | "segmentIds">,
  segments: Segment[],
): Segment[] {
  const sigOk = (s: Segment) =>
    s.carriers.some((c) => route.carriers.includes(c)) &&
    s.serviceTypes.some((t) => route.serviceTypes.includes(t));
  return segments.filter((s) => sigOk(s) && !route.segmentIds.includes(s.id));
}
