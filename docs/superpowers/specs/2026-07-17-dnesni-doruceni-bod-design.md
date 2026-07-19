# Design: Bod „Dnešní doručení" a situace „Problém na trase"

**Datum:** 2026-07-17
**Status:** Design dokončen a schválen (rozhodovací logika pro 1./2. scan, zjednodušený model pro Problém na trase, wireframe editoru). Čeká na finální review uživatele před přechodem na implementační plán.

> Navazuje na `docs/superpowers/specs/2026-07-16-artefakt-kontrola-trasy-design.md` (implementováno ve worktree
> `.claude/worktrees/artefakt-kontrola-trasy`, soubory `nastroje/kontrola-na-bodu-trasy.*`). Tento dokument řeší
> konkrétní byznysovou logiku dvou situací:
> 1. **Zpoždění v den doručení** (1. a 2. fyzický scan) — dnešní `bod_1_scan`/`bod_2_scan`, R30/R97/R39/R14 —
>    dostatečně komplexní na to, aby potřebovala **nový specializovaný typ bodu**.
> 2. **Problém na trase** (např. odlet z Brna, přílet do Paříže) — jednodušší, zůstává na **generickém
>    typu bodu**, jen s doplněnou Kontrolou, která dnes chybí.

---

## 1. Kontext a cíl

Klient popsal přesnou logiku, podle které se má v den plánovaného doručení vyhodnotit tracking a rozhodnout, jestli
zásilka dorazí dnes, nebo je zpožděná (situace 1). Zároveň existují jednodušší, ale zatím nedořešené kontroly na
běžných bodech trasy, kde klient nepopisuje, co se má stát po negativním výsledku (situace 2).

Při rozboru zadání se ukázalo, že existující artefakt „Kontrola na bodu trasy" už situaci 1 modeluje (body
`bod_1_scan`/`bod_2_scan`), ale zjednodušeně a s několika konkrétními chybami proti zadání (viz §5). Generický
mechanismus „Bod → N Kontrol" navíc nutí duplikovat podmínky a neumí čistě vyjádřit klíčový požadavek zadání —
**oddělit** „vlastní čas záznamu musí být do X" od „kdy se to poprvé smíme jít podívat" (kvůli zpoždění dat
z trackingu). Řešením pro situaci 1 je nový, purpose-built typ bodu. Situace 2 je jednodušší a zůstává na
generickém bodu, jen s doplněnou logikou.

---

## 2. Dvě klíčová pole — nezaměňovat

Napříč oběma situacemi se pracuje se dvěma různými datovými poli, která je snadné si splést (a v jedné z
dřívějších verzí tohoto designu jsme si je skutečně splietly):

| Pole | Význam | Kdy se čte | Chování |
|---|---|---|---|
| **ADD** | Avizované datum doručení **zákazníkovi**, nastavené u nás v systému. | **Jednou** — jako vstupní brána, určuje, jestli se bod „Dnešní doručení" dnes vůbec vyhodnocuje. | Statické — v rámci dne se neposouvá. |
| **D** (datum doručení od přepravce) | Živý odhad **z trackingových dat přepravce** (dnes pole `datumDoruceniOdPrepravce`). | **Opakovaně** — při každé časované kontrole uvnitř vyhodnocení. | Jediné pole, které se může v průběhu dne posunout — jeho posun znamená jisté zpoždění. |

Kompletní flowchart pro obě situace (finální názvosloví, včetně zjednodušeného modelu pro Problém na trase):
**`mockups/2026-07-17-spolecny-flowchart-final.html`**.

---

## 3. Situace 1: Zpoždění v den doručení — 1. fyzický scan

### 3.1 Vstupní brána

Bod „Dnešní doručení" se vyhodnocuje **pouze pokud `ADD = dnes`**. Pokud ne, žádná z níže popsaných kontrol
neproběhne vůbec.

### 3.2 Tři kontroly

