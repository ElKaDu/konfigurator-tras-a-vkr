import type { LucideIcon } from "lucide-react";

export function SectionCard({
  icon: Icon,
  title,
  subtitle,
  aside,
  children,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="flex items-center gap-2 pb-2.5 mb-3 border-b border-border">
        <Icon className="size-[18px] text-muted-foreground" />
        <span className="text-sm font-medium">{title}</span>
        {subtitle && (
          <span className="text-xs text-muted-foreground">{subtitle}</span>
        )}
        {aside && <div className="ml-auto">{aside}</div>}
      </div>
      {children}
    </div>
  );
}
