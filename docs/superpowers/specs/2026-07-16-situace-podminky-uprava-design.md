# Design: Úprava seznamu Situací, zjednodušení Závažnosti a podmínek trackingu

**Datum:** 2026-07-16
**Status:** Design dokončen a schválen. Čeká na finální review uživatele před přechodem na implementační plán.

> Navazuje na `docs/superpowers/specs/2026-07-15-situace-zavaznost-akce-design.md` (implementováno).
> Tento dokument popisuje **úpravy** už implementované funkcionality — review po prvním použití prototypu.

---

## 1. Kontext

Po implementaci Situace/Závažnost/Akce a po sepsání architektury tří zdrojů VkŘ
(`2026-07-16-tri-zdroje-vkr-architektura-design.md`) přišla zpětná vazba na tři konkrétní místa:
seznam Situací, obsah Závažnosti a srozumitelnost podmínek v tracking pravidlech.

---

## 2. Seznam Situací (`/situace`) — sjednotit se seznamem Pravidel

**Dnes:** Plochý seznam Situací (název, popis, počet závažností, počet pravidel), žádné hledání ani filtrování.

**Nově:**

- **Vyhledávání** — search box ve stejném vizuálním stylu jako u seznamu Pravidel (`RulesList`), hledá
  v názvu Situace i Závažnosti. **Bez filtrů** — zvažovaný filtr podle Oblasti byl zamítnut, nedává smysl
  (viz zjednodušení oblastí v `2026-07-16-tri-zdroje-vkr-architektura-design.md`).
- **Rozbalovací strom** — každá Situace je rozbalovací řádek (výchozí stav needefinován, viz otevřená otázka
  níže). Po rozbalení se ukážou její Závažnosti, a pod každou Závažností **rozepsaná** navázaná Pravidla —
  ne jen název, ale stejné základní údaje jako v `RulesList`: kód, název, spouštěč (`Podmínka`/`Časovač`),
  priorita, stav (aktivní/neaktivní tečka). Klik na kartu pravidla vede rovnou do jeho editace
  (`/rules/$ruleId/edit`), stejně jako v `RulesList`.
- Situace bez rozbalení dál ukazuje souhrnné počty (N závažností, M pravidel) jako dnes.

---

## 3. Závažnost — odebrání vlastního názvu/popisu VkŘ

**Dnes:** `Severity.vkrTitle: string` a `Severity.vkrDescription?: string` — výchozí název a popis VkŘ,
které se při založení pravidla zkopírují do `Rule.name`/`Rule.description` (`applySeverityTemplate`).

**Nově:** `vkrTitle` a `vkrDescription` **se ze Závažnosti odebírají úplně** — ani v datovém modelu,
ani v editoru Závažnosti (`SituationEditorPage`/`SeverityCard`). Název a popis VkŘ se do budoucna
propisují **výhradně z Pravidla** (`Rule.name`/`Rule.description`, existující pole, dál volně editovatelná
uživatelem na pravidle).

**Důsledek pro wizard (`RuleCreatorPage`):** `applySeverityTemplate` při výběru Závažnosti **už
nepředvyplní** název ani popis pravidla (protože zdroj zanikl) — předvyplní dál jen prioritu a akce.
Uživatel název/popis vyplní sám. Tohle je přímý důsledek odebrání polí ze Závažnosti, ne samostatný
požadavek navíc.

---

## 4. Podmínky trackingu — sjednocení a zjednodušení wordingu

**Dnes:** Tři oddělené bloky ve sloupci 2 wizardu:
1. *Podmínky současného záznamu* (jen `Automaticky`) — dva typy řádku: **Shoda hodnoty** (pole/je-není/hodnota)
   a **Opakuje se** (pole/počet/nepřerušeně, bez hodnoty) — přepínané tlačítky nad řádkem.
