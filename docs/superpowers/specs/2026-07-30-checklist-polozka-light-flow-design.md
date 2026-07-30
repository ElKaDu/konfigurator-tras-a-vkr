# Checklist položka — light flow (nález/řešení jako nezávislá pole)

## Kontext

Prototyp checklistu objednávky (`/checklist`) má hotový první průchod: 5stavový model položky
(`open`/`resolved_ok`/`resolved_found`/`waiting_contact`/`waiting_delivery`) a modální
`ItemResolutionForm`, který krok za krokem kopíroval rozhodovací uzly klientova flowchartu
("Ano, znám řešení" / "Ne, budu kontaktovat klienta"...).

Po vyzkoušení prototypu a rozboru klientova PDF flow přišla zpětná vazba, že je to pro operátorku
zbytečně svazující a "kopíruje flowchart" místo aby bylo příjemné na použití. Tento dokument popisuje
přepracování na lehčí model: **nález a řešení jsou dvě nezávislá, kdykoliv editovatelná pole**,
vyřešení položky je vždy ruční akce a stav se z polí jen odvozuje.

Cílem je nahradit modální/vícekrokový formulář dvěma vždy viditelnými řádky s dropdowny, bez
vynucené posloupnosti kroků a s minimem tlačítek.

## Rozhodnutí z brainstormingu

- Nález i Řešení se vybírají z **dropdownu specifického pro danou šablonu položky** (`findingOptions`,
  `resolutionOptions`), vždy s volbou "Jiné…", která odkryje volné textové pole. Šablona bez
  předdefinovaného seznamu rovnou ukazuje textové pole.
- Vyplnění není povinné u ani jednoho pole — jde o doporučení, ne vynucený krok.
- Nález i Řešení mají **každý svůj vlastní nezávislý checkbox**: u Nálezu "podezření", u Řešení
  "potřeba potvrdit s klientem". Zatržení kteréhokoli z nich přepne položku do stavu čeká na kontakt
  a automaticky ji naváže na sdílený call.
- Změny v polích/checkboxech se ukládají okamžitě (autosave) — žádné tlačítko "Uložit".
- Vyřešení položky je **vždy jen ruční akce** — tlačítko "Označit jako vyřešeno" je k dispozici stále,
  bez ohledu na to, co je vyplněné.
- "Založit věc k řešení" (VkŘ pro sledování) se nabízí, jen když je vyplněné Řešení **a** šablona
  položky je podle analýzy označená, že u ní řešení typicky vyžaduje další sledování. Založení věci
  je nezávislé na stavu položky — i vyřešená položka může mít založené sledování.
- Kontext zásilky se otevírá přes samostatný viditelný prvek ("🛈 kontext zásilky") vedle názvu, ne
  jen klikem na název samotný.
- Rozložení: oba řádky (Nález, Řešení) jsou vždy vedle sebe pod názvem položky, ne skryté za
  rozbalením.

Wireframe s celým cyklem: [`mockups/2026-07-30-checklist-polozka-light-wireframe.html`](../../../mockups/2026-07-30-checklist-polozka-light-wireframe.html).

## Datový model

### `ChecklistItemState` se zjednodušuje na 3 hodnoty

```ts
export type ChecklistItemState = "open" | "waiting_contact" | "resolved";
```

`state` se v novém modelu **neukládá ručně** — je to čistě odvozená hodnota ze tří uložených polí
(viz `deriveItemState` níže). To odstraňuje riziko, že si uložený `state` a uložená pole (checkboxy)
odporují.

### `ChecklistItem`

```ts
export interface ChecklistItem {
  id: string;
  templateId: string;

  findingValue?: string;        // vybraná možnost z findingOptions, nebo volný text po "Jiné…"
  findingIsSuspicion: boolean;  // checkbox u Nálezu — default false

  resolutionValue?: string;     // vybraná možnost z resolutionOptions, nebo volný text
  resolutionNeedsConfirm: boolean; // checkbox u Řešení — default false

  manuallyResolved: boolean;    // jediný způsob, jak nastavit stav "resolved" — default false
  resolvedAt?: string;
  resolvedBy?: string;

  kontaktId?: string;           // vyplněno, dokud je položka navázaná na (aktivní) kontakt
  trackingVkrId?: string;       // nezávislé na stavu — položka může mít sledování i po vyřešení
  noteValue?: string;           // volná poznámka, viz sekce „Poznámka na položce" níže
}
```

