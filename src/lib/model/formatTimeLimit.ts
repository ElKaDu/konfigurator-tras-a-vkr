import type { TimeLimit } from "./types";

export function formatTimeLimit(limit: TimeLimit): string {
  return limit.mode === "absolute" ? `v ${limit.absoluteTime}` : `${limit.offsetHours} h po Termínu`;
}
