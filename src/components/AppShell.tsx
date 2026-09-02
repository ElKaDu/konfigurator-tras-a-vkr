import type { ReactNode } from "react";
import { Link, type LinkProps } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  BarChart,
  Bell,
  Book,
  Calculator,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileList,
  Folder,
  Group,
  Home,
  Inbox,
  ListChecks,
  ListUnordered,
  Lock,
  PanelLeft,
  Pushpin,
  Route,
  Settings,
  Sparkles,
  type LucideIcon,
} from "@/components/ui/icon";

export type SectionKey = "rules" | "soulad" | "situace";

/**
 * Shell reálné aplikace — svislá navigace 260 px + navbar 64 px.
 * Rozměry a chování jsou z bytorp-frontend:
 *   @layouts/styles/_variables.scss — šířka navigace, výška navbaru
 *   @core/scss/base/placeholders/_nav.scss — aktivní položka = plná primary + elevation 3
 *   app/layouts/$bytorp/.../btVerticalNavItems.ts — položky menu
 *   $bytorp/components/BTLayout/BTLayout.vue — název stránky v navbaru, šipka zpět
 */

/**
 * Menu podle reálné aplikace (snímky z Bytorpu). Položky mimo konfigurátor
 * jsou v prototypu kulisa — nikam nevedou. Zašedlé jsou zašedlé i tam.
 */
type NavEntry =
  | { kind: "divider" }
  | { kind: "item"; label: string; icon: LucideIcon; muted?: boolean }
  | { kind: "group"; label: string; icon: LucideIcon; children?: { label: string; icon: LucideIcon }[] };

const MENU: NavEntry[] = [
  { kind: "item", label: "Můj přehled", icon: Home, muted: true },
  { kind: "item", label: "Shipee AI", icon: Sparkles },
  { kind: "divider" },
  { kind: "group", label: "Obchodní případy", icon: Inbox },
  { kind: "item", label: "Věci k řešení", icon: ListChecks },
  { kind: "item", label: "Akce", icon: ListUnordered },
  { kind: "item", label: "Zákazníci", icon: Group },
  { kind: "divider" },
  // Administrace je rozbalená — konfigurátor sedí tady.
  { kind: "group", label: "Administrace", icon: Lock, children: [{ label: "Kategorie", icon: Folder }] },
  { kind: "group", label: "Reporty a statistiky", icon: BarChart },
  { kind: "group", label: "Provoz a správa", icon: PanelLeft },
  { kind: "group", label: "Fakturační centrum", icon: FileList },
  { kind: "divider" },
  { kind: "item", label: "Kalkulačky", icon: Calculator, muted: true },
  { kind: "item", label: "Znalostní báze", icon: Book, muted: true },
];

const KONFIGURATOR_ITEMS: { label: string; icon: LucideIcon; to: LinkProps["to"]; section: SectionKey }[] = [
  { label: "Nastavení pravidel", icon: Settings, to: "/", section: "rules" },
  { label: "Soulad s trasou", icon: Route, to: "/soulad-s-trasou", section: "soulad" },
  { label: "Situace a závažnosti", icon: AlertTriangle, to: "/situace", section: "situace" },
];

/** Tvar položky menu — výška 44 px, plná pilulka jako v aplikaci. */
const navItemBase =
  "mx-3 mb-1 flex h-11 w-[calc(100%-1.5rem)] items-center gap-3 rounded-full px-4 text-left text-[15px] leading-[22px] transition-colors";

/** Vnořená položka pod rozbalenou skupinou. */
const navChildBase =
  "mx-3 mb-1 flex h-10 w-[calc(100%-1.5rem)] items-center gap-2.5 rounded-full pl-9 pr-4 text-left text-[14px] leading-[20px] transition-colors";

function DecorativeItem({ label, icon: Icon, muted }: { label: string; icon: LucideIcon; muted?: boolean }) {
  return (
    <div
      className={cn(navItemBase, "cursor-default", muted ? "text-foreground/30" : "text-muted-foreground")}
      title="Součást Bytorpu — mimo tento prototyp"
    >
      <Icon size={20} className="shrink-0" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </div>
  );
}

