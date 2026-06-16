# Spec: Úseky (segments) — skladba tras ze sdílených úseků

**Datum:** 2026-06-16
**Status:** Návrh k revizi
**Repo:** `Prototype Builder` (Vite + TanStack + React, localStorage prototyp)

> Prototyp je **modul ve stávající Bytorp aplikaci** (`/Users/abcdef/Projects/bytorp`).
> Navazuje na spec `2026-06-15-bytorp-modul-redesign-design.md` (checkpointType, podmínky na checkpointu) a v §3 **koriguje podpis trasy**.

---

## 1. Cíl a rozsah

### 1.1 Co stavíme
Trasa přestane být plochý sled milníků. Místo toho se **skládá z úseků (`Segment`)** — pojmenovaných sledů checkpointů, které jdou **znovupoužít na více trasách**. Sdílený prefix (např. `ČR → Paříž`) se definuje jednou a sdílí; divergence (do USA / Kanady / Tunisu) je až v dalším úseku.

**Motivace:** dnes se milník + jeho časová podmínka (např. „Odlet z Paříže do X") **duplikuje na každé trase**, která přes Paříž jede → tiché rozjíždění hodnot (problém B5 z backlogu). Úseky to řeší u kořene: definuj jednou, sdílej, oprav na jednom místě.

### 1.2 V rozsahu (v1)
- Nová entita **`Segment`** + store.
- **`Route`** drží **seznam úseků** místo checkpointů; složená trasa = zřetězení checkpointů úseků.
- **Editor úseku** s **knihovnou milníků**; **editor trasy** se skládáním a filtrem dle podpisu.
- **Kotva časové podmínky na typ milníku** (ne instanci), rozřešení **přes trasu**, validace.
- **Cíl = země + volitelná jemnější zóna** (stát / PSČ); specifičtější trasa vyhrává.
- Přepis seedu (na zelené louce).

### 1.3 Mimo rozsah (odloženo)
- `service_code` jako jemnější vrstva podpisu (`ServiceCodes` / `FedexServiceType`).
- **Pořadí výskytu** (stejný typ milníku 2× na trase) — zavést jen na reálný případ (viz §6.1).
- **Odpojení / fork** sdíleného úseku — zvolen **čistě sdílený odkaz** bez odpojování.
- Reálné párovací/scheduling runtime — evaluator vyhodnocuje „teď".

---

## 2. Závislost na předchozím redesignu
Úseky stojí na redesignu `2026-06-15`: **podmínky bydlí na checkpointu** a milník je **`checkpointType`** (ruší `RouteProblem` + AND/OR builder). Bez toho by podmínky nemohly **cestovat s úsekem**. → Pořadí: nejdřív (nebo spolu s) onen redesign, pak úseky.

---

## 3. Vazba na reálnou app — korekce podpisu trasy
Zdroj pravdy: `/Users/abcdef/Projects/bytorp/bytorp-frontend/client/types.gen.ts`.

**Podpis úseku/trasy se váže na „služby" (Par-Ser parcelová vrstva), NE na `transport_type`** (to je spedice na `ShipmentDetailSchema`). Tato §3 **opravuje** dřívější tvrzení „dopravce × transport_type × country_import".

- **Dopravce** = `service_provider` → `CarriersProviders`: `FEDEX, UPS, DHL, TNT, DSV, SCHENKER`.
- **Služba** = `service_type` → `ServicesTypes`: `UNKNOWN, EXPRESS, ECONOMY` (tj. „Economy" z boardu).
- **Cíl** = `country_import` + volitelná jemnější zóna (stát/PSČ) — využije stávající `RouteZipRange`.
- Jemnější volitelně přes `service_code` (`ServiceCodes` UPS číselné / `FedexServiceType`) — **odloženo** (§1.3).
- Cenová `CourierServiceLevel` (express/standard/economy) se k párování **NEpoužívá**.
- Prototypové `TRANSPORT_VARIANTS` (`Express/Economy/Pallet/Freight`) → `ServicesTypes` (`EXPRESS/ECONOMY`); `Pallet/Freight` zahodit.

**Podpis úseku** = dopravce × služba (BEZ cíle). **Podpis trasy** = dopravce × služba × cíl.

---

## 4. Datový model (`lib/routes/types.ts`)

### 4.1 `Segment` (nový)
```ts
export interface Segment {
  id: ID;
  name: string;             // „ČR → Paříž"
  description?: string;     // orientace: „Paříž → US hub, pro USA trasy"
  carriers: string[];       // CarriersProviders
  serviceTypes: string[];   // ServicesTypes (EXPRESS/ECONOMY)
  checkpoints: Checkpoint[];// uspořádané; nesou checkpointTypeId, match, časové podmínky
  createdAt: string;
  updatedAt: string;
}
```
- **Bez `destCountries`.** Když se časy liší podle cíle → je to **jiný úsek** (ne další cíl na úseku). Orientaci řeší `name` + `description`.

### 4.2 `Route` (úprava)
- **Odebrat** `checkpoints: Checkpoint[]`.
- **Přidat** `segmentIds: ID[]` — uspořádané **odkazy** na úseky.
- Cíl: `destCountries: string[]` + **nová** volitelná `destZone?: RouteZipRange[]` (zóna na úrovni trasy).
- **Složená trasa** = zřetězení `checkpoints` odkazovaných úseků v pořadí `segmentIds`.
- Podpis = `carriers × serviceTypes × destCountries` (+ zóna). Všechny úseky trasy musí mít `carriers`/`serviceTypes`, které se protínají s podpisem trasy.

### 4.3 `Checkpoint` (úprava)
- `checkpointTypeId` (z redesignu) = **typ milníku** = sdílená identita + jméno. **Typ NEnese `match`.**
- `match: CheckpointMatch` žije **na výskytu** (per úsek). **Smí se lišit** mezi úseky — různí dopravci hlásí stejný milník různě. Typ je jen **spojovací klíč**.
- Časové podmínky na výskytu (z redesignu).

### 4.4 Kotva časové podmínky — na **typ**, ne na instanci
- Změna: `ConditionAnchor` (`kind: "checkpoint_record"`) a `DaySpec` (`relative_checkpoint_record` / `relative_checkpoint_event_time`) odkazují přes **`checkpointTypeId`**, ne `checkpointId`.
- **Rozřešení přes trasu:** na složené trase je typ díky unikátnosti **právě jednou** → kotva se navede na **tu jednu instanci** (z úseku, který na trase leží) → použije **její `match`** a **čas jejího reálného záznamu**. Volba úseku proběhla už při párování trasy → žádná nejednoznačnost.
- **Závislosti úseku:** z kotev mířících na **cizí** typy (které úsek sám nepřináší) se odvodí množina „očekává milník *Y* dříve na trase". Úsek ji **nese a ukazuje**; validuje se při skládání (§6).

---

## 5. Skládání a párování

### 5.1 Editor trasy
- Nahoře **podpis**: dopravce × služba × cíl (+ volitelná zóna).
- **Knihovna úseků filtrovaná podpisem od začátku** (carrier × služba) — nevybereš nekompatibilní. Úsek lze **založit inline**.
- Trasa = uspořádaný sled vybraných úseků.

### 5.2 Specifičnost cíle
- Trasa se zónou (`USA + Kalifornie`) **přebije** obecnou (`USA`) při shodě.
- `findSignatureCollisions` upravit: dvojice **obecná + specifická NENÍ kolize**, ale vztah „specifičtější vyhrává".

### 5.3 Sdílení odkazem
- `Route.segmentIds` jsou **odkazy**; úprava úseku se **propíše do všech tras** (čistě sdílený odkaz, bez kopií/odpojení).
- Při editaci úseku **nenásilná info „použito na N trasách"** (jen transparentnost).

---

## 6. Validace (při skládání trasy)

### 6.1 Unikátnost typu milníku
- **Nelze přidat úsek, který přináší typ milníku, jenž už na trase je** z jiného úseku → **tvrdý blok**.
- Knihovna úseků **zašedí** úseky, které by kolidovaly s aktuálním obsahem trasy.
- Při bloku appka poradí: *„jiný milník → udělej nový typ"* nebo *„opakování (pokus o doručení…) → patří do trackingových pravidel, oblast ④"*.
- Unikátnost je **nosná** pro rozřešení kotev (§4.4) — bez ní kotva/pravidlo ztratí jednoznačnost.

### 6.2 Kotvy
- Kotva míří na typ, který **na trase chybí** → blok / podmínka neaktivní + hláška.
- Kotva míří na typ, který je na trase **níž** (špatné pořadí) → blok / varování.
- Závislosti úseku (§4.4) se ověří proti složené trase.

---

## 7. Runtime (dry-run evaluator)
- **Záznam ↔ checkpoint** přes `match` nad `activities[]` zásilky. Když `match` splní **víc** záznamů: default **první v čase (event time)**, který splní (= „kdy se to fakt stalo"); filtr `latest` zúží na aktuální stav („je teď tady").
- **Kotva**: vezme čas napárovaného záznamu **cílového typu na trase** (`record_event_time` vs `record_created` dle nastavení), aplikuje offset, porovná s vyhodnocovaným milníkem.
- **Kotvený milník zatím nenastal** v reálném trackingu → podmínka je **„zatím nevyhodnotitelná" (čeká)**, NE „porušená".

---

## 8. UX
Drží konvence projektu: **lidská řeč** (věta s klikacími žetony), **vertikální průvodce**, **fialová primární akce**, **volitelnost = prázdný stav**, **chytré návrhy** (našeptat nastavení z jiného výskytu).

- **Editor úseku** (`SegmentEditor`): vlevo **knihovna milníků** (typy + počet použití), vpravo sled checkpointů. Pole typu = **combobox s našeptáváním + „vytvoř psaním"**. Typ použitý víckrát / s vazbou = odznak **„sdílený · N"**; jednorázový = prostý label. → mockup `mockups/2026-06-16-usek-editor.html`.
- **Editor trasy** (`RouteEditor`): podpis nahoře, sled úseků, filtrovaná knihovna úseků.
- **Mechanismus** záznam→match→checkpoint→kotva → mockup `mockups/2026-06-16-zaznam-match-kotva.svg`.
- **Kompozice tras** ze sdílených úseků → mockup `mockups/2026-06-16-trasa-sled-useku.svg`.

---

## 9. Seed a reset
Přepsat `lib/routes/mockData.ts` na **úseky + trasy z úseků** (UPS/FedEx, `EXPRESS`/`ECONOMY`): sdílený `ČR → Paříž`, divergentní `Paříž → USA / Kanada / Tunis` s různými časy odletu, ukázka kotvy přes hranici úseku a cíle se zónou (USA + stát). **Bump verze localStorage klíče** = reset na nový seed (na zelené louce, bez migrace).

---

## 10. Soubory (orientačně)
- `lib/routes/types.ts` — `Segment`, úprava `Route` (`segmentIds`, `destZone`), kotva `checkpointId → checkpointTypeId`.
- `lib/routes/store.ts` — segments store + odkazy z tras.
- `lib/routes/mockData.ts` — nový seed.
- `lib/routes/describe.ts` — lidský popis kotvy přes typ + závislostí.
- `components/routes/SegmentEditor.tsx` (nový), `MilestoneLibrary.tsx` (nový).
- `components/routes/RouteEditor.tsx` — skládání z úseků + filtr + validace.
- `components/routes/CheckpointWizard.tsx` — kotva na typ, závislosti.

---

## 11. Otevřené / odložené body
- `service_code` jemnější vrstva podpisu — **odloženo**.
- **Pořadí výskytu** (stejný typ 2× na trase) — zavést jen na reálný případ; default tvrdá unikátnost.
- **Fork / odpojení** sdíleného úseku — zatím ne (čistě sdílený odkaz).
