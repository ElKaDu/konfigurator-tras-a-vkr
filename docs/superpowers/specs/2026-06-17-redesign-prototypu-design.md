# Redesign prototypu — design spec

**Datum:** 2026-06-17  
**Kontext:** Prototyp se bude používat na velké obrazovce. Přidáváme nové obrazovky, opravujeme stávající UX, přidáváme scénáře pro proklikání.

---

## 1. Konfigurátor pravidel — seznam

**Co se mění:** Kliknutí na řádek pravidla otevře boční panel (sidebar).

### Sidebar pravidla
- Hlavička: kód pravidla + název
- Záložky: **Shrnutí** / **JSON** / **Test** / **Historie**
- Záložka Shrnutí zobrazuje: spouštěč, podmínky, akce (read-only přehled)
- Patička sidebaru: tlačítko **Upravit pravidlo** (naviguje na editor)
- Sidebar se zavírá křížkem nebo kliknutím mimo

### Oblast "Záznamy z trackingu"
Oblast je v UI **disabled** (šedá, neklikatelná). UX se dořeší samostatně a přidá se později.

---

## 2. Vytvoření nového pravidla — 3-sloupcový layout

Krok 1 (výběr oblasti) a krok 2 (nastavení) jsou na **jedné stránce**. Žádné krokování stránek.

### Levý sloupec — Oblast + meta
- Seznam oblastí (radio-style výběr): Záznamy z trackingu *(disabled)*, Soulad s trasou, Vyhodnocení objednávky, Nevyzvednuté zásilky, Parametry a ceny
- Po výběru oblasti "Soulad s trasou" se pod seznam oblastí přidá **výběr situace** (viz sekce 2a)
- Název pravidla (input)
- Priorita (select: LOW / MEDIUM / HIGH / URGENT)
- Přepínač Aktivní / neaktivní
- Tlačítko **Uložit pravidlo** (fixed v patičce sloupce)

### Střední sloupec — Spouštěč + Podmínky
- Pro většinu oblastí: typ spouštěče + editor podmínek (AND/OR logika, + přidat podmínku)
- Pro oblast **Soulad s trasou**: wizard (viz sekce 2a)

### Pravý sloupec — Akce
- Všechny typy akcí dle specifikace:
  - Vytvořit VkŘ (s názvem, template proměnné `{{shipment.reference}}`)
  - Poslat e-mail
  - Nastavit pole
  - Změnit fázi
  - Přidat poznámku
  - Aktualizovat VkŘ
  - Vyžádat pole od operátora
- Tlačítko **+ Přidat akci**
- Pro oblast Soulad s trasou: dvě větve akcí — **Podmínka splněna** (zelená hlavička) a **Podmínka nesplněna** (červená hlavička), každá s vlastním nastavením

---

## 2a. Soulad s trasou — wizard v levém + středním sloupci

### Levý sloupec (rozšíření)
Pod výběrem oblasti se zobrazí sekce **Situace** se čtyřmi kartami:

| Karta | Název | Spouštěč |
|---|---|---|
| 📅 | Kontrola v den doručení | Časový plán (schedule) |
| 📍 | Zásilka v neočekávané lokaci | Reaktivní (condition_met) |
| ⏰ | Zásilka zmeškala milník | Reaktivní (condition_met) |
| ⚙️ | Jiná situace | *disabled — zatím nedostupné* |

### Střední sloupec — upřesnění dle karty

**Karta A — Kontrola v den doručení:**
- Výběr milníku: radiolist (CP1 = První scan v cílové zemi / CP2 = Příjezd na cílové depo)
- Časy kontroly: chipy (08:00 / 09:00 / 10:00) + tlačítko přidat čas
- Časová zóna: auto (TZ cílové země zásilky) — read-only info
- Info note: "Kontrola proběhne pouze v den, kdy carrier avizuje doručení. Pokud předchozí kontrola uspěla, pozdější se přeskočí automaticky."
- **Přeskočení běhu (skipIfPrior):** výběr pravidla + outcome (pozitivně / negativně / jakkoliv)

**Karta B — Zásilka v neočekávané lokaci:**
- Žádné formuláře. Auto-summary: "Podmínka je nastavena automaticky. Systém při každém příchozím tracking záznamu zkontroluje, zda země nebo lokace odpovídá některému bodu na standardní trase zásilky."

**Karta C — Zásilka zmeškala milník:**
- Žádné formuláře. Auto-summary: "Podmínka je nastavena automaticky. Systém sleduje každý milník definovaný na trase zásilky. Jakmile uplyne časový limit milníku a zásilka nemá platný tracking záznam, podmínka se splní. Časové limity nastavuješ v editoru trasy."

**Všechny karty — read-only trigger:**
- Zobrazuje se jako zamčený řádek (🔒 ikona) se popisem automatického spouštěče

### Pravý sloupec — větvené akce (Soulad s trasou)

Dvě akce s větvením:
- **Podmínka splněna** (runWhenRouteCondition: fulfilled) — zelená hlavička
- **Podmínka nesplněna** (runWhenRouteCondition: not_fulfilled) — červená hlavička

Každá akce má rozbalovací sekci **Pokročilé nastavení akce**:

1. **Vyhodnotit jen v čas** (`runAtScheduleTime`) — pouze karta A
   - Checkboxy z časů definovaných v triggeru (08:00 / 09:00 / 10:00)
   - Příklad použití: akce "nesplněna" v 10:00 = "poslední pokus" s jiným názvem VkŘ

