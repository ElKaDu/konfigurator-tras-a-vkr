# Design: Tři zdroje VkŘ a sjednocená vrstva Situace/Závažnost/Akce

**Datum:** 2026-07-16
**Status:** Design dokončen a schválen. Čeká na finální review uživatele před přechodem na implementační plán.

> Navazuje na `docs/superpowers/specs/2026-07-15-situace-zavaznost-akce-design.md` (implementováno) a
> `docs/superpowers/specs/2026-07-15-body-trasy-terminologie-design.md` (sub-projekt 2 — "Kontrola na bodu",
> needimplementováno). Tento dokument nezavádí nový datový model — jen ukotvuje **celkovou architekturu**:
> jak spolu souvisí tři nezávislé zdroje věcí k řešení (VkŘ) a proč je Situace/Závažnost/Akce mezi nimi sdílená.

---

## 1. Kontext a cíl

Po dokončení Situace/Závažnost/Akce pro oblast `tracking_records` vyvstala otázka: jak tahle vrstva zapadá
do celkové architektury appky, když trasy (sub-projekt 2 — "Kontrola na bodu") a další hardcoded oblasti
(objednávka, nevyzvednutí, parametry a cena — řeší se v jiném vlákně) budou taky generovat VkŘ? Cílem
tohoto dokumentu je ukotvit mentální model, nikoli navrhnout nový datový model.

---

## 2. Mentální model — tři zdroje, jedna klasifikační vrstva

Aplikace generuje věci k řešení (VkŘ) ze tří nezávislých zdrojů:

1. **Pravidla pro tracking** — flexibilní wizard (`/rules/new`), uživatel si skládá vlastní podmínky
   (spouštěč, shoda hodnoty, historie záznamů…). **Implementováno.**
2. **Trasy** — hardcoded "kontroly" na bodech trasy: plán spuštění (kdy se má kontrola provést) +
   větvení Splněno/Nesplněno. Jedna trasa může vést k **více** situacím zároveň — záleží na tom, která
   kontrola se vyhodnocuje a jaký měla výsledek (každá kombinace kontrola × výsledek může mířit na jinou
   Situaci). Architektura i wireframe už existují (`2026-07-15-body-trasy-terminologie-design.md`,
   sub-projekt 2 — `mockups/2026-07-15-kontrola-na-bodu-architektura.html`,
   `mockups/2026-07-15-bod-kontroly-wireframe.html`). **Needimplementováno.**
3. **Ostatní hardcoded oblasti** — řeší se v jiném vlákně. **Mimo rozsah tohoto dokumentu.**

Všechny tři zdroje končí ve **sdílené vrstvě Situace → Závažnost → Akce**. Tahle vrstva definuje "druhou
polovinu" vzniku VkŘ — bez ohledu na to, co VkŘ vyvolalo:

- co to **znamená** (klasifikace: Situace + její Závažnost),
- co se s tím **bude dít** (přiřazené Akce, výchozí text/priorita VkŘ).

### 2.1 Situace je vždy jen klasifikace (Varianta B) — rozhodnuto

Situace **nikdy sama nic nekonfiguruje** — nezakládá ani nepředvyplňuje časování, podmínky, ani strukturu
zdroje (pravidlo / kontrolu). Chová se **stejně bez ohledu na to, kde se použije**: v tracking pravidle,
na větvi kontroly u bodu trasy, nebo (budoucně) v jiné hardcoded oblasti. Vždy jen: uživatel na daném místě
vybere Situaci → Závažnost, což předvyplní název/popis/prioritu/akce (editovatelná kopie) — mechanismus
identický s tím, co už dnes dělá `RuleCreatorPage` pro tracking pravidla.

