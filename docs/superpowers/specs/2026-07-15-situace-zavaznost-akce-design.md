# Design: Situace, Závažnost a Akce (Konfigurátor pravidel — tracking)

**Datum:** 2026-07-15
**Status:** Design dokončen a schválen — terminologie, datový model, UI wizardu i správa Situací/Akcí. Čeká na finální review uživatele před přechodem na implementační plán.

> Navazuje na `specifikace-konfigurator-pravidel.md`. Tento dokument popisuje **novou vrstvu** nad stávajícím modelem `Rule` — zavedení entit Situace, Závažnost a Akce pro oblast `tracking_records` (Konfigurátor pravidel — záznamy z trackingu).

---

## 1. Kontext a cíl

Klient (po konzultaci) chce, aby se pravidla v oblasti tracking nemusela pokaždé "vymýšlet" od nuly — jaký text uvidí operátor, jakou akci má udělat. Místo toho se zavádí byznysová kategorie **Situace** (např. "Nedoručeno"), která má stupně **Závažnosti** (běžné / problémové / kritické) a ke každé závažnosti je předem daná šablona: název a popis věci k řešení (VkŘ), priorita a doporučené akce. Operátor tak dostane konzistentní VkŘ bez ohledu na to, které konkrétní pravidlo ji vygenerovalo.

Diagram vztahů (ERD): **https://claude.ai/code/artifact/2b566297-3ed5-49da-8909-e56e679c5b8c**

---

## 2. Terminologie

| Pojem | Popis |
|---|---|
| **Spouštěč** *(dřív "situační karta" / "typ triggeru")* | Přejmenováno kvůli kolizi se slovem Situace. Zjednodušeno na **2 typy**: `Automaticky` (reaktivní, při každém novém tracking záznamu) a `Časovač` (periodická kontrola). Dnešní tři karty (`tracking_event`, `no_movement`, `stuck_location`) se liší jen podmínkami, ne mechanismem spuštění — `tracking_event` i `stuck_location` spadají pod `Automaticky`, `no_movement` pod `Časovač`. V UI je to segmented control uvnitř kroku "Nastavení pravidla", ne samostatný krok s velkými kartami. |
| **Situace** *(nové)* | Byznysová kategorie, např. "Nedoručeno", "Poškození zásilky". Obsahuje 1+ Závažnosti. Není plochý label — nese vlastní důvod existence (viz bod 3.3). |
| **Závažnost** *(nové)* | Úroveň uvnitř situace, např. "kritické". Nese **výchozí šablonu VkŘ**: název, popis, priorita, seznam přiřazených akcí (s výchozím textem/parametry a volitelnou podmínkou). Pokud situace má jen 1 závažnost, přepínač závažnosti se v UI skryje. |
| **Akce** *(nové, katalog)* | Jednoduchý tag: `label` + `icon`. Pro tuto iteraci bez vlastního chování — viz bod 4.2. |
| **Pravidlo** | Beze změny názvu (zůstává "Pravidlo", ne "Šablona VkŘ" — zvažováno, odloženo, viz bod 6). Rozšířeno o odkaz na Situaci + Závažnost (přesně 1, žádné větvení uvnitř pravidla). Vlastní pole `name` (existuje dnes) = titulek výsledné VkŘ. |
| **VkŘ** | Runtime instance pro operátora — mimo rozsah této iterace (žádný backend/generátor, řešíme jen konfiguraci). |

---

## 3. Datový model

```
Situace
  ├─ code, name, description, area
  └─ Závažnost[]              (1:N)
       ├─ vkrTitle, vkrDescription, priority   — výchozí šablona
       └─ přiřazené akce[]     (N:1 → Akce katalog)
              ├─ actionTagId → Akce
              ├─ výchozí text/parametry (kontext závažnosti)
              └─ volitelná podmínka (např. "zákazník je nový")

Akce (katalog)
  └─ label, icon               — jen tag, žádné vlastní chování (zatím)

Pravidlo (existující entita, rozšířená)
  ├─ ...stávající pole beze změny (trigger, conditions, atd.)
  ├─ triggerType                → Spouštěč: Automaticky | Časovač (přejmenováno + zjednodušeno ze 3 na 2 typy)
  ├─ actions[]                  — VLASTNÍ KOPIE, editovatelná nezávisle na závažnosti
  ├─ name, description, priority — vlastní, editovatelné (viz mechanismus níže)
  └─ situationId, severityId    — 🔒 needitovatelné, jen zobrazení/klasifikace
```

