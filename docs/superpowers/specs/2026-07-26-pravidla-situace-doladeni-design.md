# Design: Doladění Pravidel a Situací (punch list ze dne 2026-07-26)

**Datum:** 2026-07-26
**Status:** Rozhodnuto a implementováno v prototypu i ve `specifikace-situace-akce-tracking.md`.

> Tento dokument je interní záznam rozhodnutí z brainstormingové session, ne samostatný zdroj pravdy — ten zůstává `specifikace-situace-akce-tracking.md`. Slouží jako kontext, PROČ byla jednotlivá rozhodnutí udělána, pro budoucí referenci.

## Kontext

Po dokončení základního designu Situace/Závažnost/Akce (`2026-07-15-situace-zavaznost-akce-design.md`, `2026-07-24-akce-needitovatelne-design.md`) prošel uživatel appky (business) klikací prototyp a nahlásil sadu drobných nekonzistencí a otevřených otázek. Tento dokument shrnuje rozhodnutí ke všem bodům a odkazuje na odpovídající sekce `specifikace-situace-akce-tracking.md`, kde je definováno cílové chování do detailu.

## Rozhodnutí

1. **Katalog akcí — mazání z dropdownu.** Popelnice u každé položky v `ActionTagPicker`, guard přes `actionTagUsageCount` (nová helper funkce v `store.ts`) — needitovatelná, pokud je akce použitá u libovolné Závažnosti. Viz spec §4.1, §4.4.

2. **Přejmenování priorit.** `LOW/MEDIUM/HIGH/URGENT` → `Nízká/Vyšší/Vysoká/Urgentní` všude v UI (interní hodnoty `low/medium/high/urgent` beze změny). Viz spec §2, příloha datových typů.

3. **Situace/Závažnost zůstává editovatelná i po uložení Pravidla.** Původní návrh (`2026-07-15` spec, bod 3.1) počítal s needitovatelností po založení — uživatel appky tohle zamítl jako zbytečné omezení. Prototyp už se tak chová, jen doplněna specifikace (§3). Historický `2026-07-15` design dokument zůstává neopravený (je to uzavřený, dřívější rozhodovací záznam) — aktuální pravda je vždy `specifikace-situace-akce-tracking.md`.

4. **Pravidlo ztrácí aktivní/neaktivní.** Uložené Pravidlo rovnou běží, žádný přepínač. `active` odstraněno z `Rule` typu, seed dat, wizardu i seznamu. Viz spec §5.3, §5.7.

5. **Pravidlo ztrácí vlastní Prioritu — needitovatelně odvozena ze Závažnosti.** Stejný mechanismus živého odkazu jako u Akcí (`resolveRuleActions`) — nová funkce `resolveRulePriority` v `ruleDisplay.ts`. `Rule.priority` v datovém modelu zůstává (kvůli oblastem mimo Situace/Závažnost), ale ve wizardu se už nezobrazuje ani needitovatelně — plyne jen z vybrané Závažnosti. Viz spec §4.5, §5.3, §5.6.

6. **Situace dostává „Uložit"/„Zpět", ztrácí autosave.** Konzistence s Pravidlem. `SituationEditorPage` teď drží lokální draft (`draftName`/`draftDescription`/`draftSeverities`) a commituje do store až na klik. Viz spec §4.3.

7. **Navigace po „+ Pravidlo pro tuto závažnost".** Po uložení nově založeného Pravidla (jen tímhle vstupním bodem, ne při editaci) se uživatel vrátí na `/situace/:id`, ne na obecný seznam. Viz spec §4.3, §5.6.

8. **Administrativní status — varianta „pauza", ne „přeskočit a počítat dál".** Diskutováno graficky (`mockups/2026-07-26-casovac-historie-logika-diagram.html`, sekce 1) — dokud je aktuální status administrativní, odpočet neběží vůbec, bez ohledu na to, jak dávno přišel poslední reálný záznam. Čistě spec-textová změna (runtime evaluátor v prototypu neexistuje) + přeformulovaná needitovatelná poznámka v `RuleCreatorPage.tsx`. Viz spec §5.4.

