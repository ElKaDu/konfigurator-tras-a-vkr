# Checklist — reaktivní pravý sloupec, záhlaví zásilky, úpravy levého sloupce

## Kontext

Po dokončení "light flow" přepracování položky checklistu (viz
[`2026-07-30-checklist-polozka-light-flow-design.md`](2026-07-30-checklist-polozka-light-flow-design.md))
přišlo další kolo zpětné vazby, které mění celkovou stránku `/checklist`:

1. Stránka dostává vlastní záhlaví zásilky místo sdílené navigace.
2. Přibývá třetí (pravý) sloupec, který se chová čistě reaktivně — nic v něm není vidět, dokud
   operátorka něco nenaklikne.
3. Levý sloupec ztrácí duplicitní/zbytečný obsah (věci k řešení, samostatný seznam vyřešených bodů).

Tento dokument popisuje všechny tři části jako jeden spec — jsou nezávislé, ale řeší se společně.

Wireframe: [`mockups/2026-07-30-checklist-pravy-sloupec-zahlavi-wireframe.html`](../../../mockups/2026-07-30-checklist-pravy-sloupec-zahlavi-wireframe.html).

## Datový model — `KontaktStatus` dostává `"draft"`

```ts
export type KontaktStatus = "draft" | "planned" | "done";
```

- **`draft`** — call je "rozjednaný": vznikl automaticky zatržením prvního checkboxu (podezření
  nebo potvrdit s klientem) na libovolné položce, `scheduledAt` je prázdné.
- **`planned`** — operátorka doplnila termín. Přechod `draft → planned` nastává čistě tím, že
  `scheduledAt` přestane být prázdné — není to samostatná akce/tlačítko.
- **`done`** — operátorka klikla "✓ Call proběhl".

`Kontakt.scheduledAt` se mění z povinného `string` na `string | undefined` (draft nemá termín).

## Auto-vytvoření draftu (rozšíření `kontaktSync.ts`)

Dosavadní `syncKontaktAttachment` uměl položku připojit jen k **existujícímu** `"planned"`
kontaktu. Nově:

```ts
if (needsContact && !next.kontaktId) {
  let target = kontaktyStore.all().find((k) => k.status === "draft" || k.status === "planned");
  if (!target) {
    target = { id: "kontakt_" + Date.now(), type: "customer", status: "draft", linkedItemIds: [] };
    kontaktyStore.create(target);
  }
  checklistItemsStore.update(next.id, { kontaktId: target.id });
  if (!target.linkedItemIds.includes(next.id)) {
    kontaktyStore.update(target.id, { linkedItemIds: [...target.linkedItemIds, next.id] });
  }
}
```

Detach větev (žádný checkbox už není zatržený → odpojit od kontaktu) se nemění. Pokud odpojením
poslední položky zůstane `draft` kontakt bez `linkedItemIds` a bez termínu, zůstává v datech (jen
zmizí z pravého sloupce, protože sekce se zobrazuje, jen když existuje aspoň jeden `draft`/`planned`
kontakt s navázanou položkou nebo rozepsaným termínem — viz níže).

## Pravý sloupec

Nový sloupec (třetí ve `grid-template-columns`) v `ChecklistPage.tsx`, se dvěma nezávislými
sekcemi:

### Sekce "Plánování callu"

- **Prázdný stav**: jen malé trvalé tlačítko **"+ Naplánovat kontakt ručně"**. Klik vytvoří prázdný
  `draft` kontakt (`type: "customer"`, žádné navázané položky) a zobrazí kartu níže.
- **Karta** (jakmile existuje `draft` nebo `planned` kontakt): needitovatelný náhled napojených
  položek — název + hodnota příslušného pole (nález, pokud je zatržené podezření; řešení, pokud je
  zatržené potvrdit s klientem; obě, pokud jsou zatržené obě) — pak editovatelná pole **Typ**,
  **Termín**, **Poznámka** (autosave na `onChange`, žádné tlačítko Uložit). Štítek karty:
  "rozjednáno" (bez termínu) / "naplánováno" (s termínem) — odvozeno z `!!scheduledAt`, ne uložený
  stav navíc.
- Na kartě je tlačítko **"✓ Call proběhl"** → `status: "done"`. Karta se po kliknutí zploští na
  needitovatelný historický záznam (typ, datum, poznámka jako prostý text, bez formulářových polí).
  `KontaktSchedulerDialog.tsx` se tímto stává nepotřebný a **ruší se** — veškeré plánování callu se
  teď děje inline v tomto pravém sloupci, ne v modálu.
- `KontaktWidget.tsx` (dnešní widget nahoře na stránce) se **ruší** — jeho roli "vidět na první
  pohled, že něco čeká na kontakt" přebírá stavový štítek už dnes existující vedle nadpisu
  (`computeChecklistStatus` → "⏱ Čeká na kontakt" / "⏱ Po termínu kontaktu"), který se teď zobrazuje
  v novém záhlaví zásilky (viz níže). Žádný samostatný "Kontakt naplánován" box nahoře už není.
  `computeChecklistStatus` už dnes filtruje jen `status === "planned"` (`derived.ts`) — díky tomu se
  status badge sám o sobě nezmění, dokud kontakt zůstává v `"draft"`, a přepne se přesně ve chvíli,
  kdy operátorka zadá termín. Tahle funkce se tedy nemusí nijak upravovat, jen nesmí nikdo omylem
  rozšířit její filtr o `"draft"`.

