import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export type SectionKey = "rules" | "routes";

export function AppHeader({
  current,
  extras,
}: {
  current: SectionKey;
  extras?: React.ReactNode;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-surface px-6">
      <div className="flex items-center gap-2">
        <div className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground">
          <svg viewBox="0 0 24 24" fill="none" className="size-4" stroke="currentColor" strokeWidth="2.5">
            <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
          </svg>
        </div>
        <span className="text-lg font-semibold tracking-tight">By<span className="text-primary">torp</span></span>
      </div>
      <div className="h-5 w-px bg-border" />
      <nav className="flex items-center gap-1 text-sm font-medium">
        <NavLink to="/" active={current === "rules"}>Konfigurátor pravidel</NavLink>
        <NavLink to="/trasy" active={current === "routes"}>Trasy zásilek</NavLink>
      </nav>
      <span className="rounded-md bg-primary-soft px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
        prototyp
      </span>
      <div className="ml-auto flex items-center gap-2">{extras}</div>
    </header>
  );
}

function NavLink({ to, active, children }: { to: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className={cn(
        "rounded-md px-2.5 py-1 transition-colors",
        active ? "bg-primary-soft text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}
