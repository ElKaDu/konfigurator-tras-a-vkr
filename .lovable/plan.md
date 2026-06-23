## Cíl

V katalogu „Podmínky zásilky" → kategorie **Historie trackingu** zrcadlit chování builderu **„CO MUSÍ BÝT NA ZÁZNAMU"** (`TrackingConditionBuilder`). Stejná pole, stejné operátory, stejný editor hodnoty.

**Sémantika (důležitá změna oproti minulé verzi):** každá podmínka se vyhodnocuje **nezávisle** nad libovolným záznamem v historii. Tj. když přidám `Status = DELIVERED` a `Země = CZ`, znamená to „existuje záznam s tímto statusem" AND „existuje záznam s touto zemí" — **NEMUSÍ to být tentýž záznam.** Proto v UI **nepíšeme** „Historie obsahuje záznam, kde…" — zobrazujeme rovnou pole.

## Low-fi prototyp (UI náčrt)

### A. Popover „Přidat podmínku" — pole rovnou, bez wrapperu

```text
┌─ Přidat podmínku ─────────────────────────────┐
│ 🔍 Hledat…                                    │
│                                               │
│ ZÁSILKA                                       │
│   • Datum doručení dopravce                   │
│ ZÁKAZNÍK                                      │
│   • Stálost zákazníka                         │
│ HISTORIE TRACKINGU                            │
│   • Status                                    │
│   • Kód statusu                               │
│   • Typ záznamu                               │
│   • Popis události                            │
│   • Kód výjimky                               │
│   • Popis výjimky                             │
│   • Typ místa                                 │
│   • ID místa                                  │
│   • Město                                     │
│   • Země                                      │
│   • PSČ                                       │
│   • Počet pokusů o doručení                   │
│   • Čas záznamu                               │
└───────────────────────────────────────────────┘
```

### B. Řádek podmínky v `VkrConditionsBuilder`

```text
┌─ Podmínky zásilky ────────────────────────────────────────────────┐
│  Status:        [ je jedním z ]  [ DELIVERED, IN_TRANSIT ]   [x] │
│                       ─ ─ ─  A  ─ ─ ─                            │
│  Země:          [ je ]           [ CZ ]                      [x] │
│                       ─ ─ ─  A  ─ ─ ─                            │
│  Kód výjimky:   [ není žádným z ][ OQ ]                      [x] │
│                       ─ ─ ─  A  ─ ─ ─                            │
│  Čas záznamu:   [ TrackingTimeValueEditor ]                  [x] │
│  [+ Přidat podmínku]                                              │
└───────────────────────────────────────────────────────────────────┘
```

- Layout řádku = stejný jako stávající ConditionRow ve `VkrConditionsBuilder` (label vlevo, select operátoru, hodnota).
- Operátory: `je jedním z`, `není žádným z`, `je`, `není`, `obsahuje` (text/enum); `je`, `je větší než`, `je menší nebo rovno` (deliveryAttempts). Stejné názvy jako v `TRACKING_OPERATORS`.
- Pole `Čas záznamu` použije **stejný `TrackingTimeValueEditor`** jako v CO MUSÍ BÝT NA ZÁZNAMU.

### C. Mix s ostatními kategoriemi

```text
┌─ Podmínky zásilky ──────────────────────────────┐
│  Stálost zákazníka:    [ je ] [ nový ]      [x] │
│              ─ ─ ─  A  ─ ─ ─                    │
│  Status:               [ je jedním z ][ … ] [x] │
│              ─ ─ ─  A  ─ ─ ─                    │
│  Kód výjimky:          [ není žádným z ][OQ][x] │
│  [+ Přidat podmínku]                             │
└─────────────────────────────────────────────────┘
```

## Technický rozpis

### 1) `src/lib/vkr/vkrConditionCatalog.ts`
- Kategorie `Historie trackingu` zůstává jako dnes **13 samostatných polí** (status, kód statusu, typ záznamu, popis události, kód výjimky, popis výjimky, typ místa, ID místa, město, země, PSČ, počet pokusů, čas záznamu).
- Sjednotit operátory na `TRACKING_OPERATORS` z `RuleCreatorPage.tsx` (přidá se `je`, `není`, `obsahuje` pro text/enum; `eq/gt/lte` pro number; `eventTime` dostane marker pro time editor).
- Přidat volitelné pole `customValueEditor?: "tracking_time"` na `VkrConditionFieldDef` pro `tracking_history.eventTime`.

### 2) `src/components/rules/RuleCreatorPage.tsx`
- Vyextrahovat `TRACKING_OPERATORS` a typ `TrackingTimeSpec` (už existuje) do sdíleného modulu, ať je import bez kruhové závislosti.

### 3) `src/components/rules/editors/VkrConditionsBuilder.tsx`
- V `ConditionRow`: pokud `field.customValueEditor === "tracking_time"`, místo input vykreslit `<TrackingTimeValueEditor>` a ukládat `JSON.stringify(timeSpec)` do `condition.value`.
- Jinak žádná změna — generická logika `valueOptions` / `needsValue` pokryje text a number operátory.

## Co se nemění

- Builder „CO MUSÍ BÝT NA ZÁZNAMU" beze změny.
- Ostatní kategorie podmínek beze změny.
- Žádná migrace localStorage (kategorie čerstvě přidaná, neseedovaná).

## Mimo rozsah

- Skutečná evaluační logika nad historií (zůstává mockup).
- Autocomplete hodnot z `observedCatalog` (zůstává prostý text input).
