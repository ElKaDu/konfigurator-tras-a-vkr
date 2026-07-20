# Úsek detail v2 — design

Datum: 2026-07-20
Navazuje na: `docs/superpowers/plans/2026-07-19-soulad-s-trasou.md` (Tasky 1–9, hotovo), porovnání s
`mockups/2026-07-17-soulad-s-trasou-final-wireframe.html`.

## Kontext a motivace

Po dokončení Tasků 1–9 byl prototyp porovnán s finálním wireframem. Zjištění: obsahová logika (Situace,
Akce, byznys pravidla) sedí, ale implementace ztratila oproti wireframu celou vizuální vrstvu — chybí
třetí sloupec "Plán spuštění" s vysvětlením kontrol a navázanými Akcemi, chybí editace základních údajů
úseku (dopravci, typ služby), kotva Termínu je omezená jen na aktuální úsek, a chybí odkaz na Zadání pro
vývojáře. Tento dokument popisuje doplnění těchto chybějících částí.

## Rozsah

Vše se týká jedné stránky — detailu úseku (`SouladSTrasouUsekPage` a jeho podkomponenty). Šest
nezávislých, ale souvisejících změn:

1. Třetí sloupec "Plán spuštění" — vysvětlení kontrol s dynamickými Situace/Akce a reálnými časy.
2. Levý sloupec — obnovit editaci základních údajů úseku (název, popis, dopravci, typ služby).
3. Vizuál seznamu bodů úseku — tečka + spojovací čára, zvýraznění právě otevřeného bodu.
4. Kotva Termínu (AnchorPicker) — nabídnout i body z jiných úseků stejné trasy, ne jen aktuálního úseku.
5. Termín editor v2 — bohatší nastavení (den/čas nebo odstup od události) s živým náhledem věty.
6. Odkaz "Zadání pro programátory" v banneru nad sloupcem "Plán spuštění".

## 1. Třetí sloupec "Plán spuštění"

**Layout:** `SouladSTrasouUsekPage` se rozšiřuje ze 2 na 3 sloupce: `w-[280px]` seznam bodů (beze změny
šířky) → `w-[380px]` editovatelná pole (dnešní obsah `BodDetailPanel`/`DnesniDoruceniEditablePanel` mínus
Situace karty) → `flex-1` nový sloupec "Plán spuštění" (needitovatelný, `bg-muted` pozadí jako ve
wireframu).

**Architektura (zvolen přístup B z brainstormingu):** Žádná sdílená datová "kontrola-plan" struktura.
Obsah každé Kontroly (název, obecné pravidlo, větve) zůstává napsaný přímo v JSX v `BodDetailPanel`
(pro Běžný bod) a `DnesniDoruceniEditablePanel` (pro Dnešní doručení) — stejně jako dnes fungují ostatní
sekce těchto komponent. Vytáhnou se jen dvě malé sdílené vizuální komponenty do `src/components/soulad/`:

- `KontrolaCard` — obálka s číslem, názvem kontroly, časovací pilulkou (bere hotový naformátovaný text,
  nepočítá nic sama) a obecným pravidlem.
- `Vetev` (branch) — barevně odlišený box (ok/warn/neutral, stejné barvy jako wireframe: zelená/žlutá/
  šedá) pro jednu větev výsledku; buď prostý text (žádná VkŘ), nebo vykreslí `SituaceCard`.

**Co je pevně dané vs. co je živé:**
- Názvy kontrol a vysvětlující texty (obecné pravidlo) — pevně v kódu, popisují typ bodu, ne uživatelská
  data.
- Časy u každé kontroly — vždy `formatTimeLimit()` nad reálnou hodnotou, kterou má uživatel nastavenou
  (žádné ilustrační "příklad: 9:00" jako ve wireframu — nejde spočítat reálný čas bez znalosti konkrétního
  data zásilky, takže se ukazuje jen pravidlo, ne vymyšlený příklad).
- Situace/Závažnost/Akce (obsah karet) — vždy dynamicky přes `useSituations()`/`useActionTags()`
  (existující store, v prototypu zastupuje Django data). Které větve na které Situace vedou, zůstává
  navázané přes existující `ROUTE_COMPLIANCE_SITUATIONS` konstanty — to je vlastnost typu bodu, ne
  uživatelská volba.

**Obsah pro Běžný bod (1 kontrola "Konečný limit", 3 větve):**
- ✓ Řádně nalezen do Termínu — žádná VkŘ, jen text.
- ! Nenalezen do Termínu — `SituaceCard` → `problemNaTrase`.
- ℹ Objeví se později (reaktivně) — `SituaceCard` → `problemNaTrasePozde`.

**Obsah pro Dnešní doručení (3 kontroly):**
1. Limit pro řádné záznamy (scan1) — 2 větve, obě bez VkŘ (text).
2. Konečný limit (scan1) — větev "neobjevil se" → `SituaceCard` → `zpozdenaZasilka`; větev "objevil se" →
   vnitřní rozhodnutí D=dnes (bez VkŘ) / D≠dnes (`SituaceCard` → `zpozdenaZasilka`).
3. 2. scan — Konečný limit (scan2) — větev "dorazil řádně" → `SituaceCard` → `dnesniDoruceni`; větev
   "nedorazil" → `SituaceCard` → `zpozdenaZasilka`.

Texty větví a obecných pravidel se přebírají z wireframu (`mockups/2026-07-17-soulad-s-trasou-final-wireframe.html`), zbavené ilustračních příkladů časů.

## 2. Levý sloupec — editace základních údajů úseku

Nad seznam bodů (`BODY ÚSEKU (N)`) se doplní needitovatelný nadpis "Základní info" a čtyři editovatelná
pole, 1:1 podle staré (smazané) `SegmentEditorPage.tsx`:

