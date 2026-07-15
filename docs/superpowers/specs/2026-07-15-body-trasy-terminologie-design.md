# Design: Terminologie "bod trasy" a zrušení knihovny milníků

**Datum:** 2026-07-15
**Status:** Design dokončen a schválen (visual companion) — čeká na finální review uživatele před přechodem na implementační plán.

> Sub-projekt 1 ze tří (viz kontext níže). Navazuje na `specifikace-konfigurator-pravidel.md` §5 (Trasy a úseky). Nemění nic v oblasti `tracking_records` ani v návrhu Situace/Závažnost/Akce (`2026-07-15-situace-zavaznost-akce-design.md`) — ten zůstává samostatný, needimplementovaný plán.

---

## 1. Kontext a cíl

Klient (po iteraci) reportuje, že mu pojem **"milník"** není srozumitelný. Zároveň na začátku nebude mít mnoho tras, takže sdílená, znovupoužitelná "knihovna milníků" (centrální katalog typů, reuse napříč úseky, `usage count`) přidává komplexitu bez užitku — přechází se na **jednodušší model, kde každý bod cesty patří jen svému úseku**.

Tento dokument je **první ze tří navazujících sub-projektů**, na kterých se domlouváme postupně:
1. **Tento dokument** — terminologie, zrušení knihovny, grafické znázornění cesty.
2. *(později)* Hardcoded soulad s trasou přes "kontroly" na bodu — plán spuštění + větvení splněno/nesplněno přesunuté na bod, napojení na Situace/Závažnost/Akce.
3. *(později)* Alternativní trasy — hlavní + alternativní trasa sestavená z úseků, fallback vyhodnocení.

Vztah k již schválenému, ale needimplementovanému plánu Situace/Závažnost/Akce (jen oblast `tracking_records`) se řeší later — zatím se nedomlouvá pořadí implementace, jen návrh.

---

## 2. Terminologie

| Dnes | Nově |
|---|---|
| Milník / typ milníku | **Bod** (plně "bod trasy" — používá se při prvním vysvětlení, v UI stručně "bod", stejně jako se dnes používalo "milník") |
| Knihovna milníků | *(zaniká — viz §3)* |
| "Milníky úseku (N)" | "Body úseku (N)" |
| "Vytvořit nový typ milníku" | "+ Přidat bod" |

Termín **"záznam z trackingu"** navržený klientem se **nepoužívá pro bod/milník** — dnes už označuje celou oblast pravidel *Záznamy z trackingu* (`tracking_records` v top nav) a kolidovalo by to. "Bod" nese jinou roli (definice očekávané pozice na cestě), "záznam z trackingu" zůstává vyhrazený pro skutečnou aktivitu, která na zásilce přijde.

---

## 3. Datový model

### 3.1 Zrušení sdíleného katalogu

`CheckpointType` jako samostatná, napříč úseky sdílená entita **zaniká úplně**. `Checkpoint` nese svůj `name` přímo na sobě:

```ts
// Dnes:
export interface CheckpointType { id: string; name: string; description?: string }
export interface Checkpoint {
  id: string; checkpointTypeId: string; note?: string;
  match: CheckpointMatch; correctness: CheckpointCorrectness[];
  // ...
}

// Nově:
export interface Checkpoint {
  id: string; name: string; note?: string;
  match: CheckpointMatch; correctness: CheckpointCorrectness[];
  // ...
}
```

Žádné druhé textové pole navíc — `note` (dnešní volitelná poznámka) zůstává, `CheckpointType.description` se nepřenáší (redundantní s `note`).

Zaniká: `checkpointTypesStore`, `useCheckpointTypes`, `milestoneTypeUsage`, `isCheckpointTypeUsed` (žádné sdílení → žádné počítání použití, žádný guard proti smazání používaného typu).

### 3.2 Kotva časové podmínky — změna chování

**Důležité pro komunikaci s klientem:** dnešní kotva (`CheckpointCorrectness.anchorCheckpointTypeId`, i kotva pole "Čas uvedený na záznamu" v `CheckpointMatch.event_time_of_day`) nabízí výběr **podle typu milníku** napříč úplně vším. Po zrušení katalogu typů nejde vybírat "typ" — kotva bude nabízet **konkrétní existující bod**, a to:

- **Napříč všemi úseky** (ne jen ve stejném úseku, kde se bod právě edituje) — protože kotva u bodu na jednom úseku musí jít nastavit i na bod ležící na **jiném úseku téže trasy** (segmenty se řadí do trasy, kotva potřebuje sáhnout "dozadu" i přes hranici úseku).
- **Přehledně seskupené/seřazené podle úseku** — dropdown/picker má sekce podle názvu úseku, ne plochý seznam.
- Nejde o omezení na "aktuální trasu" — protože úsek je znovupoužitelná entita bez pevné vazby na jednu trasu (může být součástí víc tras současně), takže editor úseku nemá spolehlivě k dispozici "tuhle konkrétní trasu" jako kontext. Nabídka je tedy globální napříč všemi úseky v systému, seskupená podle úseku.
- Sekce "Systémová data" (`sys_created`, `sys_pickup`, …) zůstává beze změny.

