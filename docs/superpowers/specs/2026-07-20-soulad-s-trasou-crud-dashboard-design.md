# Design: Soulad s trasou — CRUD dashboard, editor trasy, drobné opravy

**Datum:** 2026-07-20
**Status:** Design dokončen a schválen (včetně vizuálních maket), čeká na sepsání jako implementační plán.

**Repo:** pracuje se ve worktree `.claude/worktrees/situace-zavaznost-akce` (branch `worktree-situace-zavaznost-akce`).

> Navazuje na `docs/superpowers/specs/2026-07-17-dnesni-doruceni-bod-design.md` a implementační plán
> `docs/superpowers/plans/2026-07-19-soulad-s-trasou.md`, který zavedl stránku „Soulad s trasou" a nahradil
> starou `RoutesAndSegmentsPage`/`RouteEditorPage`/`SegmentEditorPage` (main) zjednodušenou verzí bez
> tvorby/mazání trasy či úseku a bez znovupoužití úseků napříč trasami. Tenhle dokument doplňuje přesně
> tuhle chybějící vrstvu — dashboard, editor trasy, mazání, znovupoužití úseků — a **nesahá** na to, jak se
> konfiguruje jednotlivý bod (to zůstává beze změny).

---

## 1. Kontext a cíl

Dashboard „Soulad s trasou" (`/soulad-s-trasou`) je dnes plochý seznam tras s vnořenými odkazy na úseky —
bez editace/mazání trasy nebo úseku, bez možnosti použít existující úsek na víc tras a bez editoru trasy
(pokrytí, seřazení úseků). Tahle iterace vrací funkčnost, která existovala na `main` (dvousloupcový
dashboard, editor trasy, znovupoužití úseků, mazání s ochranou), a rozšiřuje ji o novou úroveň — **body**
uvnitř úseku — kterou `main` neznal.

**Mimo rozsah** (vědomě nevracíme z `main`):
- Katalog typů milníků (`checkpointTypeId`) jako editovatelná entita — ve worktree je pole natvrdo
  zafixované (`ct_first_scan` u všech nových bodů), identitu bodu dnes nese `kind` + volný text `note`.
  Nebudeme ho oživovat.
- Validace duplicitního typu milníku napříč složenou trasou a kotev napříč celou trasou
  (`validateRouteComposition`, `assembledCheckpoints` v main smyslu) — stavěly na katalogu typů, který
  rušíme. `AnchorPicker` už dnes záměrně kotví jen v rámci aktuálního úseku (viz „Důležitý kontext" v
  `2026-07-19-soulad-s-trasou.md`).
- Sdílení bodů napříč více úseky (obdoba sdílení úseku napříč trasami) — bod zůstává vlastněný přesně
  jedním úsekem (`Segment.checkpoints`), stejně jako dnes.
- Potvrzovací dialogy u mazání — stejná konvence jako `main` (mazání jedním klikem, žádný `confirm()`).

---

## 2. Mazání — pravidla

| Entita | Kdy jde smazat | Mechanismus |
|---|---|---|
| **Trasa** | Vždy. Nic na trasu neodkazuje. | `routesStore.remove(id)` |
| **Úsek** | Jen když není použit na žádné trase. | `isSegmentUsed(id)` (už existuje v `store.ts`) → tlačítko smazat je disabled + tooltip „Používá se v N trasách", stejně jako `main`. |
| **Bod** | Vždy. Bod žije jen uvnitř jednoho úseku (`Segment.checkpoints`), není to sdílená knihovna. | Odebrání z `segment.checkpoints` pole. |

Žádné potvrzovací dialogy u žádné z těchto akcí.

---

## 3. Interakční model řádků v seznamech (dashboard i editor trasy)

Každý řádek (trasa, úsek — na obou úrovních vnoření) má **dvě oddělené akce**:

- **Šipka ▸/▾** — jen rozbaluje/sbaluje vnořený obsah pod řádkem. Nenaviguje nikam.
- **Podtržený název** — naviguje na plnou editační stránku dané entity (trasa → `/soulad-s-trasou/trasa/$id`,
  úsek → `/soulad-s-trasou/usek/$id`).

Řádek bodu (nejnižší úroveň vnoření, uvnitř rozbaleného úseku) **sám o sobě nenaviguje nikam** — bod se
needituje ze seznamu, pouze na stránce úseku (beze změny oproti dnešku). V seznamu se u bodu zobrazuje jen
název (`note`) a odznak typu (Běžný bod / Dnešní doručení).

Schváleno vizuální maketou (`.superpowers/brainstorm/.../row-interaction.html` z relací brainstormingu).

---

## 4. Dashboard `/soulad-s-trasou` — dva sloupce

Vrací se dvousloupcový layout z `main` (`RoutesAndSegmentsPage`), oba sloupce navíc s vnořeným
rozbalováním na úroveň bodů.