Odstraněná pole oproti současnému modelu: `finding`, `resolution`, `vkrId` (přejmenováno na
`trackingVkrId`, ať je jasné, že jde o odznak, ne o stav).

### Odvození stavu (`derived.ts`)

```ts
export function deriveItemState(item: ChecklistItem): ChecklistItemState {
  if (item.manuallyResolved) return "resolved";
  if (item.findingIsSuspicion || item.resolutionNeedsConfirm) return "waiting_contact";
  return "open";
}

export function waitingContactDetail(item: ChecklistItem): "missing_resolution" | "needs_confirm" {
  return item.resolutionValue ? "needs_confirm" : "missing_resolution";
}
```

`waitingContactDetail` řídí doplňkový popisek pilulky: "čeká na kontakt · řešení chybí" vs.
"čeká na kontakt · řešení k potvrzení". Volá se, jen když `deriveItemState(item) === "waiting_contact"`.

`isResolved`, `categoryCounts` a `computeChecklistStatus` v `derived.ts` se přepočítají na
`deriveItemState(item) === "resolved"` / `"waiting_contact"` místo dřívějšího porovnání s
`resolved_ok`/`resolved_found`. Dosavadní `findingsSummary` se ruší — nahrazuje ji obecnější
`noteworthyItems`, viz sekce „Přehled callů a poznámek/nálezů" níže.

### `ChecklistItemTemplate` — nová pole

```ts
export interface ChecklistItemTemplate {
  id: string;
  category: ChecklistCategory;
  order: number;
  title: string;
  description: string;
  context: ContextField[];

  findingOptions: string[];      // prázdné pole = rovnou textové pole místo dropdownu
  resolutionOptions: string[];   // prázdné pole = rovnou textové pole místo dropdownu
  canTrackForMonitoring: boolean; // řídí, jestli se nabízí "Založit věc k řešení"
}
```

Dropdown vždy interně přidává poslední volbu "Jiné…", která přepne pole do textového inputu; není
součástí `findingOptions`/`resolutionOptions` v datech.

V `seed.ts` doplním `findingOptions`/`resolutionOptions` pro všech 8 existujících šablon (reálné
možnosti odpovídající jejich `description`/`context`, ne prázdné pole) a `canTrackForMonitoring: true`
u šablon, kde už dnes existuje seedovaná VkŘ (`tpl_celni_faktura`) nebo kde to dává smysl podle
kontextu (`tpl_eori`), jinde `false`.

### Kontakt — auto-attach místo ručního výběru

`kontaktyStore`/`Kontakt` typ zůstává beze změny. Mění se **kdy a jak** se `kontaktId` nastavuje:

- Když se `findingIsSuspicion` nebo `resolutionNeedsConfirm` změní na `true` a existuje kontakt se
  `status: "planned"`, položka se k němu rovnou přiřadí (`kontaktId` = ten kontakt, `linkedItemIds`
  se rozšíří o `item.id`).
- Pokud žádný naplánovaný kontakt neexistuje, položka zůstane s `kontaktId: undefined` — ve
  stavu `waiting_contact`, ale nenavázaná — dokud se přes `KontaktWidget` nezaloží nový kontakt.
- `KontaktSchedulerDialog` se zjednodušuje: **odstraňuje se ruční checkbox výběr položek.** Dialog
  při otevření spočítá všechny položky, které jsou aktuálně `waiting_contact` a nemají `kontaktId`,
  zobrazí je jako needitovatelný náhled ("Tento call se týká N položek: ...") a po odeslání je
  všechny hromadně naváže. Formulář (typ, termín, poznámka) zůstává stejný.