2. *Podmínky na historii záznamů* (`Automaticky` i `Časovač`) — **Obsahuje**/**Neobsahuje**, s rozsahem
   (v posledním záznamu / v posledních N záznamech + nepřerušeně).
3. *Podmínky z ostatních entit* — pole zásilky/zákazníka (`VkrConditionsBuilder`, beze změny chování).

Zpětná vazba: příliš technické, moc sekcí, "opakuje se" jako zvláštní přepínač je matoucí, slovo "entita"
se nesmí používat.

**Nově — sloučení bloku 1 a 2 do jednoho:**

Jedna sekce **"Podmínky"**, uvnitř dvě podsekce:

- **"Co platí o záznamech v trackingu"** — nahrazuje dnešní bloky 1+2. Jeden typ řádku: pole → volba
  **je / není / opakuje se / bylo v historii** → podle volby se zobrazí zbytek řádku:
  - **je / není** → pole hodnota (chová se jako dnešní "Shoda hodnoty", vztahuje se jen k právě
    příchozímu záznamu).
  - **opakuje se** → počet záznamů za sebou + "musí být nepřerušeně" (bez pole hodnota — chová se jako
    dnešní "Opakuje se").
  - **bylo v historii** → vlastní vnořená volba **je / není** + pole hodnota + rozsah (v posledním
    záznamu / v posledních N záznamech) + "musí být nepřerušeně" — přímo odpovídá dnešnímu
    "Obsahuje"/"Neobsahuje" (včetně sémantiky: neznamená, že hodnota pole obsahuje nějaký text, ale že
    historie obsahuje/neobsahuje záznam/záznamy, které odpovídají zadané shodě). Negace se tedy neztrácí —
    jen se přesouvá o úroveň níž, jako vnořená volba uvnitř "bylo v historii", místo aby byla
    rovnocenná s "je/není/opakuje se" na hlavní úrovni řádku.
  - Časové omezení (kdy je která volba dostupná): "opakuje se" dává smysl jen při `Automaticky`
    (potřebuje "právě přišlý" záznam jako součást počtu) — při `Časovač` se nenabízí, stejně jako dnes
    blok 1 mizí celý při `Časovač`.
- **"Co dále platí"** — přejmenováno z "Podmínky z ostatních entit". Beze změny chování, jen nový nadpis
  (slovo "entita" se nikde nepoužívá).

Sémantika bloku "bylo v historii" (že jde o "historie obsahuje záznam, který…", ne o textové "obsahuje")
byla explicitně potvrzena jako už teď správně navržená — mění se jen struktura řádku a wording, ne
podkladová logika.

---

## 5. Mimo rozsah

- Datový model `Condition` (`kind: "field" | "tracking_aggregate"`) — tenhle dokument mění jen **UI vrstvu**
  (jak se řádek staví a jak se jmenuje). Přesné mapování nového sjednoceného řádku na existující/upravený
  `Condition` union je otevřená otázka pro implementační plán, ne pro tento design.
- Cokoliv z `2026-07-16-tri-zdroje-vkr-architektura-design.md` (navigace, přejmenování top nav, "Kontrola
  na bodu") — samostatný, už schválený dokument.

---

## 6. Otevřené otázky pro implementační plán

- **Výchozí stav rozbalení** Situace v seznamu (sekce 2) — všechny rozbalené, všechny sbalené, nebo jen ta
  s aktivním hledáním? Neřešeno zde, rozhodnout při psaní plánu nebo nechat na implementaci ať zvolí
  rozumný default.
- **Mapování na `Condition` typ** (sekce 5) — jak se `kind: "tracking_aggregate"` s `valueMode`/`occurrence`
  promítne do nového jednotného řádku, případně jestli je potřeba typ rozšířit.

---

## 7. Co zbývá

Design je hotový — seznam Situací, odebrání polí ze Závažnosti a sjednocení podmínek trackingu jsou
probrané a schválené (včetně vizuálních náhledů). Zbývá:

- **Spec self-review a finální schválení** od uživatele.
- Přechod na implementační plán (`writing-plans`) — pravděpodobně společně s architekturou z
  `2026-07-16-tri-zdroje-vkr-architektura-design.md` v sekcích, které se týkají navigace/pojmenování
  (zbytek té architektury — "Kontrola na bodu" — je samostatný, mnohem větší kus práce).
