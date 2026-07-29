import { Phone } from "lucide-react";

/**
 * Krok 1 (Oprávněnost zpracovat objednávku) je v tomto prototypu jen náhled — needituje se, nereaguje na
 * store. Skutečná logika (VkŘ pro přiřazení zákazníka a expertizu) je mimo rozsah tohoto prototypu.
 */
export function Krok1Mock() {
  return (
    <details className="mb-4 rounded-lg border border-border bg-card" open={false}>
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm">
        <span className="text-muted-foreground">▶</span>
        <b>Krok 1 · Oprávněnost zpracovat objednávku</b>
        <span className="rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-semibold text-success-foreground">
          vyřešeno 2/2
        </span>
        <span className="ml-auto text-xs text-muted-foreground">proběhlo před přiřazením — jen náhled</span>
      </summary>
      <div className="space-y-2 border-t border-border px-4 py-3 text-sm">
        <div className="flex gap-2">
          <span className="mt-0.5 flex size-4 items-center justify-center rounded bg-success text-[10px] text-success-foreground">
            ✓
          </span>
          <div>
            <div className="font-medium">Kontrola přiřazení zákazníka</div>
            <div className="text-xs text-muted-foreground">
              Volný zákazník — vyřešeno přiřazením 9:38. <span className="opacity-70">VkŘ #4471-A</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <span className="mt-0.5 flex size-4 items-center justify-center rounded bg-success text-[10px] text-success-foreground">
            ✓
          </span>
          <div>
            <div className="font-medium">Kontrola potřebné expertizy</div>
            <div className="text-xs text-muted-foreground">
              Pravidlo nenašlo shodu — VkŘ nevzniklo, splněno automaticky.
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          <Phone className="size-3.5 shrink-0" />
          Náhled dashboardu operátorů (před přiřazením) a skutečný VkŘ mechanismus jsou mimo rozsah tohoto
          prototypu — viz mockups/2026-07-29-prirazeni-stavy-wireframe.html.
        </div>
      </div>
    </details>
  );
}