- Pokud operátorka zatrhne checkbox u další položky **poté**, co je kontakt už naplánovaný, položka
  se k němu přiřadí okamžitě (bez dialogu) — odpovídá zadání "jeden call pro vše, co čeká", které
  bylo potvrzené dřív v tomto brainstormingu.
- Pokud operátorka odškrtne oba checkboxy dřív, než kontakt proběhne (položka se tedy vrací do
  `open`), položka se od kontaktu odpojí: `kontaktId` se vyprázdní a `id` se odebere z
  `kontakt.linkedItemIds`. Samotný kontakt (pokud má ještě jiné navázané položky) zůstává beze
  změny.

## UI — `ChecklistItemRow`

Nahrazuje se dnešní `ItemResolutionForm` (dvoumódový modální formulář s tlačítky "V pořádku" /
"Nahlásit nález" / "Vyhodnotit po kontaktu") dvěma vždy viditelnými řádky přímo v `ChecklistItemRow`:

- **Řádek Nález**: `<select>` z `template.findingOptions` (+ "Jiné…") nebo rovnou `<input>`, pokud
  `findingOptions` je prázdné; vedle checkbox "podezření". Změna se ukládá okamžitě přes
  `checklistItemsStore.update`.
- **Řádek Řešení**: stejná mechanika, checkbox "potvrdit s klientem".
- Pod řádky: tlačítko **"✓ Označit jako vyřešeno"** (vždy dostupné, nastaví `manuallyResolved: true`,
  `resolvedAt`, `resolvedBy`) a podmíněně **"+ Založit věc k řešení"**, když
  `item.resolutionValue` existuje a `template.canTrackForMonitoring`.
- U vyřešených položek (`deriveItemState === "resolved"`) se řádky s dropdowny skryjí a nahradí
  souhrnným řádkem "Nález: … · Řešení: …" (prázdné pole se v souhrnu vynechá), název ztmavne,
  vedle pilulky "vyřešeno" se zobrazí i doplňkový štítek "⏳ sleduje se", pokud má `trackingVkrId`.
- Vedle názvu položky přibývá samostatný prvek `🛈 kontext zásilky` (button), který přepíná
  zobrazení `ItemContext` — dosavadní klik na celý název se ruší, aby byla afordance viditelná.
  Konkrétní umístění `ItemContext` je otevřené kreativní rozhodnutí implementace: zkusit variantu,
  kde je kontext vidět vedle řádků Nález/Řešení (ne jen jako blok nad/pod nimi po kliknutí) — např.
  jako postranní panel po pravé straně obou řádků, viditelný, jakmile jsou pole rozkliknutá/aktivní.
  Pokud se to prostorově neosvědčí (úzký sloupec, moc obsahu), padá to zpátky na dnešní
  nad/pod-blokové zobrazení po kliknutí na `🛈`.

`ItemResolutionForm.tsx` se celý odstraňuje; jeho logiku (dropdown + "Jiné…" pole) nahrazuje menší
sdílená komponenta pro jeden řádek (např. `TemplatedSelect`), použitá dvakrát v `ChecklistItemRow`
(pro nález i řešení) — vyhne se to duplicitě mezi oběma řádky.

## Vrácení vyřešené položky zpět

Vyřešená položka (souhrnný řádek) dostává malý odkaz **"↺ vrátit do otevřeného stavu"**. Akce jen
nastaví `manuallyResolved: false` a smaže `resolvedAt`/`resolvedBy` — `findingValue`, `resolutionValue`
i oba checkboxy zůstávají beze změny, takže se nic nemaže, jen se odemkne k další editaci. Stav se
pak znovu odvodí přes `deriveItemState` (vrátí se buď do `open`, nebo rovnou do `waiting_contact`,
pokud byl některý checkbox zatržený už předtím).

## Hotové položky se sbalují pryč

V `ItemsList` se v rámci každé kategorie položky řadí do dvou skupin: nevyřešené (`open` +
`waiting_contact`, v pořadí podle `template.order` jako dnes) nahoře, a pod nimi jedna sbalitelná
sekce **"▸ Hotovo (N)"** se všemi `resolved` položkami té kategorie — sbalená ve výchozím stavu.
Rozbalením se ukážou souhrnné řádky včetně odkazu na vrácení zpět. Díky tomu hlavní pohled na
kategorii vždy ukazuje jen to, co ještě zbývá udělat; `categoryCounts` (Hotovo N/Celkem) se nemění,
jen se podle něj řídí štítek u sbalovací sekce.

