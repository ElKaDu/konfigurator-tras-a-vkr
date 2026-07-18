# Design: Bod „Dnešní doručení" — vyhodnocení zpoždění v den doručení

**Datum:** 2026-07-17
**Status:** Design dokončen a schválen (rozhodovací logika + wireframe editoru). Čeká na finální review uživatele před přechodem na implementační plán.

> Navazuje na `docs/superpowers/specs/2026-07-16-artefakt-kontrola-trasy-design.md` (implementováno ve worktree
> `.claude/worktrees/artefakt-kontrola-trasy`, soubory `nastroje/kontrola-na-bodu-trasy.*`). Tento dokument řeší
> konkrétní byznysovou logiku situace „zpoždění v den doručení" (dnešní `bod_1_scan`/`bod_2_scan`, R30/R97/R39/R14)
> a navrhuje pro ni **nový specializovaný typ bodu** místo generického mechanismu Kontrol.

---

## 1. Kontext a cíl

Klient popsal přesnou logiku, podle které se má v den plánovaného doručení vyhodnotit tracking a rozhodnout, jestli
zásilka dorazí dnes, nebo je zpožděná. Při rozboru zadání se ukázalo, že:

1. Existující artefakt „Kontrola na bodu trasy" už tuhle situaci modeluje (body `bod_1_scan`/`bod_2_scan`,
   Kontroly odpovídající pravidlům R30/R97/R39/R14) — ale zjednodušeně a s několika konkrétními chybami
   proti zadání (viz §4).
2. Generický mechanismus „Bod → N Kontrol, každá s vlastními větvemi" nutí duplikovat podmínky napříč třemi
   Kontrolami a neumí čistě vyjádřit klíčový požadavek zadání — **oddělit** „vlastní čas záznamu musí být do X"
   od „kdy se to poprvé smíme jít podívat" (kvůli zpoždění dat z trackingu).

Řešením je nový, purpose-built typ bodu, který tenhle konkrétní vzorec (dva navazující fyzické scany + časová
tolerance) nese jako pojmenovaná nastavení místo ruční skládačky Kontrol.

---

## 2. Odvozená byznysová logika

**Vstupy:**

| Zkratka | Význam |
|---|---|
| **Z1** | První fyzický scan v cílové zemi — záznam s typem lokace „FedEx Facility" z cílové země. Rozhoduje jeho vlastní místní čas. |
| **Z2** | Druhý status — záznam s typem lokace „Destination Facility" z cílové země, PSČ místa začíná stejně jako PSČ adresy doručení. |
| **D** | Předpokládaný den doručení z dat přepravce (dnes pole `datumDoruceniOdPrepravce`). |

Časy 8:00/9:00/10:00 jsou vždy místní čas cílové lokace.

**Rozhodovací tabulka (finální stavy):**

| # | Podmínka | Výsledek | Zdroj |
|---|---|---|---|
| 1 | Z1 (vlastní čas ≤ 8:00) ∧ Z2 v okně (+2h, tolerance +1h) | ✅ Předpoklad dnešního doručení | explicitně v zadání |
| 2 | Z1 (vlastní čas ≤ 8:00) ∧ ¬Z2 v okně | 🚫 Zpožděná zásilka | explicitně v zadání |
| 3 | ¬Z1 do 9:00 ∧ D ≠ dnes (už v 9:00 checku) | 🚫 Zpožděná zásilka | **dopočteno** — zadání tenhle stav vůbec nezmiňuje |
| 4 | ¬Z1 do 9:00 ∧ D = dnes → čeká se do 10:00 | *(vnitřní mezistav, žádná akce, needávaný jako konfigurovatelný řádek)* | explicitně v zadání |
| 5 | Z1 stále nenalezen do 10:00 | 🚫 Zpožděná zásilka | explicitně v zadání |
| 6 | Z1 nalezen do 10:00 (vlastní čas už nerozhoduje) ∧ D se mezitím posunulo | 🚫 Zpožděná zásilka | explicitně v zadání |
| 7 | Z1 nalezen do 10:00 ∧ D stále dnes ∧ Z2 v okně | ✅ Předpoklad dnešního doručení | **dopočteno** — zadání u téhle větve Z2 vůbec nezmiňuje |
| 8 | Z1 nalezen do 10:00 ∧ D stále dnes ∧ ¬Z2 v okně | 🚫 Zpožděná zásilka | **dopočteno** |

Řádek 4 není konfigurovatelný stav (viz §5) — je to čistě vnitřní krok algoritmu.

### 2.1 Dopočtené předpoklady — potvrdit u klienta

