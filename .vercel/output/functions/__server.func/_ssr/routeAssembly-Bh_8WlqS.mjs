function assembledCheckpoints(route, segments) {
  const byId = new Map(segments.map((s) => [s.id, s]));
  return route.segmentIds.flatMap((id) => byId.get(id)?.checkpoints ?? []);
}
function milestoneTypeUsage(segments) {
  const m = /* @__PURE__ */ new Map();
  for (const s of segments)
    for (const cp of s.checkpoints)
      m.set(cp.checkpointTypeId, (m.get(cp.checkpointTypeId) ?? 0) + 1);
  return m;
}
function validateRouteComposition(segmentIds, segments) {
  const byId = new Map(segments.map((s) => [s.id, s]));
  const ordered = segmentIds.map((id) => byId.get(id)).filter(Boolean);
  const issues = [];
  const typeFirstPos = /* @__PURE__ */ new Map();
  const typeCount = /* @__PURE__ */ new Map();
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
          else if (typeFirstPos.get(target) >= pos)
            issues.push({ kind: "anchor_order", checkpointTypeId: target, message: "Kotvený milník není na trase dříve" });
        }
      pos++;
    }
  return issues;
}
function eligibleSegments(route, segments) {
  const byId = new Map(segments.map((s) => [s.id, s]));
  const present = new Set(
    route.segmentIds.flatMap((id) => byId.get(id)?.checkpoints.map((c) => c.checkpointTypeId) ?? [])
  );
  const sigOk = (s) => s.carriers.some((c) => route.carriers.includes(c)) && s.serviceTypes.some((t) => route.serviceTypes.includes(t));
  return segments.filter((s) => sigOk(s) && !route.segmentIds.includes(s.id)).map((s) => ({ segment: s, conflict: s.checkpoints.some((c) => present.has(c.checkpointTypeId)) }));
}
export {
  assembledCheckpoints as a,
  eligibleSegments as e,
  milestoneTypeUsage as m,
  validateRouteComposition as v
};