| Kontrola | Nastavení (UI název) | Kdy | Na základě čeho se spouští | Podmínky řádného záznamu |
|---|---|---|---|---|
| **Kontrola 1** (reaktivní) | **Termín** (nejpozdější možný čas) | aktivní do 9:00 | ADD = dnes ∧ status nalezen v trackingu | vlastní čas záznamu ≤ Termín (8:00) |
| **Kontrola 2** (časovač) | **Limit pro řádné záznamy** (kdy přehodnotit) | 9:00 | ADD = dnes ∧ status se **řádně neobjevil do Termínu** (buď vůbec, nebo s pozdějším vlastním časem než 8:00) | — |
| **Kontrola 3** (časovač) | **Konečný limit** (do kdy čekat) | 10:00 | zásilky, které z Kontroly 2 přešly do stavu „čeká se" (záznam se neobjevil řádně) | — |

**Kontrola 1 — výsledek:** vlastní čas ≤ Termín → **pozitivní** (žádná kontrola D zde — vědomě, viz níže).

**Kontrola 2 posuzuje jen řádnost záznamu** (nalezen, vlastní čas ≤ Termín?) — je to tatáž otázka jako u
Kontroly 1, jen s časovačem jako pojistkou v 9:00. **D se v rámci Kontroly 2 vůbec nekontroluje** — poprvé se
vyhodnotí až v Kontrole 3 (Konečný limit, 10:00).

**Kontrola 2 — výsledek:**
- Záznam řádný (nalezen do Termínu) → stejně jako u Kontroly 1, pokračuje se na 2. scan.
- Záznam neřádný (chybí, nebo nalezen s pozdějším vlastním časem) → **žádná VkŘ**, vnitřní stav „čeká se do
  Konečného limitu" — bez ohledu na D.

**Kontrola 3 — výsledek, dva kroky postupně:**
1. Objevil se záznam vůbec (kdykoli, i mezi 9:00–10:00 — vlastní čas záznamu už nerozhoduje)? Ne → **final
   negativní výsledek** „Zpožděná zásilka", bez ohledu na D.
2. Ano → znovu kontrola D: dnes → **úspěch** „Předpoklad dnešního doručení". Budoucnost → **final negativní
   výsledek** „Zpožděná zásilka".

**Vědomé rozhodnutí:** Kontrola 1 nekontroluje D, i když by to teoreticky zpřísnilo časný pozitivní výsledek —
drženo přesně podle doslovného zadání klienta.

---

## 4. Situace 1: Zpoždění v den doručení — 2. fyzický scan

Na rozdíl od 1. scanu **jednostupňové** — jen jedna Kontrola, žádný mezistupeň „Limit pro řádné záznamy".

| Nastavení (UI název) | Hodnota v příkladu | Poznámka |
|---|---|---|
| **Termín** | čas 1. scanu + 2 hodiny | vlastní čas 2. scanu musí být ≤ tohle |
| **Konečný limit** | Termín + 1 hodina | podporuje stejný dvojí režim zadání (absolutní čas / relativní posun) jako u 1. scanu |

**Kontrola (reaktivní), aktivní od skutečného času 1. scanu do 3 hodin po něm** (= 1 hodina po Termínu 2. scanu):

Řádný záznam pro 2. scan:
- z cílové země,
- typ lokace = „Destination Facility" (ne „FedEx Facility" jako u 1. scanu),
- **PSČ místa začíná stejnou jednou číslicí** jako PSČ místa doručení v datech zásilky (jen 1 číslice, ne 2).

**Výsledek:** Splněno → „Předpoklad dnešního doručení". Nesplněno → „Zpožděná zásilka" (final, jeden krok,
žádné čtení D u 2. scanu).

**Nová funkčnost v UI:** input PSČ v podmínkách záznamu musí kromě pevných hodnot podporovat i režim **„shoda
se zásilkou"** — dynamické porovnání první číslice PSČ lokace vůči první číslici PSČ adresy doručení zásilky.

---

## 5. Rozhodovací tabulka — situace 1 (finální stavy)

Rozhodovací strom (mermaid diagram) uložen jako samostatný artefakt:
**`mockups/2026-07-17-zpozdeni-v-den-doruceni-rozhodovaci-strom.html`**.

