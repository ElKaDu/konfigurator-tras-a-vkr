# Design: Artefakt „Kontrola na bodu trasy" — konfigurace, review s klientem, simulátor

**Datum:** 2026-07-16
**Status:** Design dokončen a schválen (visual companion) — čeká na finální review uživatele před přechodem na implementační plán.

> Navazuje na `mockups/2026-07-15-kontrola-na-bodu-architektura.html` (sub-projekt 2 z `2026-07-15-body-trasy-terminologie-design.md`) a řeší jeho otevřenou otázku (Situace jako šablona vs. jako klasifikace → **zvoleno: klasifikace**). Používá terminologii z `2026-07-15-body-trasy-terminologie-design.md` (Bod, ne milník). Datový tvar Situace/Závažnost/Akce přebírá z `2026-07-15-situace-zavaznost-akce-design.md`, ale mění mechanismus napojení (Situace nikdy negeneruje kontrolu automaticky, viz §3).
>
> **Tohle NENÍ nová stránka v prototypu `konfigurator-tras-a-vkr`.** Tento repo je jen prototyp k ověřování UI nápadů. Tento dokument popisuje **samostatný artefakt** — jednorázový/dlouhodobě používaný nástroj mimo build tohoto repa, jehož výstupem je zadání pro vývojáře reálné klientské aplikace.

---

## 1. Kontext a cíl

Klient dodává pravidla pro soulad zásilky s předepsanou trasou ve formě konkrétních příkladů (viz reálný export `bytorp-data-2026-06-20.json`, pravidla R30/R97/R39/R14/R51/R80/R85). Než se tahle logika **natvrdo naprogramuje** do reálné aplikace (hardcoded — spouštění kontrol samo, jen jejich obsah je konfigurovatelný v tomto artefaktu), je potřeba:

1. **Ověřit, že příklady od klienta jsou zadané dost přesně a obecně** — aby fungovaly i na trasách, které klient teprve vytvoří, ne jen na téhle jedné ukázce.
2. **Dát klientovi srozumitelný, editovatelný přehled** ke kontrole — ne jen k odsouhlasení kliknutím, ale k reálné opravě hodnot (např. přepsat, jaký `status` se má na bodu očekávat).
3. **Dát vývojářům jednoznačné zadání** — stejná obrazovka, žádný druhý překlad "z schůzky do ticketu".
4. **Otestovat okrajové případy** dřív, než se najdou v produkci — hlavně "bod nastal dřív/později, než měl" a jak se to promítne do eskalace kontrol.

---

## 2. Co to je a kde žije

- **Jedna samostatná HTML/JS stránka** (Artifact) — žádný backend, žádná závislost na buildu tohoto repa.
- **Publikováno jako Claude Artifact** (stabilní odkaz ke sdílení s klientem i vývojáři) **a zároveň uloženo jako soubor v tomto repu** (verzování, dohledatelnost, slouží jako psané zadání).
- **Perzistence:** localStorage prohlížeče — data (Body, Kontroly, testovací vstupy) zůstávají při dalším otevření. Tlačítko **Export JSON** / **Import JSON** pro zálohu a předání (JSON soubor = to, co dostanou vývojáři).
- Bez multiuser realtime — pokud budou na hodnotách pracovat společně s klientem, buď sdílenou obrazovkou (ona edituje), nebo přes export/import JSON.

---

## 3. Datový model

```
Úsek → Bod                                       — match + termín, stejný tvar jako dnešní Checkpoint, ale editovatelné přímo v tomto nástroji (viz §4)
  └─ Kontrola[]                                  — NOVÉ
       ├─ časování: pevný denní čas, nebo v/před/po termínu bodu (offset v h)
       ├─ volitelná podmínka na kontrole          — pole zásilky (např. "datum doručení od přepravce = dnes")
       └─ 2 volitelné větve: Splněno / Nesplněno  — obě nepovinné, kontrola může mít jen jednu
             ├─ volitelná podmínka na větvi        — když je větví u jedné kontroly víc (R97: 2× Nesplněno)
             ├─ Situace (select) → Závažnost (pills) — ČISTĚ KLASIFIKACE, nikdy negeneruje kontrolu sama
             ├─ Název / popis / priorita VkŘ       — předvyplní se ze Závažnosti, pak vlastní needitovatelná kopie
             └─ Akce[]                             — zděděné ze Závažnosti, checkbox on/off, text editovatelný
```

**Klíčové rozhodnutí (visual companion, varianta B):** Situace u větve nikdy sama nezaloží kontrolu — vždy se kontrola staví ručně (časování + podmínky), Situace jen klasifikuje výsledek. Stejný mechanismus pro každou situaci bez výjimky, jednodušší na vysvětlení i otestování.

**Editovatelnost = potvrzení.** Žádný zvláštní příznak "potvrzeno klientem". Hodnoty, které předvyplníte, klient přímo přepisuje (např. jaký `status` se má na bodu objevit) — to JE potvrzovací mechanismus. Proto všechny selecty (pole, operátory, hodnoty statusů, typy lokací…) musí nabízet **stejnou množinu možností, jakou má reálná aplikace** — žádný volný text tam, kde reálná appka má select.

### 3.1 Rozsah v1 — jen kontroly navázané na konkrétní bod

Podporováno: kontroly jako v R30/R97/R39/R14/R51 — vždy vázané na jeden konkrétní Bod.

**Mimo rozsah (vědomá mezera, ne přehlédnutí):**
- **Obecné kontroly napříč celou trasou**, nevázané na jeden bod (typ R85 — "zásilka na místě, které není na žádném bodu trasy").
- **Sdílené šablony kontrol napříč více body** (návrh z poznámky u R80 — "lze nastavit pro každý milník"). Kopírování kontroly mezi body se dělá ručně (copy), žádná sdílená šablona v datech.