- **Název úseku** — text input, `segmentsStore.upsert({ ...segment, name })`.
- **Popis (volitelný)** — textarea, `segmentsStore.upsert({ ...segment, description })`.
- **Dopravci** — pill multiselect, `CARRIER_OPTIONS = ["FedEx", "UPS", "DHL", "PPL", "GLS"]`, toggluje
  `segment.carriers`.
- **Typ služby** — pill multiselect, `TRANSPORT_VARIANTS` z `src/lib/routes/types.ts` (Express/Economy/
  Pallet/Freight, už v projektu existuje), toggluje `segment.serviceTypes`.

Vizuální styl pilulek (zaoblené, `border-primary`+`bg-primary` když vybráno) se přebírá beze změny ze
staré komponenty.

## 3. Vizuál seznamu bodů úseku

Seznam bodů dostane tenkou svislou spojovací čáru (`::before`, jako ve wireframu) a tečku před každým
bodem. Bez barvení "hotovo/aktivní/čeká" (prototyp nic nevykonává) — jediné odlišení je zvýraznění
**právě vybraného** bodu (větší/plná tečka + `text-primary`), ostatní tečky neutrální `muted-foreground`.

## 4. Kotva Termínu napříč úseky stejné trasy

`AnchorPicker` dnes nabízí jen `segment.checkpoints` aktuálního úseku. Rozšiřuje se o:

- Najít všechny trasy, které obsahují aktuální úsek (`routesStore.all().filter(r => r.segmentIds.includes(segment.id))`).
- Posbírat všechny ostatní `segmentId` z těchto tras (deduplikované, bez aktuálního úseku).
- Pro každý takový úsek vytvořit samostatnou `<optgroup>` s jeho jménem, obsahující jeho checkpointy.
- Pokud úsek nepatří do žádné trasy, chová se jako dnes (jen "Body tohoto úseku").
- Pokud úsek patří do víc tras, sloučí se body ze všech (dedup podle segmentId, ne podle trasy).

Systémové kotvy se rozšiřují z 2 na původních 5 (viz sekce 5).

## 5. Termín editor v2

Nahrazuje dnešní minimální `TerminEditor` (kotva + mode + jedno pole). Vzor 1:1 podle staré (smazané)
komponenty v `SegmentEditorPage.tsx` (řádky ~860–1120), přemapovaný na současné názvy polí v
`CheckpointCorrectness`:

**Nadpis sekce:** "Vlastní čas záznamu musí být nejpozději do" (nahrazuje dnešní "Termín").

**Přepínač (radio):** „v konkrétní den a čas" (`mode: "fixed"`) / „s odstupem od události" (`mode: "offset"`).

**V konkrétní den a čas:**
- DEN — `AnchorPicker` (viz sekce 4), popisek "DEN" místo "kotva".
- Posun — `fixedDayOffset` (number, min 0), `fixedDayMode` (kalendářní/pracovní), a `fixedDayDirection`
  (po/před) — dropdown pro směr se zobrazí, jen když `fixedDayOffset > 0` (stejně jako ve staré komponentě).
- ČAS — `fixedTime` (time input) + `fixedTz` (pásmo, dropdown: Místní čas/Europe/Prague/Europe/Berlin/UTC/
  America/New_York).

**S odstupem od události:**
- `value` (number) + `unit` (dropdown: h / d / prac. dní — **bez "min"**, current type ho nemá) +
  `direction` (po/před) + `AnchorPicker` (popisek "události:").

**Souhrnný náhled (fialový box, dole):**
- Pevný čas: `nejpozději {Posun-věta} v {fixedTime} {pásmo}` — např. "nejpozději v den události „ADD" v
  08:00 místního času" nebo (při posunu) "nejpozději 2 dny po události „ADD" v 08:00 místního času".
  Poznámka pod větou: "Dřívější dny se započítávají automaticky."
- Odstup: `nejpozději {value} {unit} {po/před} události „{anchorLabel}"`. Poznámka: "Může spadnout i na
  jiný den — to je v pořádku."

**Systémové kotvy (`AnchorPicker`) se rozšiřují z 2 na původních 5:**
Vytvoření zásilky, Vyzvednutí zásilky, Vytvoření objednávky, Avizované doručení zákazníkovi (ADD),
Doručení hlášené dopravcem.

Mimo rozsah: žádné "Dnešní den" jako speciální kotva (nebylo požadováno, není v datovém modelu).

## 6. Odkaz "Zadání pro programátory"

`mockups/2026-07-17-zadani-pro-programatory.html` se zkopíruje do `public/zadani-pro-programatory.html`
(statický asset, dostupný na stabilní URL i po buildu). Banner nad sloupcem "Plán spuštění" (sekce 1) —
stejný text jako ve wireframu: "🔒 Situace, Závažnost a Akce se needitují tady — nastavují se v Django
adminu." + odkaz "Zadání pro programátory →", otevírá se v novém tabu (`target="_blank"`). Žádný další
odkaz v horní liště (mimo rozsah — zamítnuto v brainstormingu).

## Mimo rozsah

- Barevné odlišení stavu bodů (hotovo/aktivní/čeká) v seznamu bodů — prototyp nic reálně nevykonává.
- "Dnešní den" jako speciální kotva.
- Editace vazby "větev kontroly → Situace" v UI — zůstává pevně v kódu (`ROUTE_COMPLIANCE_SITUATIONS`),
  needitovatelné, stejně jako dosud.
- Odkaz na Zadání pro programátory v horní liště.
- Vše, co bylo mimo rozsah už v `docs/superpowers/plans/2026-07-19-soulad-s-trasou.md` (vedený wizard,
  mazání bodu/úseku/trasy, test/simulátor záložka).