| # | Podmínka | Výsledek | Zdroj |
|---|---|---|---|
| 1 | 1. scan (vlastní čas ≤ Termín) ∧ 2. scan v okně (Termín+2h, Konečný limit +1h) | ✅ Předpoklad dnešního doručení | explicitně v zadání |
| 2 | 1. scan (vlastní čas ≤ Termín) ∧ ¬2. scan v okně | 🚫 Zpožděná zásilka | explicitně v zadání |
| 3 | ¬1. scan do Limitu pro řádné záznamy (9:00) → čeká se do Konečného limitu | *(vnitřní mezistav, žádná akce, needávaný jako konfigurovatelný řádek — D se v Kontrole 2 vůbec nekontroluje)* | explicitně v zadání |
| 4 | 1. scan stále nenalezen do Konečného limitu (10:00) | 🚫 Zpožděná zásilka | explicitně v zadání |
| 5 | 1. scan nalezen do 10:00 (vlastní čas už nerozhoduje) ∧ D se mezitím posunulo | 🚫 Zpožděná zásilka | explicitně v zadání |
| 6 | 1. scan nalezen do 10:00 ∧ D stále dnes ∧ 2. scan v okně | ✅ Předpoklad dnešního doručení | **dopočteno** — zadání u téhle větve 2. scan vůbec nezmiňuje |
| 7 | 1. scan nalezen do 10:00 ∧ D stále dnes ∧ ¬2. scan v okně | 🚫 Zpožděná zásilka | **dopočteno** |

### 5.1 Dopočtené předpoklady — potvrdit u klienta

- **Žádná kontrola D v Kontrole 2 (9:00).** Zadání popisuje D-větvení jen pro stav „čeká se do 10:00" (D=dnes) —
  co se stane, když D už v 9:00 neodpovídá dnešku, text vůbec neřeší. Dřívější verze téhle specifikace sem
  přidávala domněnku „D≠dnes už v 9:00 → okamžité zpoždění" — to bylo **omylem přidané zpřísnění nad rámec
  zadání** a bylo odstraněno. Podle doslovného zadání se D poprvé vyhodnocuje až v Kontrole 3 (10:00).
- **Řádek 6/7:** Ve větvi rekontroly v 10:00 zadání mluví jen o 1. scanu + D, bez zmínky o 2. scanu. Přidáváme
  požadavek na 2. scan kvůli konzistenci s řádkem 1/2 — v zadání to explicitně není.
- **D v minulosti** (přepravce tvrdí, že mělo být doručeno už dřív) je traktováno stejně jako D v budoucnosti —
  zadání tenhle případ vůbec neřeší.

---

## 6. Nesrovnalosti proti současnému artefaktu

Porovnáno s `nastroje/kontrola-na-bodu-trasy.data.mjs` a `.logic.mjs` (worktree `artefakt-kontrola-trasy`):

1. `bod_1_scan` a `bod_2_scan` mají dnes identické `match: { status: ['Destination facility'] }` — nerozlišují
   1. scan (FedEx Facility) od 2. scanu (Destination Facility) a vůbec nepoužívají pole `locationType`.
2. Neexistuje mechanismus pro dynamické porovnání PSČ vůči zásilce (2. scan musí mít PSČ se stejnou první
   číslicí jako adresa doručení) — `recordMatchesBod` umí jen pevné seznamy povolených hodnot.
3. Kontrola 1 (R30, `fixed_clock 08:00`) se dnes vyhodnocuje přímo v 8:00 — v rozporu s požadavkem
   nevyhodnocovat dřív než v Limitu pro řádné záznamy (9:00) kvůli zpoždění dat z trackingu.
4. `evaluateKontrola` slučuje „deadline vlastního času záznamu" (Termín, 8:00) a „čas vyhodnocení" (9:00) do
   jednoho `triggerTime` — porovnává `matchedRecord.time <= triggerTime`, takže kontrola v 9:00 by dnes
   propustila i scan v 8:45, což zadání nepovoluje.
5. Větev „sev_early_warning" (Kontrola 2 nesplněna, D=dnes) dnes rovnou zakládá VkŘ — podle zadání jde ale o
   čistě čekací stav bez jakékoli akce až do rekontroly v Konečném limitu.
