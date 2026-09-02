import type { ReactNode } from "react";
import { Link, type LinkProps } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import {
  Bell,
  Bill,
  Building,
  Calculator,
  ChevronDown,
  ChevronLeft,
  Circle,
  FileList,
  ListChecks,
  MapPin,
  RecordCircle,
  Settings,
  ShoppingBag,
  Sparkles,
  User,
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

/** Položky reálného menu Bytorpu. V prototypu jsou jen kulisa — nikam nevedou. */
const BYTORP_ITEMS: { label: string; icon: LucideIcon; badge?: string }[] = [
  { label: "Shipee AI", icon: Sparkles },
  { label: "Zásilky", icon: ShoppingBag },
  { label: "Fakturační centrum", icon: FileList },
  { label: "Operátoři", icon: User },
  { label: "Objednatelé", icon: Building },
  { label: "Odesílatelé / příjemci", icon: Bill },
  { label: "Adresy", icon: MapPin },
  { label: "Kalkulátor", icon: Calculator },
  { label: "Věci k řešení", icon: ListChecks, badge: "12" },
];

const KONFIGURATOR_ITEMS: { label: string; to: LinkProps["to"]; section: SectionKey }[] = [
  { label: "Pravidla pro tracking", to: "/", section: "rules" },
  { label: "Soulad s trasou", to: "/soulad-s-trasou", section: "soulad" },
  { label: "Situace a závažnosti", to: "/situace", section: "situace" },
];

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="mx-4 mt-3.5 mb-1.5 flex items-center gap-2 px-3 text-[12px] leading-[14px] font-medium uppercase tracking-[0.8px] text-muted-foreground">
      <span className="whitespace-nowrap">{children}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

/** Společný tvar položky menu — výška 44 px, poloměr 0.4rem (@core placeholders). */
const navItemBase =
  "mx-4 mb-1.5 flex h-11 w-[calc(100%-2rem)] items-center gap-2.5 rounded-[0.4rem] px-3 text-left text-[15px] leading-[22px] transition-colors";

function DecorativeItem({ label, icon: Icon, badge }: { label: string; icon: LucideIcon; badge?: string }) {
  return (
    <div
      className={cn(navItemBase, "cursor-default text-muted-foreground")}
      title="Součást Bytorpu — mimo tento prototyp"
    >
      <Icon size={22} className="shrink-0" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {badge && (
        <span className="rounded-full bg-primary-soft px-1.5 text-[12px] leading-[18px] tabular-nums text-accent-foreground">
          {badge}
        </span>
      )}
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
        <span className="text-[19px] font-semibold tracking-[0.2px]">Bytorp</span>
        <RecordCircle size={18} className="ml-auto text-muted-foreground" />
      </div>

      <nav className="flex-1 overflow-y-auto pb-4 pt-1">
        <SectionTitle>Dashboards</SectionTitle>
        {BYTORP_ITEMS.map((item) => (
          <DecorativeItem key={item.label} {...item} />
        ))}

        <SectionTitle>Nastavení</SectionTitle>
        <div className={cn(navItemBase, "cursor-default bg-foreground/5 text-foreground")}>
          <Settings size={22} className="shrink-0" />
          <span className="min-w-0 flex-1 truncate">Konfigurátor VkŘ</span>
          <ChevronDown size={18} className="shrink-0" />
        </div>
        {KONFIGURATOR_ITEMS.map((item) => {
          const active = item.section === current;
          return (
            <Link
              key={item.label}
              to={item.to}
              className={cn(
                navItemBase,
                "h-[38px] text-[14px]",
                active
                  ? "bg-primary text-primary-foreground elevation-3"
                  : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
              )}
            >
              <Circle size={8} className={cn("ml-1.5 shrink-0", active ? "opacity-100" : "opacity-70")} />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
            </Link>
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
  /** "boxed" = scrollující obsah do 1440 px. "full" = obsah si výšku i scroll řídí sám. */
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
            <div className="mx-auto max-w-[1440px] px-6 pb-10">{children}</div>
          </main>
        ) : (
          <main className="flex min-h-0 flex-1 flex-col">{children}</main>
        )}
      </div>
    </div>
  );
}