function VerticalNav({ current }: { current: SectionKey }) {
  return (
    <aside className="flex w-[260px] shrink-0 flex-col border-r border-border bg-background">
      <div className="flex h-16 shrink-0 items-center gap-2.5 pl-[23px] pr-4">
        <div className="grid size-[30px] shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
          <Sparkles size={18} />
        </div>
        <span className="text-[18px] font-bold tracking-[0.4px]">BYTORP</span>
        <Pushpin size={18} className="ml-auto text-muted-foreground" />
      </div>

      <nav className="flex-1 overflow-y-auto pb-4 pt-2">
        {MENU.map((entry, i) => {
          if (entry.kind === "divider") return <div key={i} className="mx-4 my-2.5 h-px bg-border" />;
          if (entry.kind === "item") return <DecorativeItem key={entry.label} {...entry} />;

          const isAdmin = entry.label === "Administrace";
          return (
            <div key={entry.label}>
              <div
                className={cn(
                  navItemBase,
                  "cursor-default",
                  isAdmin ? "bg-foreground/[0.06] text-foreground" : "text-muted-foreground",
                )}
                title="Součást Bytorpu — mimo tento prototyp"
              >
                <entry.icon size={20} className="shrink-0" />
                <span className="min-w-0 flex-1 truncate">{entry.label}</span>
                {isAdmin ? (
                  <ChevronDown size={18} className="shrink-0" />
                ) : (
                  <ChevronRight size={18} className="shrink-0" />
                )}
              </div>

              {entry.children?.map((child) => (
                <div
                  key={child.label}
                  className={cn(navChildBase, "cursor-default text-muted-foreground")}
                  title="Součást Bytorpu — mimo tento prototyp"
                >
                  <child.icon size={16} className="shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{child.label}</span>
                </div>
              ))}

              {/* Konfigurátor VkŘ visí pod Administrací. */}
              {isAdmin &&
                KONFIGURATOR_ITEMS.map((item) => {
                  const active = item.section === current;
                  return (
                    <Link
                      key={item.label}
                      to={item.to}
                      className={cn(
                        navChildBase,
                        active
                          ? "bg-[linear-gradient(90deg,#8C57FF_0%,rgba(140,87,255,0.72)_100%)] text-white shadow-[0_2px_6px_rgba(140,87,255,0.35)]"
                          : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
                      )}
                    >
                      <item.icon size={16} className="shrink-0" />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    </Link>
                  );
                })}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

export function AppShell({
  current,
  title,
  backTo,
  actions,
  contentLayout = "boxed",
  children,
}: {
  current: SectionKey;
  /** Název stránky — v Bytorpu ho plní useHeading(), proto sedí v navbaru, ne v obsahu. */
  title: string;
  /** Podstránky mají v navbaru šipku zpět (heading.navigateBack v BTLayout.vue). */
  backTo?: LinkProps["to"];
  /** Akce stránky vpravo v navbaru (např. „Nové pravidlo"). */
  actions?: ReactNode;
  /** "boxed" = scrollující obsah do 1440 px, zarovnaný k menu. "full" = obsah si výšku i scroll řídí sám. */
  contentLayout?: "boxed" | "full";
  children: ReactNode;
}) {
  return (
    <div className="flex h-screen w-screen bg-background text-foreground">
      <VerticalNav current={current} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-2.5 px-6">
          {backTo && (
            <Link
              to={backTo}
              aria-label="Zpět"
              className="-ml-2 grid size-[34px] place-items-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
            >
              <ChevronLeft size={22} />
            </Link>
          )}
          <h1 className="text-h4 truncate">{title}</h1>
          <span className="shrink-0 rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.6px] text-accent-foreground">
            prototyp
          </span>

          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            {actions}
            <div
              className="relative grid size-[34px] place-items-center rounded-full text-muted-foreground"
              title="Součást Bytorpu — mimo tento prototyp"
            >
              <Bell size={18} />
              <span className="absolute right-1.5 top-1.5 size-2 rounded-full border-[1.5px] border-background bg-destructive" />
            </div>
            <div className="grid size-[34px] place-items-center rounded-full bg-primary-soft text-[13px] font-semibold text-accent-foreground">
              EK
            </div>
          </div>
        </header>

        {contentLayout === "boxed" ? (
          <main className="min-h-0 flex-1 overflow-auto">
            <div className="max-w-[1440px] px-6 pb-10">{children}</div>
          </main>
        ) : (
          <main className="flex min-h-0 flex-1 flex-col">{children}</main>
        )}
      </div>
    </div>
  );
}