Tohle je **změna chování oproti dnešku** (dnes: nabídka podle typu; nově: nabídka podle konkrétního bodu), ne jen kosmetika — je potřeba klientovi vysvětlit, že místo "typu milníku" teď vybírá "konkrétní bod na konkrétním úseku".

### 3.3 Vše ostatní na bodu zůstává

Match podmínky (`CheckpointMatch` — status, typ lokace, město, kód výjimky, čas uvedený na záznamu…) a časová správnost (`CheckpointCorrectness` — operátor, jednotka, kotva, konkrétní čas) **se nemění**. Mění se jen: (a) terminologie/labely, (b) zdroj nabídky u kotvy (viz §3.2). Konfigurační panel bodu (dnešní `CheckpointConfig` v `SegmentEditorPage`) zůstává funkčně stejný.

---

## 4. UI: grafické znázornění cesty

Svislá rovná linka (varianta zvolená ve visual-companion session) se vkládá **přímo do existujících seznamů**, nevzniká samostatný diagram navíc:

- Tečka/kolečko před každou položkou seznamu, spojovací čára mezi tečkami.
- Poslední položka = dutý kroužek (vyjadřuje cílový/koncový bod cesty).
- Aplikuje se na dvou místech:
  - **Stránka Úseku** (`/usek/$id`, `SegmentEditorPage`) — seznam "Body úseku (N)".
  - **Stránka Trasy** (`/trasa/$id`, `RouteEditorPage`) — seznam úseků skládajících trasu.

Wireframe (viz `.superpowers/brainstorm/20002-1784137990/content/wireframe-klient.html`) je **ilustrace vizuálu**, ne redesign celého konfiguračního panelu — zjednodušené "+ Přidat bod" v náhledu (jen název + poznámka) i zjednodušená kotva jsou jen pro demonstraci principu. Skutečný konfigurační panel bodu si drží veškeré dnešní funkce (§3.3).

---

## 5. Dopad na existující kód

| Soubor | Dopad |
|---|---|
| `src/components/routes/MilestoneLibrary.tsx` | Mrtvý kód (nenavázaný na žádnou routu) → smazat. |
| `src/components/routes/CheckpointWizard.tsx` | Mrtvý kód → smazat. |
| `src/components/routes/RouteMap.tsx` | Mrtvý kód → smazat. |
| `src/components/routes/SegmentEditor.tsx`, `src/components/routes/RouteEditor.tsx` | Mrtvý kód (staré verze, nahrazené `*Page` variantami) → smazat. |
| `src/components/routes/SegmentEditorPage.tsx` — panel "Přidat milník" (hledání v knihovně, seznam typů s `usage count`, mazání typu) | Nahradit prostým **"+ Přidat bod"**, otevírá formulář `name` (+ volitelně `note`) — bez hledání/procházení mezi úseky. |
| `src/components/rules/editors/MilestoneTypePicker.tsx` a karta **"Zmeškaný milník"** v `RuleCreatorPage.tsx` (oblast *Soulad s trasou*) | Závisí na zrušeném katalogu typů. **Dočasně nefunkční / označit "připravujeme"** — nahradí ho sub-projekt 2 (hardcoded soulad), nemá smysl teď investovat do plného přepracování. |
| `src/components/rules/editors/RouteComplianceEditor.tsx` | Už dnes mrtvý kód (viz plán Situace/Závažnost/Akce) — beze změny, nedotýkat se. |
| `CorrectnessRuleCard` / anchor pickery v `SegmentEditorPage.tsx` (`checkpointTypes.map(...)` na 3 místech) | Přepsat na výběr bodu napříč úseky, seskupený podle úseku (viz §3.2). |
| `specifikace-konfigurator-pravidel.md` §5 | Aktualizovat po implementaci (living document). |

---

## 6. Rozsah a mimo rozsah

**V rozsahu:** terminologie (bod/body), zrušení `CheckpointType` a knihovny, přepis kotvy na výběr konkrétního bodu napříč úseky, svislá linka na stránce Úseku i Trasy, úklid mrtvého kódu.

**Mimo rozsah (řeší se v navazujících sub-projektech):**
- Hardcoded soulad s trasou, "kontroly" na bodu, plán spuštění přesunutý na bod, napojení na Situace/Závažnost/Akce (sub-projekt 2).
- Alternativní trasy (sub-projekt 3).
- Plné přepracování karty "Zmeškaný milník" v tvorbě pravidla — jen dočasně odstavena (§5), plnohodnotně ji nahradí sub-projekt 2.
- Pořadí implementace vůči plánu Situace/Závažnost/Akce (`tracking_records`) — zatím neřešeno.

---

## 7. Co zbývá

Design je hotový — terminologie, datový model, chování kotvy i grafika cesty jsou probrané a schválené (včetně visual-companion session s wireframem). Zbývá:

- **Review tohoto dokumentu od uživatele.**
- Přechod na implementační plán (`writing-plans`).
