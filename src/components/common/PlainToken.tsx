import { ChevronDown } from "lucide-react";

export function PlainToken({
  children,
  chevron,
}: {
  children: React.ReactNode;
  chevron?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-0.5 font-medium text-foreground">
      {children}
      {chevron && <ChevronDown size={14} className="text-muted-foreground" />}
    </span>
  );
}