### Sekce "Věci k řešení"

- Karty ve stylu `mockups/2026-07-16-vkr-operator-karta.html` (název, kategorie/situace, badge,
  "nalezeno"/řešení box, poznámka) pro každou `ChecklistVkr` vzniklou z checklistu.
- Sekce se zobrazuje, jen když existuje aspoň jedna taková věc k řešení (prázdný stav = sekce úplně
  chybí, žádný placeholder).
- U položky v checklistu (`ChecklistItemRow`) se štítek "⏳ sleduje se" mění na klikací odkaz —
  klik scrollne pravý sloupec na příslušnou kartu a krátce ji zvýrazní (stejná mechanika jako
  proklik na vyřešené body, viz níže).

## Levý sloupec

- **Panel "Věci k řešení na checklistu" (`VkrPanel.tsx`) se ruší celý.** Jeho dva statické řádky
  "Krok 1 mock" ("Přiřazení objednávky — volný zákazník" #4471-A a "Čeká na zaplacení" #4471-C)
  nemizí, ale stěhují se do `Krok1Mock.tsx` (prostřední sloupec) — ten už dnes má needitovatelný
  accordion s "Kontrola přiřazení zákazníka" (stejné VkŘ #4471-A). "Čeká na zaplacení" (#4471-C)
  přibývá jako další needitovatelný řádek ve stejném stylu vedle "Kontrola potřebné expertizy".
  Všechny tři řádky v `Krok1Mock` zůstávají čistě statické (needituje se, nereaguje na store), jak
  komponenta funguje dnes.
- **"Kapitoly kontrol" (`CategoryNav.tsx`)**: číslo `resolved/total` u kapitoly, která má aspoň
  jednu vyřešenou položku, je klikací odkaz. Klik scrollne **hlavní (druhý) sloupec** na sekci dané
  kapitoly a rozbalí její existující "▸ Hotovo (N)" disclosure (z `ItemsList.tsx`, Task 7 předchozího
  kola) — žádný nový seznam se v levém sloupci nevytváří, jen se ovládá to, co už existuje vedle.
  Kapitoly s `0/N` zůstávají prostý text, bez odkazu.
- **"Shrnutí" (`ShrnutiNalezuPanel.tsx`)** se rozšiřuje o třetí řádek za položku: vedle **Nález** a
  **Poznámka** přibývá **Řešení** (ze stejného `item.resolutionValue`). Součástí zůstávají i
  poznámky z callů (beze změny z minulého kola) — call v `"done"` stavu se v tomhle seznamu
  zobrazuje úplně stejně jako `"planned"`, jen s jiným štítkem (proběhl/naplánován), takže
  "propsání do Shrnutí" po kliknutí na "Call proběhl" nevyžaduje žádnou zvláštní logiku navíc — je to
  přirozený důsledek toho, že `ShrnutiNalezuPanel` už dnes vypisuje všechny kontakty bez ohledu na
  stav.

## Záhlaví stránky

- Nová komponenta `ShipmentHeader.tsx`, kterou `ChecklistPage.tsx` používá **místo** `AppHeader`.
  Ostatní tři routy (`/`, `/soulad-s-trasou`, `/situace`) nadále používají `AppHeader` beze změny.
- Obsah: ikonka + číslo objednávky + stavové štítky (Krok 2, `computeChecklistStatus`) na horním
  řádku; pod tím řádek atributů (odkud→kam, přepravce, hodnota, operátor) z existujících mock dat
  checklistu (ne pole z Poptávky jako na screenshotu — jiná fáze, jiná data).
  **Limit zpracování** je vizuálně oddělený, výrazný box (velké tučné číslo, warning barva) napravo
  od atributů — jediná časově kritická informace v záhlaví.
- Žádná navigace, žádná cesta zpět (žádná šipka, žádné logo) — stránka je na `/checklist` úplně
  izolovaná.

## Co se nemění

- Levá/hlavní logika položky (`ChecklistItemRow.tsx`, `TemplatedField.tsx`, `deriveItemState`) —
  beze změny, jen `kontaktSync.ts` dostává rozšířenou attach logiku popsanou výše.
  `waitingContactDetail`/pilulka "čeká na kontakt · ..." u položky beze změny.
- `Krok1Mock.tsx` beze změny.

## Ověření

Bez testovacího frameworku — `tsc --noEmit` + ruční průchod: zatržení checkboxu vytvoří draft a
zobrazí kartu v pravém sloupci; zadání termínu přepne štítek na "naplánováno" a stavový štítek v
záhlaví na "čeká na kontakt"; "Call proběhl" zploští kartu a informace se objeví ve Shrnutí; klik na
číslo kapitoly v levém sloupci scrollne a rozbalí Hotovo v hlavním sloupci; klik na "sleduje se"
scrollne na kartu věci k řešení v pravém sloupci; založení věci k řešení bez existujícího callu
nezpůsobí žádnou chybu (obě sekce pravého sloupce jsou nezávislé); reset prototypu vrátí vše
(včetně nových `draft` kontaktů) do seed stavu.