9. **„Poslední záznam" vs. „kdekoliv v historii" — sémantika podle typu Spouštěče.** Diagram viz sekce 2 stejného mockupu. Pro Automaticky se label prvního tlačítka mění na „Jen předchozí záznam" (vylučuje právě příchozí záznam, který se řeší v bloku 5.5.1); pro Časovač zůstává „jen poslední záznam" beze změny. Implementováno přes nový prop `triggerType` na `TrackingHistoricalConditionsBuilder`. Viz spec §5.5.2.

10. **Seznam Pravidel — redesign.** Levý filtrovací sloupec (Všechna/Pouze aktivní/Archiv) mizí úplně — archivace jako koncept neexistuje. Filtr podle priority se přesouvá do chipů nad tabulku. Řádek ztrácí kód a tečku aktivní/neaktivní. Zkratkové tlačítko „Situace a závažnosti →" v horní liště mizí (duplicita s hlavní navigací). Viz spec §5.7.

11. **Detail Pravidla — dvě záložky, ne tři.** „Test" (čistě demonstrační, náhodně generovaný výsledek) odstraněn. „Shrnutí" → „Detail pravidla". „Historie" zůstává needitovatelný placeholder — otevřená otázka (hloubka historie běhů) zapsána do kapitoly 8 specifikace.

12. **UI doladění — konzistentní boxy podmínek.** Všechny tři bloky Podmínek (5.5.1–5.5.3) mají teď stejný vizuální rámec — dřív ho měl jen „Co dále platí".

## Vizuální podklady vytvořené v této session

- `mockups/2026-07-26-pravidla-situace-doladeni-wireframe.html` — souhrnný wireframe všech změn (barevně odlišené nové/odstraněné/upravené prvky).
- `mockups/2026-07-26-casovac-historie-logika-diagram.html` — dva diagramy: pauza vs. počítání dál u administrativního statusu; poslední záznam podle typu Spouštěče.

## Rozsah a hranice

Všechny body v tomto dokumentu jsou **UI/datový model/spec-text** změny — žádná z nich nezavádí runtime vyhodnocovací engine (ten zůstává mimo rozsah, viz `specifikace-situace-akce-tracking.md` §1.2). Body 8 a 9 explicitně jen fixují cílovou logiku pro engine, který ještě neexistuje.

## Implementace

Provedeno přímo v této session (bez samostatného `writing-plans` kroku — rozsah byl už plně vyjasněný diskuzí a schválenými wireframy):

- `src/lib/model/types.ts` — `Rule.active` odstraněno.
- `src/lib/model/seed.ts` — `active: true` odstraněno ze všech seed Pravidel.
- `src/lib/model/store.ts` — nová `actionTagUsageCount`.
- `src/lib/model/ruleDisplay.ts` — `priorityLabel` přemapováno na česká slova, nová `resolveRulePriority`.
- `src/components/situations/SeverityCard.tsx` — přejmenované labely priority.
- `src/components/situations/ActionTagPicker.tsx` — popelnice + guard.
- `src/components/situations/SituationEditorPage.tsx` — draft/save vzor.
- `src/components/situations/SituationsListPage.tsx` — odstraněn kód/tečka z vnořených karet Pravidel, priorita přes `resolveRulePriority`.
- `src/components/rules/RuleCreatorPage.tsx` — odstraněna Priorita/Aktivní, box konzistence, navigace po uložení, přeformulovaná poznámka o administrativním statusu.
- `src/components/rules/editors/TrackingHistoricalConditionsBuilder.tsx` — `triggerType` prop, dynamický label.
- `src/components/rules/RulesList.tsx` — redesign (bez levého sloupce, chipy, zjednodušený řádek, dvě záložky detailu).
- `specifikace-situace-akce-tracking.md` — aktualizováno napříč kapitolami 2, 4, 5, 7, 8 a přílohou datových typů.

Ověřeno v běžícím prototypu (dev server, `npx tsc --noEmit` bez nových chyb).
