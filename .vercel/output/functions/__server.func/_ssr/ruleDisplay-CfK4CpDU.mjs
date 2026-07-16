function triggerLabel(kind) {
  if (kind === "condition_met") return "Podmínka";
  if (kind === "schedule") return "Časovač";
  return "Manuálně";
}
function priorityLabel(p) {
  return p.toUpperCase();
}
function isPriorityHigh(p) {
  return p === "high" || p === "urgent";
}
export {
  isPriorityHigh as i,
  priorityLabel as p,
  triggerLabel as t
};
