import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Vetev({
  kind,
  label,
  children,
}: {
  kind: "ok" | "warn" | "neutral";
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div
        className={cn(
          "px-3 py-1.5 text-[11px] font-semibold",
          kind === "ok" && "bg-success/20 text-success-foreground",
          kind === "warn" && "bg-warning/20 text-warning-foreground",
          kind === "neutral" && "bg-muted text-muted-foreground",
        )}
      >
        {label}
      </div>
      <div className="p-3 bg-card">{children}</div>
    </div>
  );
}