- **Řádek 3:** Pokud D už při 9:00 checku neodpovídá dnešku (v budoucnosti i minulosti), bereme to jako
  okamžité zpoždění bez čekání do 10:00. Zadání tenhle stav vůbec neřeší.
- **Řádek 7/8:** Ve větvi „rekontrola v 10:00" zadání mluví jen o Z1 + D, bez zmínky o Z2. Přidáváme
  požadavek na Z2 kvůli konzistenci s řádkem 1/2 — v zadání to explicitně není.
- **D v minulosti** (přepravce tvrdí, že mělo být doručeno už dřív) je traktováno stejně jako D v budoucnosti —
  zadání tenhle případ vůbec neřeší.
- **Otevřené, neediskutované:** na jaký systémový termín se váže „dnešek = plánovaný den doručení" u samotného
  bodu (dnešní data používají `system_event: 'add'`, což pravděpodobně není správné pole) — ověřit při psaní
  implementačního plánu.

---

## 3. Nesrovnalosti proti současnému artefaktu

Porovnáno s `nastroje/kontrola-na-bodu-trasy.data.mjs` a `.logic.mjs` (worktree `artefakt-kontrola-trasy`):

1. `bod_1_scan` a `bod_2_scan` mají dnes identické `match: { status: ['Destination facility'] }` — nerozlišují
   Z1 (FedEx Facility) od Z2 (Destination Facility) a vůbec nepoužívají pole `locationType` k tomuto rozlišení.
2. Neexistuje mechanismus pro dynamické porovnání PSČ vůči zásilce (Z2 musí mít PSČ se stejným předčíslím jako
   adresa doručení) — `recordMatchesBod` umí jen pevné seznamy povolených hodnot, ne porovnání proti poli
   konkrétní zásilky.
3. Kontrola 1 (R30, `fixed_clock 08:00`) se dnes vyhodnocuje přímo v 8:00 — v rozporu s požadavkem
   nevyhodnocovat dřív než v 9:00 kvůli zpoždění dat z trackingu.
4. `evaluateKontrola` slučuje „deadline vlastního času záznamu" (8:00) a „čas vyhodnocení" (9:00) do jednoho
   `triggerTime` — porovnává `matchedRecord.time <= triggerTime`, takže kontrola v 9:00 by dnes propustila i
   scan v 8:45, což zadání nepovoluje.
5. Větev „sev_early_warning" (Kontrola 2 nesplněna, D=dnes) dnes rovnou zakládá VkŘ — podle zadání jde ale o
   čistě čekací stav bez jakékoli akce až do rekontroly v 10:00.
6. Bod 2 (druhý scan) dnes vůbec neřeší, že se D mezi kontrolami mohlo posunout.

Tyto body zdůvodňují, proč se nejde omezit na opravu dat a je potřeba nový typ bodu (§5).

---

## 4. Nový typ bodu: „Dnešní doručení"

Zůstává to `Bod` ve stromu Úsek → Bod (beze změny existujícího generického `Bod`), jen s novým rozlišovačem
typu, který nese jinou vnitřní strukturu:

```
Bod (kind: "dnesni_doruceni")
  ├─ id, name                     — jako dnes
  ├─ scan1: { match, termín }     — stejný tvar jako dnešní Bod.match/deadline
  ├─ scan2: { match, termín }     — termín kotva na scan1 + offset (jako dnes kotva na jiný bod)
  ├─ limitCasKontroly1: "09:00"   — NOVÉ — kdy se poprvé kontroluje vlastní čas scan1
  ├─ celkovyLimit: "10:00"        — NOVÉ — finální mez, kdy vlastní čas scan1 už nerozhoduje
  └─ toleranceScan2: 1 (hodina)   — NOVÉ — grace okno pro vyhodnocení scan2
```

**Match rozšíření (řeší bug §3.2):** `scan2.match` potřebuje nový typ podmínky — dynamické porovnání PSČ
místa vůči PSČ adresy doručení zásilky (prefix shoda), ne pevný seznam hodnot:

```
scan2.match.postalCode = { prefixEqualsShipmentField: 'destPostalCode', digits: 2 }
scan1.match.locationCountryCode / scan2.match.locationCountryCode
  = { equalsShipmentField: 'destCountryCode' }
```

**Vyhodnocování je periodické, ne jednorázové:** kontrola běží opakovaně od termínu scan1 dál (např. každých
10 min), takže úspěch se může potvrdit dřív, než nastane limitní čas — limitní/celkový čas je jen nejzazší
mez, do které musí padnout konečná odpověď.

---

## 5. Finální stavy — bez uživatelsky konfigurovatelné podmínky na D