---

## 4. UI: Konfigurační pohled

- **Vlevo** — strom Úsek → Bod (ze seed dat, viz §6). **Trasa jako entita se v tomhle nástroji nezaznamenává** — klient neřeší "která trasa", jen konkrétní úseky a body na nich; artefakt drží jednu množinu úseků, ne katalog tras. **+ Přidat úsek** (jen název) a **+ Přidat bod** (v rámci úseku) jsou vlastní formuláře přímo ve stromu.
- **Vpravo, pro vybraný Bod:**
  1. **Editovatelný souhrn** "Co musí být na záznamu" (match — pole jako status/typ lokace/město/kód země, každé jako seznam přípustných hodnot) + "Termín" (kotva na systémovou událost nebo na jiný bod + pevný čas/den nebo posun v hodinách). Toto **je** editovatelné — přímo tady klient přepisuje, jaký `status` se má na bodu očekávat (viz §3, "Editovatelnost = potvrzení").
  2. **Tabulka Kontrol** (zvolený styl — hustý přehled): řádek = jedna Kontrola, sloupce Časování / Podmínka / výsledek Splněno→ / výsledek Nesplněno→. Klik na řádek rozbalí detail větve (Situace/Závažnost/Akce, přesné podmínky, editace).
  3. **+ Přidat kontrolu** nad tabulkou.

---

## 5. UI: Simulátor (záložka "Test")

Samostatná záložka vedle konfigurace. Cíl: ověřit, jak se sada Kontrol napříč celou trasou zachová pro konkrétní (i vymyšlený) průběh zásilky — hlavně případy "bod nastal dřív/později, než měl".

**Vstup:**
- Pár polí zásilky: cílová země, dopravce, service type, avizované datum doručení od přepravce (a další pole, která se objeví jako podmínky na kontrolách/větvích).
- **Seznam tracking záznamů, které "jakoby přišly"** — každý se stejnými poli jako `CheckpointMatch` (status, čas, lokace…). Přidáváte je ručně, kolik chcete.
- **Aktuální čas** (jedno pole — simulované "teď").

**Vyhodnocení (spustí se tlačítkem, ne live):**
1. Každý zadaný tracking záznam se spáruje s Bodem podle jeho `match` podmínek (bodů bez spárovaného záznamu se prostě "zatím nic nedotklo").
2. Pro **všechny Kontroly na všech bodech celé trasy** se spočítá reálný spouštěcí čas (termín bodu + offset kontroly) — projde se celá trasa, ne jen body se záznamem, protože i chybějící záznam je platný výsledek (Nesplněno).
3. Kontroly, jejichž spouštěcí čas je **≤ zadané "teď"**, se vyhodnotí: pokud bod má spárovaný záznam a jeho čas odpovídá termínu → Splněno, jinak Nesplněno; dál se vyhodnotí podmínka větve (proti zásilkovým polím) a zobrazí výsledná Situace/Závažnost/Akce.
4. Kontroly, jejichž spouštěcí čas je v budoucnu vůči "teď", se označí "ještě neproběhla".

**Výstup:** přehled pro celou trasu najednou — které kontroly proběhly, jak dopadly, co ještě čeká.

---

## 6. Seed data

Ze skutečného exportu `bytorp-data-2026-06-20.json` (trasa ČR–USA / Endevel-test — samotná trasa se nezaznamenává, viz §4, ale úseky a body z ní ano):
- Oba úseky (ČR–Paříž, Paříž–USA), všech 10 typů bodů (přejmenováno na terminologii "Bod").
- Existující `route_compliance` pravidla převedená na Kontroly:
  - **R30, R97, R39** → 3 kontroly na bodu „1. Fyzický scan v cílové zemi". R39 dnes obchází chybějící "kontrolu na bodu" tím, že vytváří **duplicitní typ bodu** jen kvůli jinému časování ("1. fyzický scan — pozdější check") — v novém modelu se sloučí na **stejný bod**, jen jako 3. Kontrola s podmínkou "datum doručení od přepravce = dnes". Tohle je referenční příklad přesně toho, co má nový model odstranit.
  - **R14** → 2 kontroly na bodu „2. Fyzický scan v cílové zemi".
  - **R51** → 1 kontrola (jen větev Nesplněno) na bodu „Export - celní odbavení dokončeno".
- **R80, R85** se nepřevádí (mimo rozsah v1, viz §3.1) — zůstanou poznamenané jako příklady budoucího rozšíření.

---

## 7. Mimo rozsah

- **Entita Trasa** (pokrytí carrier × serviceType × cílová země, přiřazení úseků k trase) — nezaznamenává se, viz §4. Pokud bude klient potřebovat rozlišit víc tras, řeší se to přes samostatné Export/Import JSON soubory (jeden soubor = jedna rozpracovaná sada úseků), ne uvnitř jednoho běhu nástroje.
- Obecné kontroly nevázané na bod (R85) a sdílené šablony kontrol napříč body (R80) — viz §3.1.
- Perzistentní "potvrzeno klientem" příznak — nahrazeno přímou editovatelností (§3).
- Realtime spolupráce víc lidí najednou — řeší se přes export/import JSON nebo sdílenou obrazovku.
- Skutečné napojení na runtime/produkci — artefakt je nástroj na ujasnění a předání zadání, ne součást reálné aplikace.

---

## 8. Co zbývá

Design je hotový — rozsah, datový model, oba UI pohledy (konfigurace + simulátor) a zdroj seed dat jsou probrané a schválené (včetně visual-companion session: varianta B, tabulkový styl).

- **Review tohoto dokumentu od uživatele.**
- Přechod na implementační plán (`writing-plans`).