### 4.1 Levý sloupec — Trasy

- Hlavička řádku trasy (needitovatelná náhledová informace, edituje se až na `/soulad-s-trasou/trasa/$id`):
  název, kód, dopravce, typ služby, cílové země, odznak aktivní/neaktivní, počet úseků. Stejná sada polí
  jako `main`'s `RouteRow`.
- Šipka rozbalí detail: coverage grid (dopravce / typ služby / cílové země / pokrytí — jako `main`), pak
  **seřazený seznam úseků trasy** — každý úsek jako vlastní vnořený řádek s vlastní šipkou na své body
  (viz §3). Žádné ploché „milníky" chipy jako dřív — místo nich reálná struktura úsek→body.
- V rozbaleném stavu dole dvě akce:
  - **„+ přidat existující úsek"** — otevře seznam úseků, které sedí na dopravce × typ služby trasy (§6),
    kliknutím se úsek připojí (`route.segmentIds` append), žádná navigace pryč.
  - **„+ vytvořit nový úsek"** — vytvoří prázdný úsek, připojí ho k trase, **zůstane na dashboardu**
    (nový úsek se objeví hned ve vnořeném seznamu). Liší se od stejné akce v editoru trasy (§5) právě tímhle
    — tam se naviguje na stránku úseku, tady ne.
  - „Upravit trasu" (link na `/soulad-s-trasou/trasa/$id`) a „Smazat trasu" (vždy povoleno, §2) — jako `main`.

### 4.2 Pravý sloupec — Úseky

- Když je vlevo rozbalená trasa, úseky té trasy se zvýrazní nahoře; pod oddělovačem „ostatní úseky" zbytek
  — přesně chování `main`'s `RoutesAndSegmentsPage` (`routeMatchSegments` / `otherSegments`).
- Každý řádek úseku: název, dopravci, typ služby, počet bodů; šipka rozbalí vnořený seznam bodů (název +
  odznak typu, stejně jako v levém sloupci).
- Nahoře **„+ Nový úsek"** — vytvoří nepřipojený úsek a naviguje rovnou na `/soulad-s-trasou/usek/$id`
  (chování `main`'s `createNewSegment` — beze změny).
- Mazání úseku (tlačítko na řádku nebo v detailu) respektuje ochranu z §2.

---

## 5. `/soulad-s-trasou/trasa/$id` — editor trasy (nová stránka)

Tři sloupce, podle schváleného screenshotu (`main`'s `RouteEditorPage`):

**Vlevo — Pokrytí trasy** (needitovatelné → editovatelné pole):
- Název trasy, Kód trasy (text input)
- Dopravce, Typ služby, Cílová země — multi-select pilulky (stejné volby jako `SegmentMetaEditor`
  používá pro úsek: `CARRIER_OPTIONS`, `TRANSPORT_VARIANTS`; cílové země z `COUNTRY_OPTIONS`,
  `src/lib/routes/countries.ts`)
- Přepínač Aktivní
- Needitovatelný řádek „= N kombinací pokryto" (`carriers.length × serviceTypes.length × destCountries.length`)
- „Uložit trasu" (uloží a naviguje na `/soulad-s-trasou`), „← Zpět na trasy"

**Uprostřed — Úseky trasy:**
- Seřazený seznam připojených úseků: přesun nahoru/dolů, „×" odebrat z trasy (jen odpojení, úsek samotný
  nemaže) — jako `main`.
- **Bez validačního panelu** duplicitních typů/kotev — ten v `main` stavěl na katalogu typů milníků, který
  nevracíme (§1).
- „+ vybrat z knihovny úseků" — filtrovaný seznam podle eligibility (§6), bez `conflict` šedivění (to také
  stavělo na typech milníků).
- „+ vytvořit nový úsek →" — vytvoří, připojí k trase, **naviguje na `/soulad-s-trasou/usek/$id`**
  (`search: { from: routeId }`, viz §7) — na rozdíl od stejné akce na dashboardu (§4.1) tady navigace
  pryč dává smysl, uživatel už je v kontextu jedné trasy.

**Vpravo — náhled vybraného úseku:**
- Klikneš na úsek uprostřed → needitovatelný náhled: seznam bodů (jen název + odznak Běžný
  bod/Dnešní doručení + počet vyplněných match podmínek), tlačítko „Upravit úsek" na plnou stránku.
- Nic nevybráno → prázdný stav s nápovědou (žádná agregovaná „Milníky trasy celkem" — ta v `main` stavěla
  na sdíleném typu milníku napříč úseky, který nevracíme).

---

## 6. Znovupoužití úseků — eligibilita

Trimovaná verze `main`'s `eligibleSegments` (bez `conflict` na duplicitní typ milníku — §1):