Zvažovaly se dvě varianty, jak modelovat rozhodování podle D (datum od přepravce):

- **Varianta A** (zvažována nejdřív) — D zůstává jako obecná podmínka na větvi, stejně jako dnes u Kontroly
  (uživatel by ručně přidal „+ podmínka" s polem/operátorem/hodnotou).
- **Varianta B** — D jako pojmenované 4. nastavení bod-typu (výběr pole + hodnoty ve formuláři).

**Rozhodnuto jinak (Varianta C):** po review wireframe (viz §6) se ukázalo, že „+ podmínka" tlačítko v UI
nedává smysl — rozhodnutí, **kdy** se vůbec dívat na D, je nedílná součást vyhodnocovacího algoritmu tohoto
konkrétního bod-typu, ne něco, co by uživatel měl skládat ručně. D-větvení je tedy **plně vestavěné do
vyhodnocovacího enginu** (hardcoded), needitovatelné a needkonfigurovatelné v UI.

Důsledek: bod-typ interně počítá **rovnou finální stavy** (řádky 1, 2, 3, 5, 6, 7, 8 z tabulky v §2 — řádek 4
je jen vnitřní mezikrok, nikdy se nezobrazí). Uživatel v UI vidí 7 pevně pojmenovaných řádků a ke každému
přiřazuje jen Situaci/Závažnost — přesně jako dnes u výsledku Kontroly, ale bez možnosti přidávat vlastní
podmínky.

---

## 6. Wireframe editoru (schváleno)

Ověřeno přes vizuální companion (`.superpowers/brainstorm/`, iterace v1 → v3). Uložená referenční verze:
**`mockups/2026-07-17-dnesni-doruceni-editor-wireframe.html`** (v3 — UX/wording se ještě dolaďuje, layout je
finální). Layout:

- **Vlevo** — strom Úsek → Bod, beze změny.
- **Vpravo, pro vybraný bod „Dnešní doručení":**
  1. Sekce **1. fyzický scan** — match + termín, a hned pod tím dvě pole **limitní čas kontroly** a
     **celkový limit** (patří k vyhodnocení 1. scanu, proto jsou v jeho sekci, ne v samostatném bloku).
  2. Sekce **2. fyzický scan** — match + termín (kotva na scan1 + offset), a pod tím pole
     **tolerance 2. scanu**.
  3. Sekce **Výsledné stavy → Situace / Závažnost** — 7 pevných řádků (viz §5), u každého jen výběr
     Situace/Závažnosti, žádná podmínka.

Vývoj iterací:
- **v1** měla u dvou stavů tlačítko „+ podmínka" pro D-větvení — zamítnuto v review, nahrazeno plochým
  seznamem finálních stavů (viz §5, Varianta C).
- **v2** sjednotila na plochý seznam 7 stavů, ale časová nastavení byla v samostatné sekci „Časová
  nastavení" oddělené od obou scanů.
- **v3** (uložená verze) přesunula limitní čas/celkový limit pod sekci 1. scanu a toleranci pod sekci
  2. scanu — každé pole je vizuálně u toho scanu, ke kterému se vyhodnocením váže, žádná samostatná sekce
  navíc.

---

## 7. Mimo rozsah / otevřené otázky pro implementační plán

- **Systémová kotva „dnešek = plánovaný den doručení"** — dnešní `bod_1_scan.deadline` kotví na
  `system_event: 'add'`, což pravděpodobně není správné pole pro „plánovaný den doručení". Ověřit/opravit.
- **Přesný název pole/mechanismus pro dynamické porovnání PSČ a země** (§4) — schéma je navrženo, implementace
  `recordMatchesBod`/`match` v `kontrola-na-bodu-trasy.logic.mjs` bude potřeba rozšířit.
- **Migrace dat** — `bod_1_scan`/`bod_2_scan` a jejich Kontroly (R30/R97/R39/R14) nahradit jedním bodem typu
  `dnesni_doruceni`. Přesný postup (smazat a nahradit vs. migrační skript) řešit v implementačním plánu.
- **Needimplementováno.** Tento dokument je čistě návrh k review — žádný kód (`nastroje/kontrola-na-bodu-trasy.*`)
  zatím nebyl měněn.

---

## 8. Co zbývá

Design je hotový — odvozená byznysová logika, srovnání s bugy v současném artefaktu, nový datový model bod-typu
a wireframe editoru jsou probrané a schválené.

- **Spec self-review a finální schválení od uživatele.**
- Přechod na implementační plán (`writing-plans`) — až uživatel potvrdí, že chce pokračovat implementací.