6. Bod 2 (druhý scan) dnes vůbec neřeší, že se D mezi kontrolami mohlo posunout.
7. Anchor bodu `bod_1_scan.deadline` dnes kotví na `system_event: 'add'`, což pravděpodobně není správné pole
   pro vstupní bránu ADD — ověřit/opravit v implementačním plánu.

---

## 7. Nový typ bodu: „Dnešní doručení"

Zůstává to `Bod` ve stromu Úsek → Bod (beze změny existujícího generického `Bod`), jen s novým rozlišovačem
typu, který nese jinou vnitřní strukturu:

```
Bod (kind: "dnesni_doruceni")
  ├─ id, name                       — jako dnes
  ├─ scan1: { match, termín }       — stejný tvar jako dnešní Bod.match/deadline ("Termín")
  ├─ scan2: { match, termín }       — termín kotva na scan1 + offset
  ├─ limitProRadneZaznamy: "09:00"  — UI: "Limit pro řádné záznamy" — kdy poprvé přehodnotit scan1
  ├─ konecnyLimitScan1: "10:00"     — UI: "Konečný limit" — finální mez pro scan1, vlastní čas už nerozhoduje
  └─ konecnyLimitScan2: +1 hodina   — UI: "Konečný limit" — grace okno pro vyhodnocení scan2
```

**Match rozšíření (řeší bug §6.2):** `scan2.match` potřebuje nový typ podmínky — dynamické porovnání PSČ
místa vůči PSČ adresy doručení zásilky (shoda první číslice), ne pevný seznam hodnot:

```
scan2.match.postalCode = { prefixEqualsShipmentField: 'destPostalCode', digits: 1 }
scan1.match.locationCountryCode / scan2.match.locationCountryCode
  = { equalsShipmentField: 'destCountryCode' }
```

**Vyhodnocování je periodické, ne jednorázové:** kontrola běží opakovaně od Termínu scan1 dál (např. každých
10 min), takže úspěch se může potvrdit dřív, než nastane Limit pro řádné záznamy — limity jsou jen nejzazší
mez, do které musí padnout konečná odpověď.

### 7.1 Finální stavy — bez uživatelsky konfigurovatelné podmínky na D

Zvažovaly se dvě varianty, jak modelovat rozhodování podle D:

- **Varianta A** — D jako obecná podmínka na větvi (uživatel by ručně přidal „+ podmínka").
- **Varianta B** — D jako pojmenované nastavení bod-typu (výběr pole + hodnoty ve formuláři).

**Rozhodnuto jinak (Varianta C):** po review wireframe se ukázalo, že „+ podmínka" tlačítko v UI nedává
smysl — rozhodnutí, **kdy** se vůbec dívat na D, je nedílná součást vyhodnocovacího algoritmu tohoto
konkrétního bod-typu. D-větvení je **plně vestavěné do vyhodnocovacího enginu** (hardcoded), needitovatelné
a needkonfigurovatelné v UI.

Důsledek: bod-typ interně počítá **rovnou finální stavy** (řádky 1, 2, 3, 5, 6, 7, 8 z tabulky v §5 — řádek 4
je jen vnitřní mezikrok, nikdy se nezobrazí). Uživatel v UI vidí 7 pevně pojmenovaných řádků a ke každému
přiřazuje jen Situaci/Závažnost.

---

## 8. Situace 2: Problém na trase

Příklad: úsek ČR–Paříž, body „Odlet Praha/Brno" (Termín 22:00 v den vyzvednutí), „Přílet Paříž" (Termín
následující pracovní den 3:00), atd. — na rozdíl od situace 1 **zůstává generický typ bodu**, jen s doplněnou
Kontrolou, kterou dnes body v seed datech (`bodOdletZeZeme`, `bodPriletHub`, `bodOdletHub`, `bodPriletCil`)
vůbec nemají (`kontroly: []`).

### 8.1 Zjednodušený model

Klient nedodal dost informací pro plně propracovanou logiku (repeat-loop, vazba na ADD) — počítáme zatím
primárně s pozitivním scénářem:

1. **Match + Termín** — beze změny, generický bod jako dnes.
2. **Jediná kontrola** — nastavení **Konečný limit**, zadané v režimu „v termínu" (offset 0 — stejný dvojí
   režim zadání jako u situace 1, jen s nulovým posunem). **Časovač, ne reaktivní** — vědomé zjednodušení,
   rychlejší reaktivní vyhodnocení zatím stranou.
