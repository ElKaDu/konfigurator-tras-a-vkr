# Design: Akce na pravidle jsou needitovatelné, jen převzaté ze závažnosti

**Datum:** 2026-07-24
**Status:** Design dokončen, čeká na finální review uživatele před přechodem na implementační plán.

> Navazuje na `docs/superpowers/specs/2026-07-15-situace-zavaznost-akce-design.md` (dále "původní spec") a jeho implementaci (`docs/superpowers/plans/2026-07-15-situace-zavaznost-akce.md`, hotovo). Tento dokument **mění rozhodnutí z bodu 3.1 a 5.2 původního specu** ohledně Akcí: ruší nezávislou editovatelnou kopii akcí na Pravidle a nahrazuje ji živým needitovatelným odkazem na Závažnost.

---

## 1. Kontext a cíl

V původním specu (bod 3.1) si Pravidlo po založení neslo **vlastní nezávislou kopii** akcí ze Závažnosti — šlo je zapínat/vypínat, editovat text, mazat, přidávat další. V praxi se ukázalo, že tahle volnost není žádoucí: akce, které operátor uvidí, mají být přesně ty, co jsou definované na Závažnosti — bez rizika, že se konkrétní pravidlo časem rozejde se šablonou.

**Nové rozhodnutí:** Akce na Pravidle nejdou editovat vůbec. Zobrazují se v pravém sloupci wizardu čistě ke čtení a vždy odpovídají aktuálnímu stavu přiřazené Závažnosti — pokud se akce u Závažnosti později v `/situace` upraví, projeví se to i na všech už založených pravidlech, která na ni odkazují.

Název, Popis a Priorita Pravidla zůstávají beze změny — dál nezávisle editovatelná kopie, předvyplněná ze Závažnosti (bod 3.1 původního specu v tomhle zůstává v platnosti, mění se jen Akce).

---

## 2. UI: Pravý sloupec wizardu (`RuleCreatorPage`)

Sloupec "Akce" se zjednodušuje na čistý needitovatelný výpis:

- Žádný checkbox zapnout/vypnout jednotlivou akci.
- Žádné tlačítko na odebrání akce.
- Žádné „+ Přidat akci" (`ActionTagPicker`) — v pravém sloupci wizardu zmizí úplně.
- Popis akce se nevykresluje jako `<Textarea>` (ani disabled) — je to obyčejný statický text, aby to nepůsobilo jako dočasně vypnuté pole, ale jako čisté zobrazení hodnoty. Řádek dostane tlumenější vzhled než dnešní editovatelná karta (tlumené pozadí místo `bg-background`, žádný border/focus okolo textu popisu).
- Odznak se štítkem akce zůstává stejný jako dnes.

Doprovodná věta v levém sloupci pod výběrem Závažnosti ("Předvyplní prioritu a akce vpravo — dál nezávisle editovatelné.") se **odstraňuje bez náhrady** — žádná nová vysvětlující poznámka tam nepřibývá.

Pokud vybraná Závažnost nemá žádné akce, zobrazí se prázdný stav (obdoba dnešního placeholderu pro ne-tracking oblasti).

---

## 3. Zdroj pravdy: živý odkaz na Závažnost

Zavádí se sdílená funkce `resolveRuleActions(rule)` (nové místo, např. `src/lib/model/ruleActions.ts`):

- Pokud má `rule.severityId`, akce se **vždy** dotáhnou aktuální z `Severity.actions` (dohledáním přes všechny Situace v `situationsStore`) — namapované do tvaru `Action` stejným způsobem, jako dnes dělá `trackingActionsOut` při ukládání (`type: "create_vkr"`, `title`, `vkrText`, `actionTagId`). Bez ohledu na `enabled` (ten koncept mizí) se berou všechny akce Závažnosti.
- Pokud `rule.severityId` není nastaveno (ostatní oblasti mimo `tracking_records`, nebo starší pravidla bez vazby), použije se `rule.actions` jako dnes — beze změny chování.

Při ukládání pravidla (`RuleCreatorPage` → `rulesStore.upsert`) se `rule.actions` pro tracking pravidla s vazbou na Závažnost i nadále dosynchronizuje (kopie aktuálních akcí Závažnosti) — čistě kvůli exportu/importu dat, aby uložená data zůstala smysluplná i mimo appku. Tahle kopie se ale **nikde v appce k zobrazení nepoužívá** — všude se čte přes `resolveRuleActions`, ne přímo `rule.actions`.

---

## 4. Dotčená místa v appce

Konzistentně všude, kde se dnes čte `rule.actions` pro zobrazení v aktuálním datovém modelu (`@/lib/model/types`), se přechází na `resolveRuleActions(rule)`:

| Soubor | Dnešní použití |
|---|---|
| `src/components/rules/RuleCreatorPage.tsx` | pravý sloupec „Akce" (bod 2 výše) |
| `src/components/rules/RulesList.tsx:369` | odznaky akcí v seznamu pravidel |
| `src/components/test/TestPanel.tsx:39` | titulek VkŘ ze simulace na `/test` |

`src/components/vkr/RuleDetailPanel.tsx` a `src/components/vkr/RulesTable.tsx` **se netýkají** — jsou to nepoužívané pozůstatky staršího datového modelu (`@/lib/vkr/types`, ne `@/lib/model/types`), nic je dnes neimportuje mimo sebe navzájem. Netřeba upravovat.

Interní stav `SeverityActionRow` / `severityActions` (checkbox `enabled`, lokální edit popisu) se z `RuleCreatorPage.tsx` odstraňuje — už není potřeba, sloupec renderuje `selectedSeverityObj.actions` přímo.

---

## 5. Mimo rozsah / rozhodnutí

- **Mazání jednotlivé akce ze Závažnosti v `/situace`** nemá guard (na rozdíl od mazání celé Závažnosti, kde guard existuje přes `severityUsageCount`) — zůstává beze změny. Odebrání akce ze šablony se ihned projeví na všech navázaných pravidlech, to je přesně smysl živého odkazu.
- **Smazání celé Závažnosti, která má navázaná pravidla** — zůstává blokované stávajícím guardem, žádná změna.
- Toto zůstává vázané výhradně na `tracking_records` — ostatní oblasti (`route_compliance`, `order_eval`, `unpickup`, `params_price`) nemají vztah k Závažnosti a jejich akce zůstávají beze změny (dál se editují napřímo na Pravidle, jak dnes).

---

## 6. Co zbývá

- Spec self-review a finální schválení od uživatele.
- Přechod na implementační plán (`writing-plans`).
