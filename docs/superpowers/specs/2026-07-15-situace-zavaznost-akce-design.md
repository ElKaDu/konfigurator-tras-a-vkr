# Design: Situace, Závažnost a Akce (Konfigurátor pravidel — tracking)

**Datum:** 2026-07-15
**Status:** Rozpracováno — datový model a terminologie schváleny. UI/wizard flow a rozsah seed dat se ještě řeší (viz „Co zbývá").

> Navazuje na `specifikace-konfigurator-pravidel.md`. Tento dokument popisuje **novou vrstvu** nad stávajícím modelem `Rule` — zavedení entit Situace, Závažnost a Akce pro oblast `tracking_records` (Konfigurátor pravidel — záznamy z trackingu).

---

## 1. Kontext a cíl

Klient (po konzultaci) chce, aby se pravidla v oblasti tracking nemusela pokaždé "vymýšlet" od nuly — jaký text uvidí operátor, jakou akci má udělat. Místo toho se zavádí byznysová kategorie **Situace** (např. "Nedoručeno"), která má stupně **Závažnosti** (běžné / problémové / kritické) a ke každé závažnosti je předem daná šablona: název a popis věci k řešení (VkŘ), priorita a doporučené akce. Operátor tak dostane konzistentní VkŘ bez ohledu na to, které konkrétní pravidlo ji vygenerovalo.

Diagram vztahů (ERD): **https://claude.ai/code/artifact/2b566297-3ed5-49da-8909-e56e679c5b8c**

---

## 2. Terminologie

| Pojem | Popis |
|---|---|
| **Typ triggeru** *(dřív "situační karta")* | Přejmenováno kvůli kolizi se slovem Situace. Technický tvar podmínek: `tracking_event`, `no_movement`, `stuck_location`. Chování beze změny, mění se jen název v UI a dokumentaci. |
| **Situace** *(nové)* | Byznysová kategorie, např. "Nedoručeno", "Poškození zásilky". Obsahuje 1+ Závažnosti. Není plochý label — nese vlastní důvod existence (viz bod 4.3). |
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
  ├─ triggerType                → Typ triggeru (přejmenováno, beze změny chování)
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
| Kolize "situační karta" vs. "Situace"? | Stávající situační karty → přejmenovány na **"Typ triggeru"**. |
| Přejmenovat "Pravidlo" na "Šablona VkŘ"? | **Ne, zatím ne.** Odloženo na pozdější iteraci (spolu s přepínačem pohledů). |
| Akce na úrovni Situace (menu pro budoucí klientský portál)? | **Neimplementovat teď.** Zaznamenáno jen jako důvod/kontext, proč je Situace vlastní entita. |
| Rozsah této iterace | Obecná funkcionalita (Situace/Závažnost/Akce, napojení na wizard) + **pár ukázkových situací** (např. "Nedoručeno" se 3 závažnostmi, "Poškození zásilky"). Zbytek situací z CSV jako seed data až v další iteraci. |

---

## 5. Mimo rozsah / odloženo

- **Přepínač pohledů "Pravidla ↔ Situace"** (seamless toggle nebo samostatná stránka pro situace) — řešit až při příští celkové předělávce prototypu.
- **Přejmenování "Pravidlo" → "Šablona VkŘ"** — odloženo, řešit spolu s výše uvedeným.
- **Seznam "nabízené akce" na Situaci** pro budoucí klientský portál — jen zdokumentováno jako důvod, proč Situace existuje jako entita, nic se nestaví.
- **Automatizace akcí** (skutečné technické chování jako auto-email, auto-posun data) — budoucí iterace.
- **Runtime generování VkŘ** (skutečná instance pro operátora, notifikace, checkbox vyřešeno, poznámka) — mimo rozsah, řešíme jen konfiguraci pravidel.
- **Kompletní seed data** pro všechny situace tracking z CSV — až po ověření modelu na pár ukázkových situacích.

---

## 6. Co zbývá doladit

Design zatím pokrývá terminologii a datový model. Zbývá probrat:

- **UI/wizard flow** — jak se Situace/Závažnost vybírá v `RuleCreatorPage`, kde se spravuje katalog Akcí a šablony Závažností (nová "Nastavení" plocha?).
- **Přesný rozsah ukázkových situací** pro seed (které 2-3 situace z CSV, kolik závažností, jaké akce).
- **Spec self-review a finální schválení** před přechodem na implementační plán (`writing-plans`).