Zvažovaná alternativa (**Varianta A** — Situace jako šablona, která by na bodu trasy sama založila celou
kontrolu včetně časování a podmínek) byla vědomě **zamítnuta pro teď**. Odebrala by uživateli flexibilitu
výměnou za rychlejší/"správnější" výchozí nastavení. **Zaznamenáno jako nápad do budoucna**, ne součást
tohoto designu — nerozhodovat o něm dřív, než bude jasné, že chybějící flexibilita reálně vadí.

---

## 3. Dopad na "Soulad s předepsanou trasou"

Dnešní wizard pro tuto oblast (`RuleCreatorPage`, situační karty) **zaniká úplně**. Kontroly
(plán spuštění + větvení Splněno/Nesplněno → Situace) se místo toho nastavují přímo v editoru Úseku,
na úrovni jednotlivého bodu trasy — podle už existující architektury "Kontrola na bodu" (viz odkazy v
sekci 2, bod 2). `/rules/new` zůstává výhradně pro tracking pravidla.

---

## 4. Navigace a pojmenování

| Prvek | Dnes | Nově |
|---|---|---|
| Top nav — název sekce pravidel | "Konfigurátor pravidel" | **"Pravidla pro tracking"** — přesnější, protože to teď dělá jen tracking pravidla, ne obecný výběr oblastí. |
| Top nav — položky | Konfigurátor pravidel \| Trasy zásilek | Pravidla pro tracking \| Trasy zásilek \| **Situace a závažnosti** (nová, vlastní položka) |
| Vstup do Situace | Jen odkaz "Situace a závažnosti →" uvnitř seznamu Pravidel (`RulesList`) | Vlastní položka v top nav, dostupná odkudkoli — protože je to teď sdílená infrastruktura pro Pravidla i Trasy (a budoucí hardcoded oblasti). |
| Pill bar "Oblast" uvnitř wizardu (`/rules/new`) | Výběr z více oblastí | **Mizí úplně** — jediná reálná oblast je tracking, není co vybírat. |
| Postranní panel "Oblasti" v `RulesList` (filtr) | Filtr podle oblasti | **Mizí úplně** — ze stejného důvodu, filtrování podle oblasti ztrácí smysl, když existuje jen jedna. |

Přejmenování entity **"Pravidlo"** (např. na "Šablona VkŘ") **zůstává mimo rozsah** — to bylo záměrně
odloženo už v `2026-07-15-situace-zavaznost-akce-design.md` (spolu s "přepínačem pohledů") na pozdější
celkovou předělávku prototypu. Tento dokument se drží jen přejmenování nadpisu sekce v nav, ne datového
modelu.

---

## 5. Mimo rozsah

- **Kontrola na bodu** (celý datový model a UI pro trasy) — už navrženo v `2026-07-15-body-trasy-terminologie-design.md`
  sub-projekt 2, needimplementováno. Tento dokument jen potvrzuje, že to zapadá do stejné Situace/Závažnost/Akce
  vrstvy jako tracking — samotný implementační plán vznikne zvlášť.
- **Ostatní hardcoded oblasti** (objednávka, nevyzvednutí, parametry a cena) — řeší se v jiném vlákně.
- **Situace jako šablona (Varianta A)** — zaznamenáno jako budoucí nápad, nerozhodovat teď.
- **Přejmenování "Pravidlo" → "Šablona VkŘ"** a **přepínač pohledů** — odloženo na budoucí celkovou předělávku.
- **Migrace existujících seed pravidel R10/R11** (dnešní "Soulad s trasou") — otevřená otázka, řešit až
  při psaní implementačního plánu pro "Kontrola na bodu", ne teď.

---

## 6. Co zbývá

Design je hotový — mentální model, role Situace, dopad na "Soulad s trasou" a navigační/copy změny jsou
probrané a schválené. Zbývá:

- **Spec self-review a finální schválení** od uživatele.
- Implementační plán vznikne až pro konkrétní kus práce (buď navigační/pojmenovací změny popsané v sekci 4,
  nebo samotná implementace "Kontrola na bodu" — to je otevřená otázka pro navazující rozhovor, ne pro
  tento design).