### 3.1 Klíčový mechanismus: kopie šablony při založení

Závažnost je **šablona pro předvyplnění**, ne živý odkaz. Když se zakládá pravidlo pro danou závažnost:

1. Wizard předvyplní `name`, `description`, `priority` a seznam `actions` z šablony závažnosti.
2. Od té chvíle si pravidlo nese **vlastní nezávislou kopii** — může:
   - přepsat název/popis/prioritu,
   - přidat/odebrat akci (i takovou, která není v šabloně),
   - upravit podmínku u libovolné přiřazené akce.
3. Odkaz na Situaci/Závažnost (`situationId`, `severityId`) na pravidle **zůstává** — ale jen pro zobrazení/klasifikaci, nejde ho na pravidle přepsat (změna situace/závažnosti = založit nové pravidlo).
4. Název situace a závažnosti se needitovatelně zobrazují i na výsledné VkŘ (spolu s `Pravidlo.name` jako titulkem).

### 3.2 Kardinalita Pravidlo ↔ Závažnost

**1 Závažnost → N Pravidel.** V datech od klienta to zatím vypadá spíš 1:1 (např. "Nedoručeno: 1./2./3.+ pokus" = 3 samostatná pravidla, každé na jinou závažnost). Kardinalitu necháváme volnou (N:1), protože u některých situací (např. "problém v přepravě") může klient nakonec vyjmenovat víc pravidel na jednu závažnost. **Otevřená otázka — revidovat, až klient situace v tabulce dokompletuje.** Případně zvážit sloučení konceptů v další iteraci.

### 3.3 Akce — rozsah pro tuto iteraci a budoucí rozšíření

- **Teď:** Akce = čistý tag (`label`, `icon`). Žádné pole pro chování/automatizaci.
- **Budoucnost (mimo rozsah):** až přibudou automatizace (např. auto e-mail, automatický posun data), jejich **výchozí technické chování** se nastaví právě na Akci (globální default). Závažnost i Pravidlo ho budou moct dál přepsat pro svůj kontext — tj. kaskáda **Akce (globální default) → Závažnost (kontextový default) → Pravidlo (finální přepis)**.
- **Proč je Situace samostatná entita, ne jen label:** v budoucnu si klient v portálu nastaví, o jakých situacích chce dostávat notifikace, a firma bude moct na úrovni situace regulovat, jaké notifikace vůbec nabízí (případně za jakou cenu). Pro tuto iteraci se to nijak nemodeluje (žádné pole "nabízené akce" na Situaci) — je to jen důvod, proč Situace nese vlastní chování a není to plochý štítek bez struktury.

---

## 4. Rozhodnutí z konzultace (shrnutí)