```ts
function eligibleSegments(route: Pick<Route, "carriers" | "serviceTypes" | "segmentIds">, segments: Segment[]): Segment[] {
  const sigOk = (s: Segment) =>
    s.carriers.some((c) => route.carriers.includes(c)) &&
    s.serviceTypes.some((t) => route.serviceTypes.includes(t));
  return segments.filter((s) => sigOk(s) && !route.segmentIds.includes(s.id));
}
```

Používá se na obou místech, kde se přidává existující úsek: dashboard (§4.1) i editor trasy (§5).

---

## 7. `/soulad-s-trasou/usek/$id` — beze změny chování, jen doplnění

**Nic v `SegmentMetaEditor`, `BodDetailPanel`, `KontrolyPanel`, `TerminEditor`, `TimeLimitEditor`,
`MatchEditor`, `AnchorPicker`, `SituaceCard`, `DnesniDoruceniEditablePanel` se neupravuje.** Přidává se
pouze:

- Tlačítko **smazat úsek** (respektuje §2 — disabled + tooltip, když je použit na trase).
- Malá ikonka **smazat bod** u každého řádku v levém seznamu bodů (bez omezení, §2).
- Route soubor `soulad-s-trasou_.usek.$id.tsx` přijme volitelný `search: { from?: routeId }`
  (přesně vzor `main`'s `usek.$id.tsx` — `validateSearch` + `Route.useSearch()`), aby „← Zpět" a
  přesměrování po uložení/smazání vědělo, jestli se vrátit na `/soulad-s-trasou` nebo na
  `/soulad-s-trasou/trasa/$id`.

---

## 8. Drobné opravy současné verze (mimo hlavní CRUD redesign)

### 8.1 Rozvržení stránky úseku

- Prostřední sloupec (`BodDetailPanel`, dnes `w-[380px]` v `SouladSTrasouUsekPage.tsx`) rozšířit — pole se
  dnes zbytečně tísní.
- Pravý sloupec (`KontrolyPanel`) přejmenovat z „Plán spuštění" na **„Jak to bude fungovat"** a vizuálně
  jasně odlišit jako needitovatelný náhled — tlumenější/„disabled" vzhled oproti editovatelným sloupcům
  vlevo (např. nižší kontrast, jasně čitelný „jen náhled" tón), ne stejná vizuální váha jako zbytek stránky.

### 8.2 Mermaid diagramy v `public/zadani-pro-programatory.html`

Diagramy (`<pre class="mermaid">` bloky, řádky ~163 a ~222) se nevykreslují — stránka nikde nenačítá
knihovnu Mermaid ani nevolá `mermaid.initialize()`. Doplnit `<script>` s Mermaid (vendorováno lokálně, ne
jen CDN, ať funguje i offline/bez připojení) a inicializaci na `DOMContentLoaded`.

---

## 9. Soubory (orientačně)

- `src/routes/soulad-s-trasou_.trasa.$id.tsx` — **nová** route (vzor `soulad-s-trasou_.usek.$id.tsx`,
  stejná `_` notace, aby nedědila layout `soulad-s-trasou.tsx`).
- `src/components/soulad/SouladSTrasouListPage.tsx` — přepsat na dvousloupcový layout (§4).
- `src/components/soulad/RouteRow.tsx`, `SegmentRow.tsx`, `BodRow.tsx` — **nové**, sdílené řádkové
  komponenty pro vnořený seznam (§3, §4), použité v obou sloupcích dashboardu.
- `src/components/soulad/AddExistingSegmentPicker.tsx` — **nová**, sdílený picker eligible úseků (§6),
  použitý v dashboardu i editoru trasy.
- `src/components/soulad/RouteEditorPage.tsx` — **nová** komponenta pro editor trasy (§5), inspirovaná
  `main`'s `RouteEditorPage.tsx`, ale bez validačního panelu a bez katalogu typů milníků.
- `src/lib/model/routeEligibility.ts` — **nová**, trimovaná `eligibleSegments` (§6).
- `src/components/soulad/SouladSTrasouUsekPage.tsx` — doplnit mazání úseku/bodu, `fromRouteId` prop (§7)
  a rozšíření prostředního sloupce (§8.1), jinak beze změny.
- `src/routes/soulad-s-trasou_.usek.$id.tsx` — doplnit `validateSearch` schema pro `from`
  (přesně vzor `main`'s `usek.$id.tsx`).
- `src/components/soulad/KontrolyPanel.tsx` — úpravy z §8.1 (přejmenování, ztlumený vzhled).
- `public/zadani-pro-programatory.html` — oprava z §8.2.

---

## 10. Co zbývá

Design je hotový a prošel vizuálním ověřením (mockupy pro vnořený seznam a interakční model řádků).
Zbývá:
- Spec self-review (viz níže).
- Přechod na implementační plán (`writing-plans`).