3. Splněno do Termínu → žádná VkŘ. Nesplněno → VkŘ „Problém na trase".

### 8.2 Vědomá mezera — pevné termíny vs. kaskáda

Termíny jsou podle zadání vázané na **pevné datum a čas vyzvednutí**, ne kaskádovitě na skutečný čas
předchozího bodu — i když engine v `kontrola-na-bodu-trasy.logic.mjs` kaskádu už má a testuje
(`computeBodTermin`, test „PŘESUNE se podle SKUTEČNÉHO příchodu, když už bod nastal").

**Důsledek:** jakmile je jeden bod zpožděný, každý další bod v řetězci nevyhnutelně taky vyhodnotí Nesplněno
a pošle **vlastní** VkŘ za tentýž kořenový problém — i když operátor mezitím ručně upraví ADD, navazující
kontroly to nijak nereflektují, protože se vůči ADD/D vůbec nekontrolují.

**Otázka pro klienta:** dá se termín navazujících bodů nějak odvodit/odečítat od ADD, aby se zabránilo
duplicitní eskalaci za týž kořenový problém?

### 8.3 Doplňkový mechanismus — informativní VkŘ

I po Konečném limitu, když se záznam objeví pozdě (jinak splňuje podmínky), pošle se samostatná
**informativní VkŘ** (nižší závažnost než „Problém na trase") — čistě reaktivně, bez sledování, jestli už
předchozí VkŘ někdo řešil.

---

## 9. Wireframe editoru (schváleno, k přejmenování polí)

Ověřeno přes vizuální companion (`.superpowers/brainstorm/`, iterace v1 → v3). Uložená referenční verze:
**`mockups/2026-07-17-dnesni-doruceni-editor-wireframe.html`** (v3). Layout beze změny, ale **pole potřebují
přejmenovat** podle finálního UI názvosloví z §3–4:

- Sekce **1. fyzický scan**: „Termín" beze změny; „Limitní čas kontroly" → **„Limit pro řádné záznamy"**;
  „Celkový limit" → **„Konečný limit"**.
- Sekce **2. fyzický scan**: „Tolerance 2. scanu" → **„Konečný limit"** (jen jedno nastavení navíc k Termínu,
  žádný „Limit pro řádné záznamy" — viz §4).
- Sekce **Výsledné stavy** — beze změny (7 řádků podle §5).

---

## 10. Mimo rozsah / otevřené otázky pro implementační plán

- **Přesný název pole/mechanismus pro dynamické porovnání PSČ a země** (§7) — schéma je navrženo, implementace
  `recordMatchesBod`/`match` v `kontrola-na-bodu-trasy.logic.mjs` bude potřeba rozšířit.
- **Migrace dat** — `bod_1_scan`/`bod_2_scan` a jejich Kontroly (R30/R97/R39/R14) nahradit jedním bodem typu
  `dnesni_doruceni`. Přesný postup (smazat a nahradit vs. migrační skript) řešit v implementačním plánu.
- **Otázka pro klienta k situaci 2** (§8.2) — vazba termínu navazujících bodů na ADD.
- **Needimplementováno.** Tento dokument je čistě návrh k review — žádný kód (`nastroje/kontrola-na-bodu-trasy.*`)
  zatím nebyl měněn.

---

## 11. Co zbývá

Design je hotový pro obě situace — odvozená byznysová logika (1./2. scan), zjednodušený model pro problém na
trase, srovnání s bugy v současném artefaktu, nový datový model bod-typu a wireframe editoru jsou probrané
a schválené.

- **Spec self-review a finální schválení od uživatele.**
- Přechod na implementační plán (`writing-plans`) — až uživatel potvrdí, že chce pokračovat implementací.