| Otázka | Rozhodnutí |
|---|---|
| Kde bydlí šablona VkŘ? | Na **Závažnosti** (ne na Situaci) — jinak by nešlo mít jiný text/akci pro "běžné" vs. "kritické". |
| Kde se nastavuje výchozí text/chování akce? | Na **Závažnosti**, editovatelné na Pravidle. |
| Větvení uvnitř pravidla (různé podmínky → různá situace/závažnost)? | **Ne.** 1 pravidlo = 1 závažnost. Podmínky typu "nový zákazník" patří k akci, ne k výběru situace. |
| Kde se nastavují podmínky konkrétní akce? | Výchozí na Závažnosti, editovatelné na Pravidle. |
| Co smí pravidlo přepsat? | Název, popis, prioritu, výběr akcí (přidat/odebrat), podmínky u akcí. Nesmí přepsat název situace/závažnosti (jen zobrazeno). |
| Kolize "situační karta" vs. "Situace"? | Stávající situační karty → přejmenovány na **"Spouštěč"**, zjednodušeno ze 3 karet na 2 typy (Automaticky / Časovač). |
| Přejmenovat "Pravidlo" na "Šablona VkŘ"? | **Ne, zatím ne.** Odloženo na pozdější iteraci (spolu s přepínačem pohledů). |
| Akce na úrovni Situace (menu pro budoucí klientský portál)? | **Neimplementovat teď.** Zaznamenáno jen jako důvod/kontext, proč je Situace vlastní entita. |
| Kam patří "Opakuje se" (bývalá "zaseknutá na místě")? | Do bloku **"Podmínky současného záznamu"**, ne "historie" — vyhodnocuje se při příchodu nového záznamu, i když se dívá do minulosti. |
| "Neobsahuje" v historii — jednoduché, nebo se stejnými podvolbami jako "Obsahuje"? | **Se stejnými podvolbami** (poslední záznam / N záznamů / nepřerušeně). |
| Kde spravovat katalog Situací/Závažností/Akcí? | Nové stránky `/situace` a `/situace/$id` (vzor Trasy). Akce bez vlastní stránky — inline combobox. Žádný nový tab v top nav, jen odkaz z `RulesList`. |
| Rozsah této iterace | Obecná funkcionalita (Situace/Závažnost/Akce, napojení na wizard, správa) + **3 ukázkové situace, 7 závažností** (Nedoručeno, Poškození zásilky, Problém v přepravě). Zbytek situací z CSV jako seed data až v další iteraci. |

---

## 5. UI: Wizard tvorby pravidla (`RuleCreatorPage`)

### 5.1 Oblast jde nahoru

Dnešní levý sloupec s výběrem Oblasti (Záznamy z trackingu / Soulad s trasou / …) se přesouvá do **vodorovné lišty** pod hlavní navigací (`AppHeader`). Uvolní to místo pro tři sloupce, které teď nesou celý postup tvorby pravidla zleva doprava.

### 5.2 Tři sloupce

| Sloupec | Obsah |
|---|---|
| **1 — Situace a závažnost** | Jen výběr: dropdown Situace → pills Závažnost. Žádná další konfigurace tady — je to čistě klasifikační krok, který předvyplní sloupce 2 a 3. |
| **2 — Nastavení pravidla** | Vše ostatní o pravidle pohromadě: Název (= titulek VkŘ, předvyplněný ze závažnosti) / Popis / Priorita / Aktivní, pak Spouštěč (segmented `Automaticky` / `Časovač`) a pod ním tři bloky podmínek (viz 5.3). |
| **3 — Akce** | Seznam akcí zděděných ze závažnosti (checkbox zapnout/vypnout + text/podmínka editovatelné na místě) + „+ Přidat akci" pro akce navíc. Výběr i konfigurace akcí zůstávají pohromadě v jednom sloupci — nerozdělovat na "vyber tady, dolaď tam". |

Krajní sloupce (1 a 3) jsou užší, prostřední (2) nese nejvíc obsahu a je nejširší.

### 5.3 Podmínky pravidla — tři bloky ve sloupci 2

1. **Podmínky současného záznamu** *(jen `Automaticky`)* — co musí splnit záznam, který právě přišel. Dva režimy na řádek (lze kombinovat víc řádků, AND):
   - **Shoda hodnoty** — pole + `je`/`není` (hodnoty budou z číselníku dopravce) + hodnota.
   - **Opakuje se** — bez konkrétní hodnoty; hlídá, že *stejná* hodnota pole (typicky lokace) se opakuje N-krát, počítaje v to i tento nový záznam, s volitelným „musí být nepřerušeně". **Patří sem, ne do bloku 2** — i když se dívá do historie, vyhodnocuje se přesně ve chvíli příchodu nového záznamu. Řeší přesně dnešní "zaseknutá na místě".
   - Tento blok mizí celý, když je spouštěč `Časovač` (žádný "nový záznam" tam neexistuje).