2. **Vyhodnotit jen pokud** (`runWhenField`)
   - Řádky: [pole ▼] [operátor ▼] [hodnota] + tlačítko × odebrat
   - Tlačítko + přidat podmínku

3. **Deduplikace** — informační note u akce create_vkr: "Pokud VkŘ se stejným názvem existuje, nová se nevytvoří."

---

## 3. Trasy zásilek + Úseky — jedna stránka, split-screen

### Layout
Stránka je rozdělena na **dvě poloviny** vedle sebe:
- Levá polovina: seznam tras
- Pravá polovina: seznam úseků

### Chování — nezávislé procházení
- Oba sloupce mají vlastní vyhledávání a filtry
- Výchozí stav: oba sloupce zobrazují vše

### Chování — kliknutí na trasu
Jeden klik dělá dvě věci najednou:
1. **Řádek trasy se rozbalí** inline (expandable row) a zobrazí detail:
   - Mřížka: Dopravce, Varianta, Cílové země, Pokrytí (počet kombinací)
   - Milníky trasy (chips v pořadí)
   - Tlačítka: **Upravit trasu** + **JSON**
2. **Pravý sloupec se přefiltruje** na úseky dané trasy
   - Zobrazí se pill-badge s kódem trasy + odkaz "× zrušit filtr"
   - Úseky patřící trase jsou nahoře, ostatní odděleny separátorem níže (ztlumené)

### Chování — kliknutí na úsek
- Otevře sidebar s detailem úseku (analogicky jako sidebar pravidla)
- Sidebar úseku: název, popis, dopravci, typy služby, seznam milníků s jejich konfigurací
- Tlačítko **Upravit úsek** v patičce sidebaru

---

## 4. Vytvoření / editace trasy — 3-sloupcový layout

### Levý sloupec — Pokrytí
- Název trasy (input)
- Kód trasy (input, formát R-XX-XXX-XX)
- Dopravce (select)
- Varianta přepravy (select)
- Cílová země (select)
- Info: "= N kombinací pokryto"
- Tlačítko **Uložit trasu** (fixed v patičce)

### Střední sloupec — Úseky trasy
- Seřazený seznam úseků přiřazených trase (drag & drop pořadí)
- Každý úsek: číslo, název, počet milníků, tlačítko × odebrat
- Kliknutí na úsek → zobrazí jeho milníky v pravém sloupci
- Sekce **Přidat úsek**:
  - `+ vybrat z knihovny úseků` — picker z existujících
  - `+ vytvořit nový úsek →` — otevře editor úseku v pravém sloupci (nelze zároveň vytvářet další prázdné úseky)

### Pravý sloupec — Milníky vybraného úseku (read-only přehled)
- Hlavička: název úseku
- Seznam milníků s jejich konfigurací (match podmínky, očekávané trvání) — pouze pro přehled
- Info note: "Milníky se konfigurují v editoru úseku."
- Pokud je aktivní "vytvořit nový úsek": pravý sloupec se přepne na editor úseku

---

## 5. Vytvoření / editace úseku — 3-sloupcový layout

### Levý sloupec — Základní info
- Název úseku (input)
- Popis (textarea, volitelný)
- Dopravci (multi-select chipy)
- Typ služby (multi-select chipy)
- Tlačítko **Uložit úsek** (fixed v patičce)

### Střední sloupec — Milníky + knihovna
- Seřazený seznam milníků úseku
  - Každý milník: číslo, název, souhrn konfigurace (počet match podmínek, očekávané trvání), tlačítko × odebrat
  - Kliknutí na milník → zobrazí jeho konfiguraci v pravém sloupci
- Sekce **Přidat milník** (oddělena čarou):
  - Vyhledávání v knihovně milníků
  - Seznam existujících typů milníků s tlačítkem `+ přidat`
  - `+ Vytvořit nový typ milníku` → pravý sloupec se přepne na formulář: Název + Popis + Uložit; po uložení se milník automaticky přidá do seznamu a pravý sloupec přejde na jeho konfiguraci

### Pravý sloupec — Konfigurace vybraného milníku
- Hlavička: číslo + název milníku
- **Match podmínky:** řádky [pole ▼] [operátor ▼] [hodnota] + × odebrat + tlačítko `+ přidat podmínku`
- **Očekávané trvání:** [do/od-do ▼] [číslo] [hodin/dní/prac.dní ▼] od [kotva ▼]
- **Správnost (volitelné):** tlačítko `+ přidat pravidlo správnosti`
- Pokud aktivní "Vytvořit nový typ milníku": zobrazí formulář Název + Popis místo konfigurace

---

## Navigace a hlavička

- Hlavička aplikace: logo Bytorp + navigační položky **Konfigurátor pravidel** / **Trasy zásilek** + badge PROTOTYP + tlačítko Reset seed
- Stránka Trasy zásilek zobrazuje obě entity (trasy + úseky) bez sub-navigace
- Tlačítka "+ Nová trasa" a "+ Nový úsek" jsou dostupná přímo na stránce Trasy zásilek

---

## Co se nemění / co není v scope

- Datový model (types.ts, store.ts, seed.ts) — beze změny pokud nestačí pro nové UI
- Oblast "Záznamy z trackingu" — disabled, přidá se later
- Karta "Jiná situace" v wizardu Soulad s trasou — disabled