## Navigace a nadpis "Krok 2"

- `AppHeader.tsx`: mezi `NavLink` pro "Situace a závažnosti" a "Checklist objednávky" přibývá stejný
  vizuální oddělovač, jaký je dnes mezi logem a navigací (`<div className="h-5 w-px bg-border" />`).
  Vizuálně tak oddělí checklist (jiný nástroj, práce na konkrétní objednávce) od trojice
  Pravidla/Soulad/Situace (engine pravidel a tracking).
- `ChecklistPage.tsx`: badge vedle `<h1>` se mění z "Objednávka · Vyhodnocení a kontrola" na
  explicitní **"Krok 2 — Vyhodnocení a kontrola"**, aby bylo hned v nadpisu jasné, o který krok jde
  (dnes je "Krok 2" schované jen jako malý label u progress baru níž na stránce).

## Poznámka na položce

`ChecklistItem` dostává zpět pole `noteValue?: string` — volný text, autosave, bez tlačítka Uložit,
viditelný přímo v `ChecklistItemRow` pod řádky Nález/Řešení. Je to jediné úložiště té poznámky: když
se stejná hodnota zobrazí i v kontextu callu (viz níže), jde o čtení téhož pole, ne o kopii — úprava
na jednom místě se projeví všude.

`Kontakt.note` zůstává samostatné pole (zápis o samotném callu — agenda i výsledek), beze změny
oproti dnešku: editovatelné kdykoliv, i po tom, co `status` přejde na `"done"`.

## Přehled callů a poznámek/nálezů (rozšíření `ShrnutiNalezuPanel`)

`ShrnutiNalezuPanel` se rozšiřuje o dvě části nad sebou:

- **Cally** — seznam všech `Kontakt` záznamů (naplánované i proběhlé, ne jen nejbližší jako dnešní
  `KontaktWidget`), each s typem, časem, stavem (naplánován/proběhl) a přímo editovatelným `note`.
- **Položky s nálezem nebo poznámkou** — nahrazuje dnešní `findingsSummary` (která bere jen
  `state === "resolved_found"`) obecnějším `noteworthyItems(items)`, jenž vrací všechny položky, kde
  `item.findingValue` nebo `item.noteValue` není prázdné, bez ohledu na `deriveItemState`. U každé se
  zobrazí nález (pokud je) a poznámka (pokud je).

Nadpis panelu se zkracuje z "Shrnutí nálezů" na **"Shrnutí"**, ať odpovídá širšímu obsahu. Zůstává to
jeden panel v levém sloupci — žádný nový panel nepřibývá.

## Co se nemění

- `ChecklistVkr`, `checklistVkrStore` (`create`/`resolve`) — beze změny, jen `item.vkrId` →
  `item.trackingVkrId` v poli, na které se váže.
- `VkrPanel`, `CategoryNav` — čtou přes `derived.ts` helpery, takže jim stačí, že `deriveItemState`
  vrací stejný tvar dat jako dřív; drobné úpravy jen tam, kde dnes přímo porovnávají
  `item.state === "resolved_found"` apod. (`ShrnutiNalezuPanel` se mění, viz sekce výše.)
- `Krok1Mock`, `KontaktWidget` (kromě zjednodušení dialogu popsaného výše) — beze změny.

## Ověření

Bez testovacího frameworku v repu (stejně jako u předchozí iterace) — ověření přes `tsc --noEmit` a
ruční průchod v prohlížeči: projít všechny stavy z wireframu (open → 2a/2b/2c → věc k řešení →
resolved → sleduje se), potvrdit auto-attach na kontakt (jeden i víc položek), potvrdit že žádné pole
není povinné pro vyřešení, a že reset prototypu (`resetChecklistPrototype`) vrátí i nová pole do
seed stavu.