2. **Podmínky na historii záznamů** *(`Automaticky` i `Časovač`)* — doplňkový kontext z dřívějších záznamů, nezávislý na tom, který záznam právě dorazil (nebo že u Časovače žádný nedorazil). Dva režimy, **oba se stejnými podvolbami**:
   - **Obsahuje** / **Neobsahuje** — pole + hodnota, s upřesněním *„V posledním záznamu"* vs. *„V posledních N záznamech"* (+ volitelné „musí být nepřerušeně", relevantní jen při N > 1).
   - U `Časovače` typicky řeší např. "poslední status není administrativní" (zobecnění dnešního checkboxu `ignoreClearance`). U `Automaticky` např. "v historii NENÍ status už-řešeno".

3. **Podmínky z ostatních entit** *(zákazník, zásilka…)* — beze změny oproti dnešnímu `VkrConditionsBuilder` (pole zásilky/zákazníka, ne trackingu).

---

## 6. UI: Správa Situací, Závažností a Akcí (nové)

Podpůrná konfigurace pro Pravidla — stejný vzor, jaký už v appce existuje pro Trasy (`RoutesAndSegmentsPage` → `RouteEditorPage` → `SegmentEditorPage`), znovupoužitý místo vymýšlení nového:

- **`/situace`** — seznam situací (obdoba dnešního seznamu tras), `+ Nová situace`.
- **`/situace/$id`** — editor: meta situace (název, popis, oblast) + seznam Závažností s inline editací (název, `vkrTitle`, `vkrDescription`, priorita, přiřazené akce s výchozím textem/podmínkou) + tlačítko **„+ Pravidlo pro tuto závažnost"** (druhý vstupní bod do wizardu, viz rozhodnutí v bodě 4) + počet navázaných pravidel u každé závažnosti.
- **Akce nemá vlastní stránku.** Spravuje se **inline** přes combobox s „+ vytvořit novou akci" přímo v místě přiřazení akce k závažnosti (jako tagy v Linearu/Notionu) — je to malý katalog, samostatná plocha by byla zbytečná.
- **Vstupní bod:** žádný nový tab v horní navigaci (`AppHeader` zůstává beze změny — 2 položky). Místo toho jednoduchý odkaz **„Situace a závažnosti →"** ze seznamu pravidel (`RulesList`). Až se bude dělat celkový redesign (viz "přepínač pohledů" níže), snadno se to propojí.

---

## 7. Rozsah seed dat pro tuto iteraci

**3 situace, 7 závažností** — pokrývají všechny probrané případy (Automaticky+Shoda, Automaticky+Opakuje se, Časovač):

| Situace | Závažnosti |
|---|---|
| **Nedoručeno** | běžné, problémové, kritické |
| **Poškození zásilky** | (1 závažnost) |
| **Problém v přepravě** | možný problém, zaseknutá na místě, podezření na ztrátu |

Zbytek situací z CSV (clění, zásilka se vrací, atd.) až v další iteraci, po ověření modelu na těchto třech.

---

## 8. Mimo rozsah / odloženo

- **Přepínač pohledů "Pravidla ↔ Situace"** (seamless toggle nebo samostatná stránka pro situace) — řešit až při příští celkové předělávce prototypu.
- **Přejmenování "Pravidlo" → "Šablona VkŘ"** — odloženo, řešit spolu s výše uvedeným.
- **Seznam "nabízené akce" na Situaci** pro budoucí klientský portál — jen zdokumentováno jako důvod, proč Situace existuje jako entita, nic se nestaví.
- **Skutečné číselníky hodnot** (status, kódy dopravců) — pro seed stačí pár ukázkových hodnot, ne kompletní číselník.
- **Automatizace akcí** (skutečné technické chování jako auto-email, auto-posun data) — budoucí iterace.
- **Runtime generování VkŘ** (skutečná instance pro operátora, notifikace, checkbox vyřešeno, poznámka) — mimo rozsah, řešíme jen konfiguraci pravidel.
- **Kompletní seed data** pro všechny situace tracking z CSV — až po ověření modelu na 3 ukázkových situacích výše.

---

## 9. Co zbývá

Design je hotový — terminologie, datový model, UI wizardu i správa Situací/Akcí jsou probrané a schválené. Zbývá:

- **Spec self-review a finální schválení** od uživatele.
- Přechod na implementační plán (`writing-plans`).
