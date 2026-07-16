# Artefakt „Kontrola na bodu trasy" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Postavit samostatný self-contained HTML/JS artefakt (mimo build tohoto prototypu), ve kterém lze definovat Kontroly na Bodech trasy (časování + větve Splněno/Nesplněno → Situace/Závažnost/Akce), tenhle model spolu s klientem editovat a otestovat simulátorem zásilky.

**Architecture:** Čistá logika (párování tracking záznamu s Bodem, výpočet termínu Bodu, vyhodnocení Kontroly) žije v ES modulu testovatelném přes vestavěný `node --test`, bez DOM závislosti. UI je vanilla JS (žádný framework — artefakt musí být self-contained bez CDN závislostí) s jednoduchým "state → render()" cyklem a localStorage perzistencí. Poslední krok vše sloučí do jednoho HTML souboru pro publikaci jako Claude Artifact.

**Tech Stack:** Vanilla JavaScript (ES modules pro vývoj/testy), HTML, CSS. `node --test` + `node:assert/strict` (vestavěné v Node 24, žádná instalace). Žádná závislost na Vite/React/TanStack z hlavního repa — artefakt je úmyslně oddělený.

---

## Důležitý kontext pro inženýra

- Design je v `docs/superpowers/specs/2026-07-16-artefakt-kontrola-trasy-design.md` — přečti si ho celý před začátkem, tenhle plán ho jen rozpracovává do kroků.
- Zdroj seed dat je `bytorp-data-2026-06-20.json` v uživatelově Downloads (obsah je citovaný a rozpracovaný přímo v Tasku 5 tohoto plánu, soubor samotný není potřeba znovu otvírat).
- **Zjednodušení oproti reálné aplikaci (vědomé, kvůli rozsahu tohoto artefaktu):** všechny časy se počítají v jedné časové zóně (prohlížeč uživatele, žádný přepočet mezi zeměmi). Reálná appka řeší timezone per cílová země — tady to není potřeba, protože jde o nástroj na ujasnění pravidel, ne o runtime.
- Všechny soubory žijí v novém adresáři `nastroje/` v kořeni repa — nic z tohoto plánu se nedotýká `src/` (existující prototyp `konfigurator-tras-a-vkr` zůstává beze změny).
- Finální artefakt (Task 13) je JEDEN self-contained HTML soubor — Tasky 1-11 vyvíjí kód jako ES moduly (kvůli testovatelnosti a přehlednosti), Task 13 je mechanicky sloučí.

---

## Task 1: Scaffold + čisté pomocné funkce pro práci s časem

**Files:**
- Create: `nastroje/kontrola-na-bodu-trasy.logic.mjs`
- Test: `nastroje/kontrola-na-bodu-trasy.logic.test.mjs`

- [ ] **Step 1: Vytvořit adresář a napsat první selhávající test**

Vytvoř soubor `nastroje/kontrola-na-bodu-trasy.logic.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { addHours, addDays, combineDateAndClock } from './kontrola-na-bodu-trasy.logic.mjs';

test('addHours posune čas o zadaný počet hodin', () => {
  const start = new Date('2026-07-20T08:00:00');
  const result = addHours(start, 2);
  assert.equal(result.toISOString(), new Date('2026-07-20T10:00:00').toISOString());
});

test('addHours funguje i se záporným počtem hodin', () => {
  const start = new Date('2026-07-20T08:00:00');
  const result = addHours(start, -3);
  assert.equal(result.toISOString(), new Date('2026-07-20T05:00:00').toISOString());
});

test('addDays posune datum o zadaný počet dní, čas zachová', () => {
  const start = new Date('2026-07-20T08:00:00');
  const result = addDays(start, 1);
  assert.equal(result.toISOString(), new Date('2026-07-21T08:00:00').toISOString());
});

test('combineDateAndClock nastaví na dané datum konkrétní čas', () => {
  const start = new Date('2026-07-20T23:59:00');
  const result = combineDateAndClock(start, '08:00');
  assert.equal(result.toISOString(), new Date('2026-07-20T08:00:00').toISOString());
});
```

- [ ] **Step 2: Spustit test a ověřit, že selže**

Run: `node --test nastroje/kontrola-na-bodu-trasy.logic.test.mjs`
Expected: FAIL — `Cannot find module './kontrola-na-bodu-trasy.logic.mjs'` (soubor ještě neexistuje).

- [ ] **Step 3: Napsat minimální implementaci**

Vytvoř soubor `nastroje/kontrola-na-bodu-trasy.logic.mjs`:

```js
// Čisté funkce pro práci s časem. Vše počítáno v jedné časové zóně (viz plán, Kontext).

export function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

export function addDays(date, days) {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

export function combineDateAndClock(date, clockTime) {
  const [h, m] = clockTime.split(':').map(Number);
  const d = new Date(date.getTime());
  d.setHours(h, m, 0, 0);
  return d;
}
```

- [ ] **Step 4: Spustit test a ověřit, že projde**

Run: `node --test nastroje/kontrola-na-bodu-trasy.logic.test.mjs`
Expected: PASS — 4 testy, 0 selhání.

- [ ] **Step 5: Commit**

```bash
git add nastroje/kontrola-na-bodu-trasy.logic.mjs nastroje/kontrola-na-bodu-trasy.logic.test.mjs
git commit -m "feat: pomocné funkce pro práci s časem v artefaktu Kontrola na bodu"
```

---

## Task 2: Párování tracking záznamu s Bodem

**Files:**
- Modify: `nastroje/kontrola-na-bodu-trasy.logic.mjs`
- Modify: `nastroje/kontrola-na-bodu-trasy.logic.test.mjs`

- [ ] **Step 1: Přidat selhávající testy**

Přidej na konec `nastroje/kontrola-na-bodu-trasy.logic.test.mjs`:

```js
import { recordMatchesBod, matchRecordsToBody } from './kontrola-na-bodu-trasy.logic.mjs';

test('recordMatchesBod vrátí true, když záznam odpovídá všem vyplněným polím', () => {
  const bod = { id: 'b1', match: { status: ['Destination facility'], locationCity: ['Praha', 'Brno'] } };
  const record = { status: 'Destination facility', locationCity: 'Praha', time: new Date() };
  assert.equal(recordMatchesBod(record, bod), true);
});

test('recordMatchesBod vrátí false, když jedno vyplněné pole nesedí', () => {
  const bod = { id: 'b1', match: { status: ['Destination facility'] } };
  const record = { status: 'In transit', time: new Date() };
  assert.equal(recordMatchesBod(record, bod), false);
});

test('recordMatchesBod ignoruje pole, která bod nemá vyplněná', () => {
  const bod = { id: 'b1', match: { status: ['Destination facility'] } };
  const record = { status: 'Destination facility', locationCity: 'cokoliv', time: new Date() };
  assert.equal(recordMatchesBod(record, bod), true);
});

test('matchRecordsToBody vybere pro každý bod nejdřívější odpovídající záznam', () => {
  const bodA = { id: 'bodA', match: { status: ['Scan'] } };
  const bodB = { id: 'bodB', match: { status: ['Delivered'] } };
  const records = [
    { status: 'Scan', time: new Date('2026-07-20T09:00:00') },
    { status: 'Scan', time: new Date('2026-07-20T08:00:00') },
    { status: 'Delivered', time: new Date('2026-07-21T10:00:00') },
  ];
  const matched = matchRecordsToBody(records, [bodA, bodB]);
  assert.equal(matched.bodA.time.toISOString(), new Date('2026-07-20T08:00:00').toISOString());
  assert.equal(matched.bodB.time.toISOString(), new Date('2026-07-21T10:00:00').toISOString());
});

test('matchRecordsToBody neuvede bod, pro který žádný záznam nesedí', () => {
  const bodC = { id: 'bodC', match: { status: ['Nikdy nepřijde'] } };
  const matched = matchRecordsToBody([{ status: 'Scan', time: new Date() }], [bodC]);
  assert.equal('bodC' in matched, false);
});
```

- [ ] **Step 2: Spustit testy a ověřit, že nové selžou**

Run: `node --test nastroje/kontrola-na-bodu-trasy.logic.test.mjs`
Expected: FAIL na nových 5 testech — `recordMatchesBod is not a function` (Task 1 testy dál procházejí).

- [ ] **Step 3: Implementovat**

Přidej do `nastroje/kontrola-na-bodu-trasy.logic.mjs`:

```js
const MATCH_FIELDS = ['status', 'locationType', 'locationCity', 'locationCountryCode'];

export function recordMatchesBod(record, bod) {
  for (const field of MATCH_FIELDS) {
    const allowed = bod.match[field];
    if (allowed && allowed.length > 0) {
      if (!record[field] || !allowed.includes(record[field])) return false;
    }
  }
  return true;
}

export function matchRecordsToBody(records, bodyList) {
  const matchedRecords = {};
  for (const bod of bodyList) {
    const matching = records.filter((r) => recordMatchesBod(r, bod));
    if (matching.length === 0) continue;
    matching.sort((a, b) => a.time.getTime() - b.time.getTime());
    matchedRecords[bod.id] = matching[0];
  }
  return matchedRecords;
}
```

- [ ] **Step 4: Spustit testy a ověřit, že všechny projdou**

Run: `node --test nastroje/kontrola-na-bodu-trasy.logic.test.mjs`
Expected: PASS — 9 testů celkem, 0 selhání.

- [ ] **Step 5: Commit**

```bash
git add nastroje/kontrola-na-bodu-trasy.logic.mjs nastroje/kontrola-na-bodu-trasy.logic.test.mjs
git commit -m "feat: párování tracking záznamu s Bodem podle match podmínek"
```

---

## Task 3: Výpočet termínu Bodu (kotva + offset, včetně kaskády mezi body)

**Files:**
- Modify: `nastroje/kontrola-na-bodu-trasy.logic.mjs`
- Modify: `nastroje/kontrola-na-bodu-trasy.logic.test.mjs`

- [ ] **Step 1: Přidat selhávající testy**

Přidej na konec test souboru:

```js
import { resolveAnchorTime, computeBodTermin } from './kontrola-na-bodu-trasy.logic.mjs';

function ctxFixture(overrides = {}) {
  return {
    shipment: { add: new Date('2026-07-20T00:00:00') },
    matchedRecords: {},
    bodyById: new Map(),
    terminCache: new Map(),
    ...overrides,
  };
}

test('resolveAnchorTime pro systémovou událost čte hodnotu ze zásilky', () => {
  const ctx = ctxFixture();
  const result = resolveAnchorTime({ kind: 'system_event', key: 'add' }, ctx);
  assert.equal(result.toISOString(), new Date('2026-07-20T00:00:00').toISOString());
});

test('resolveAnchorTime pro systémovou událost vyhodí chybu, když hodnota chybí', () => {
  const ctx = ctxFixture({ shipment: {} });
  assert.throws(() => resolveAnchorTime({ kind: 'system_event', key: 'add' }, ctx));
});

test('computeBodTermin s kotvou na systémovou událost a pevným časem', () => {
  const bod = { id: 'bod1', deadline: { anchor: { kind: 'system_event', key: 'add' }, clockTime: '08:00', dayOffset: 0 } };
  const ctx = ctxFixture({ bodyById: new Map([['bod1', bod]]) });
  const result = computeBodTermin('bod1', ctx);
  assert.equal(result.toISOString(), new Date('2026-07-20T08:00:00').toISOString());
});

test('computeBodTermin s kotvou na jiný bod používá PLÁNOVANÝ termín, když bod ještě nenastal', () => {
  const bod1 = { id: 'bod1', deadline: { anchor: { kind: 'system_event', key: 'add' }, clockTime: '08:00', dayOffset: 0 } };
  const bod2 = { id: 'bod2', deadline: { anchor: { kind: 'bod', bodId: 'bod1' }, offsetHours: 2 } };
  const ctx = ctxFixture({ bodyById: new Map([['bod1', bod1], ['bod2', bod2]]) });
  const result = computeBodTermin('bod2', ctx);
  assert.equal(result.toISOString(), new Date('2026-07-20T10:00:00').toISOString());
});

test('computeBodTermin s kotvou na jiný bod se PŘESUNE podle SKUTEČNÉHO příchodu, když už bod nastal (kaskáda zpoždění)', () => {
  const bod1 = { id: 'bod1', deadline: { anchor: { kind: 'system_event', key: 'add' }, clockTime: '08:00', dayOffset: 0 } };
  const bod2 = { id: 'bod2', deadline: { anchor: { kind: 'bod', bodId: 'bod1' }, offsetHours: 2 } };
  const ctx = ctxFixture({
    bodyById: new Map([['bod1', bod1], ['bod2', bod2]]),
    matchedRecords: { bod1: { time: new Date('2026-07-20T11:00:00') } }, // bod1 nastal o 3 h později, než měl
  });
  const result = computeBodTermin('bod2', ctx);
  assert.equal(result.toISOString(), new Date('2026-07-20T13:00:00').toISOString());
});

test('computeBodTermin vyhodí chybu pro neznámý bod', () => {
  const ctx = ctxFixture();
  assert.throws(() => computeBodTermin('neexistuje', ctx));
});
```

- [ ] **Step 2: Spustit testy a ověřit, že nové selžou**

Run: `node --test nastroje/kontrola-na-bodu-trasy.logic.test.mjs`
Expected: FAIL na nových 6 testech — `resolveAnchorTime is not a function`.

- [ ] **Step 3: Implementovat**

Přidej do `nastroje/kontrola-na-bodu-trasy.logic.mjs`:

```js
export function resolveAnchorTime(anchor, ctx) {
  if (anchor.kind === 'system_event') {
    const value = ctx.shipment[anchor.key];
    if (!value) throw new Error(`Chybí hodnota zásilky pro systémovou událost "${anchor.key}"`);
    return value;
  }
  const matched = ctx.matchedRecords[anchor.bodId];
  if (matched) return matched.time;
  return computeBodTermin(anchor.bodId, ctx);
}

export function computeBodTermin(bodId, ctx) {
  if (ctx.terminCache.has(bodId)) return ctx.terminCache.get(bodId);
  const bod = ctx.bodyById.get(bodId);
  if (!bod) throw new Error(`Neznámý bod "${bodId}"`);
  const anchorTime = resolveAnchorTime(bod.deadline.anchor, ctx);
  const result = bod.deadline.clockTime
    ? combineDateAndClock(addDays(anchorTime, bod.deadline.dayOffset ?? 0), bod.deadline.clockTime)
    : addHours(anchorTime, bod.deadline.offsetHours ?? 0);
  ctx.terminCache.set(bodId, result);
  return result;
}
```

**Poznámka pro inženýra:** `computeBodTermin` je záměrně rekurzivní přes `resolveAnchorTime` — pokud bod kotví na jiný bod, který kotví na další atd., řetězec se rozmotá celý. Klíčové chování (ověřené testem výše): pokud kotvící bod už reálně nastal (`ctx.matchedRecords`), termín navazujícího bodu se počítá od SKUTEČNÉHO příchodu, ne od plánu — to je přesně mechanismus, kterým se v simulátoru testuje "co se stane, když bod nastane dřív/později".

- [ ] **Step 4: Spustit testy a ověřit, že všechny projdou**

Run: `node --test nastroje/kontrola-na-bodu-trasy.logic.test.mjs`
Expected: PASS — 15 testů celkem, 0 selhání.

- [ ] **Step 5: Commit**

```bash
git add nastroje/kontrola-na-bodu-trasy.logic.mjs nastroje/kontrola-na-bodu-trasy.logic.test.mjs
git commit -m "feat: výpočet termínu Bodu včetně kaskády přes kotvící bod"
```

---

## Task 4: Vyhodnocení Kontroly (časování, podmínky, větve) a běh simulace

**Files:**
- Modify: `nastroje/kontrola-na-bodu-trasy.logic.mjs`
- Modify: `nastroje/kontrola-na-bodu-trasy.logic.test.mjs`

- [ ] **Step 1: Přidat selhávající testy**

Přidej na konec test souboru:

```js
import { evaluateCondition, computeKontrolaTriggerTime, evaluateKontrola, runSimulation } from './kontrola-na-bodu-trasy.logic.mjs';

test('evaluateCondition s null podmínkou vždy vrací true', () => {
  assert.equal(evaluateCondition(null, {}, new Date()), true);
});

test('evaluateCondition is_today porovná datum bez ohledu na čas', () => {
  const shipment = { datumDoruceni: new Date('2026-07-20T23:00:00') };
  const now = new Date('2026-07-20T05:00:00');
  assert.equal(evaluateCondition({ field: 'datumDoruceni', operator: 'is_today' }, shipment, now), true);
});

test('evaluateCondition is_not_today vrátí true, když se dny liší', () => {
  const shipment = { datumDoruceni: new Date('2026-07-21T00:00:00') };
  const now = new Date('2026-07-20T05:00:00');
  assert.equal(evaluateCondition({ field: 'datumDoruceni', operator: 'is_not_today' }, shipment, now), true);
});

test('computeKontrolaTriggerTime pro pevný denní čas ignoruje offset a vezme čas z termínu bodu', () => {
  const bodTermin = new Date('2026-07-20T08:00:00');
  const result = computeKontrolaTriggerTime({ mode: 'fixed_clock', time: '08:00' }, bodTermin);
  assert.equal(result.toISOString(), bodTermin.toISOString());
});

test('computeKontrolaTriggerTime "po termínu" přičte hodiny', () => {
  const bodTermin = new Date('2026-07-20T08:00:00');
  const result = computeKontrolaTriggerTime({ mode: 'relative', position: 'after', hours: 1 }, bodTermin);
  assert.equal(result.toISOString(), new Date('2026-07-20T09:00:00').toISOString());
});

test('computeKontrolaTriggerTime "před termínem" odečte hodiny', () => {
  const bodTermin = new Date('2026-07-20T08:00:00');
  const result = computeKontrolaTriggerTime({ mode: 'relative', position: 'before', hours: 1 }, bodTermin);
  assert.equal(result.toISOString(), new Date('2026-07-20T07:00:00').toISOString());
});

function kontrolaFixture() {
  return {
    id: 'k1',
    timing: { mode: 'fixed_clock', time: '08:00' },
    condition: null,
    onFulfilled: [{ id: 'v_ok', condition: null, name: 'OK' }],
    onUnfulfilled: [{ id: 'v_fail', condition: null, name: 'FAIL' }],
  };
}

test('evaluateKontrola vrátí pending, když spouštěcí čas ještě nenastal', () => {
  const bod = { id: 'bod1', deadline: { anchor: { kind: 'system_event', key: 'add' }, clockTime: '08:00', dayOffset: 0 } };
  const ctx = ctxFixture({ bodyById: new Map([['bod1', bod]]), now: new Date('2026-07-20T07:00:00') });
  const result = evaluateKontrola(bod, kontrolaFixture(), ctx);
  assert.equal(result.status, 'pending');
});

test('evaluateKontrola vrátí fulfilled, když záznam přišel do spouštěcího času', () => {
  const bod = { id: 'bod1', deadline: { anchor: { kind: 'system_event', key: 'add' }, clockTime: '08:00', dayOffset: 0 } };
  const ctx = ctxFixture({
    bodyById: new Map([['bod1', bod]]),
    now: new Date('2026-07-20T08:00:00'),
    matchedRecords: { bod1: { time: new Date('2026-07-20T07:55:00') } },
  });
  const result = evaluateKontrola(bod, kontrolaFixture(), ctx);
  assert.equal(result.status, 'fulfilled');
  assert.equal(result.vetev.id, 'v_ok');
});

test('evaluateKontrola vrátí unfulfilled, když záznam ještě nepřišel', () => {
  const bod = { id: 'bod1', deadline: { anchor: { kind: 'system_event', key: 'add' }, clockTime: '08:00', dayOffset: 0 } };
  const ctx = ctxFixture({ bodyById: new Map([['bod1', bod]]), now: new Date('2026-07-20T08:00:00') });
  const result = evaluateKontrola(bod, kontrolaFixture(), ctx);
  assert.equal(result.status, 'unfulfilled');
  assert.equal(result.vetev.id, 'v_fail');
});

test('evaluateKontrola vrátí skipped, když podmínka na kontrole neplatí', () => {
  const bod = { id: 'bod1', deadline: { anchor: { kind: 'system_event', key: 'add' }, clockTime: '08:00', dayOffset: 0 } };
  const kontrola = { ...kontrolaFixture(), condition: { field: 'datumDoruceni', operator: 'is_today' } };
  const ctx = ctxFixture({
    bodyById: new Map([['bod1', bod]]),
    now: new Date('2026-07-20T08:00:00'),
    shipment: { add: new Date('2026-07-20T00:00:00'), datumDoruceni: new Date('2026-07-21T00:00:00') },
  });
  const result = evaluateKontrola(bod, kontrola, ctx);
  assert.equal(result.status, 'skipped');
});

test('evaluateKontrola vybere správnou variantu Nesplněno podle podmínky větve (R97 scénář)', () => {
  const bod = { id: 'bod1', deadline: { anchor: { kind: 'system_event', key: 'add' }, clockTime: '08:00', dayOffset: 0 } };
  const kontrola = {
    id: 'k2', timing: { mode: 'relative', position: 'after', hours: 1 }, condition: null,
    onFulfilled: [{ id: 'v_ok', condition: null, name: 'ÚSPĚCH' }],
    onUnfulfilled: [
      { id: 'v_today', condition: { field: 'datumDoruceni', operator: 'is_today' }, name: 'NEÚSPĚCH, datum stále dnešní' },
      { id: 'v_delayed', condition: { field: 'datumDoruceni', operator: 'is_not_today' }, name: 'Zpožděná zásilka' },
    ],
  };
  const ctx = ctxFixture({
    bodyById: new Map([['bod1', bod]]),
    now: new Date('2026-07-20T09:00:00'),
    shipment: { add: new Date('2026-07-20T00:00:00'), datumDoruceni: new Date('2026-07-21T00:00:00') },
  });
  const result = evaluateKontrola(bod, kontrola, ctx);
  assert.equal(result.status, 'unfulfilled');
  assert.equal(result.vetev.id, 'v_delayed');
});

test('runSimulation projde všechny kontroly na všech bodech trasy', () => {
  const bod1 = {
    id: 'bod1',
    match: { status: ['Destination facility'] },
    deadline: { anchor: { kind: 'system_event', key: 'add' }, clockTime: '08:00', dayOffset: 0 },
    kontroly: [kontrolaFixture()],
  };
  const trasa = { useky: [{ id: 'usek1', name: 'test', body: [bod1] }] };
  const records = [{ status: 'Destination facility', time: new Date('2026-07-20T07:50:00') }];
  const shipment = { add: new Date('2026-07-20T00:00:00') };
  const now = new Date('2026-07-20T08:00:00');
  const results = runSimulation(trasa, records, shipment, now);
  assert.equal(results.length, 1);
  assert.equal(results[0].bodId, 'bod1');
  assert.equal(results[0].status, 'fulfilled');
});
```

- [ ] **Step 2: Spustit testy a ověřit, že nové selžou**

Run: `node --test nastroje/kontrola-na-bodu-trasy.logic.test.mjs`
Expected: FAIL na nových 12 testech — `evaluateCondition is not a function`.

- [ ] **Step 3: Implementovat**

Přidej do `nastroje/kontrola-na-bodu-trasy.logic.mjs`:

```js
function isSameDay(a, b) {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function evaluateCondition(condition, shipment, now) {
  if (!condition) return true;
  const value = shipment[condition.field];
  switch (condition.operator) {
    case 'is_today':
      return isSameDay(value, now);
    case 'is_not_today':
      return !isSameDay(value, now);
    case 'equals':
      return value === condition.value;
    default:
      throw new Error(`Neznámý operátor podmínky "${condition.operator}"`);
  }
}

export function computeKontrolaTriggerTime(timing, bodTermin) {
  if (timing.mode === 'fixed_clock') {
    return combineDateAndClock(bodTermin, timing.time);
  }
  const sign = timing.position === 'before' ? -1 : timing.position === 'after' ? 1 : 0;
  return addHours(bodTermin, sign * timing.hours);
}

export function evaluateKontrola(bod, kontrola, ctx) {
  const bodTermin = computeBodTermin(bod.id, ctx);
  const triggerTime = computeKontrolaTriggerTime(kontrola.timing, bodTermin);
  if (triggerTime.getTime() > ctx.now.getTime()) {
    return { kontrolaId: kontrola.id, status: 'pending', triggerTime, vetev: null };
  }
  if (!evaluateCondition(kontrola.condition, ctx.shipment, ctx.now)) {
    return { kontrolaId: kontrola.id, status: 'skipped', triggerTime, vetev: null };
  }
  const matchedRecord = ctx.matchedRecords[bod.id];
  const fulfilled = Boolean(matchedRecord) && matchedRecord.time.getTime() <= triggerTime.getTime();
  const branches = fulfilled ? kontrola.onFulfilled : kontrola.onUnfulfilled;
  const vetev = branches.find((v) => evaluateCondition(v.condition, ctx.shipment, ctx.now)) ?? null;
  return { kontrolaId: kontrola.id, status: fulfilled ? 'fulfilled' : 'unfulfilled', triggerTime, vetev };
}

export function runSimulation(trasa, records, shipment, now) {
  const bodyList = trasa.useky.flatMap((usek) => usek.body);
  const bodyById = new Map(bodyList.map((b) => [b.id, b]));
  const matchedRecords = matchRecordsToBody(records, bodyList);
  const ctx = { shipment, now, matchedRecords, bodyById, terminCache: new Map() };
  const results = [];
  for (const bod of bodyList) {
    for (const kontrola of bod.kontroly) {
      results.push({ bodId: bod.id, ...evaluateKontrola(bod, kontrola, ctx) });
    }
  }
  return results;
}
```

- [ ] **Step 4: Spustit testy a ověřit, že všechny projdou**

Run: `node --test nastroje/kontrola-na-bodu-trasy.logic.test.mjs`
Expected: PASS — 27 testů celkem, 0 selhání.

- [ ] **Step 5: Commit**

```bash
git add nastroje/kontrola-na-bodu-trasy.logic.mjs nastroje/kontrola-na-bodu-trasy.logic.test.mjs
git commit -m "feat: vyhodnocení Kontroly a běh simulace přes celou trasu"
```

---

## Task 5: Seed data ze skutečného exportu klienta

**Files:**
- Create: `nastroje/kontrola-na-bodu-trasy.data.mjs`

- [ ] **Step 1: Napsat seed data**

Vytvoř `nastroje/kontrola-na-bodu-trasy.data.mjs`. Data jsou převedená z `bytorp-data-2026-06-20.json` (trasa ČR–USA / Endevel-test) — checkpointy přejmenované na "Bod" (terminologie z `2026-07-15-body-trasy-terminologie-design.md`), pravidla R30/R97/R39/R14/R51 převedená na Kontroly (R39 sloučená na stejný bod jako R30/R97, viz spec §6).

```js
export const akce = [
  { id: 'akce_vytvorit_vkr', label: 'Vytvořit věc k řešení', icon: '📋' },
];

export const situace = [
  {
    id: 'sit_kontrola',
    name: 'Kontrola bodu',
    zavaznosti: [
      { id: 'sev_ok', name: 'v pořádku', priority: 'low', akce: [{ akceId: 'akce_vytvorit_vkr', enabled: true, description: '' }] },
      { id: 'sev_kontrola_zpozdeno', name: 'zpožděno', priority: 'medium', akce: [{ akceId: 'akce_vytvorit_vkr', enabled: true, description: '' }] },
    ],
  },
  {
    id: 'sit_zpozdeni_v_den_doruceni',
    name: 'Zpoždění v den doručení',
    zavaznosti: [
      { id: 'sev_early_warning', name: 'časná výstraha', priority: 'medium', akce: [{ akceId: 'akce_vytvorit_vkr', enabled: true, description: '' }] },
      { id: 'sev_possible_delay', name: 'možné zpoždění', priority: 'medium', akce: [{ akceId: 'akce_vytvorit_vkr', enabled: true, description: '' }] },
      { id: 'sev_critical_delay', name: 'kritické zpoždění', priority: 'urgent', akce: [{ akceId: 'akce_vytvorit_vkr', enabled: true, description: '' }] },
    ],
  },
];

function vetevOk(name) {
  return { id: `v_${name}`, condition: null, situationId: 'sit_kontrola', severityId: 'sev_ok', name, description: '', priority: 'low', actions: [{ akceId: 'akce_vytvorit_vkr', enabled: true, description: '' }] };
}

const bod1FyzickyScan = {
  id: 'bod_1_scan',
  name: '1. Fyzický scan v cílové zemi',
  match: { status: ['Destination facility'] },
  deadline: { anchor: { kind: 'system_event', key: 'add' }, clockTime: '08:00', dayOffset: 0 },
  kontroly: [
    {
      id: 'k_scan1_1', name: 'Kontrola 1 (R30)', timing: { mode: 'fixed_clock', time: '08:00' }, condition: null,
      onFulfilled: [vetevOk('1. fyzický scan - úspěšná kontrola v 8 hod')],
      onUnfulfilled: [{ id: 'v_scan1_fail', condition: null, situationId: 'sit_kontrola', severityId: 'sev_kontrola_zpozdeno', name: '1. fyzický scan - NEúspěšná kontrola v 8 hod', description: '', priority: 'medium', actions: [{ akceId: 'akce_vytvorit_vkr', enabled: true, description: '' }] }],
    },
    {
      id: 'k_scan1_2', name: 'Kontrola 2 (R97)', timing: { mode: 'relative', position: 'after', hours: 1 }, condition: null,
      onFulfilled: [vetevOk('DD - Kontrola 2 FedEx Facility (1.scan)- ÚSPĚCH')],
      onUnfulfilled: [
        { id: 'v_scan1_today', condition: { field: 'datumDoruceniOdPrepravce', operator: 'is_today' }, situationId: 'sit_zpozdeni_v_den_doruceni', severityId: 'sev_early_warning', name: 'DD - Kontrola 2 FedEx Facility (1.scan)- NEÚSPĚCH', description: 'Kontrola neúspěšná, ale datum od přepravce je stále dnešní', priority: 'medium', actions: [{ akceId: 'akce_vytvorit_vkr', enabled: true, description: '' }] },
        { id: 'v_scan1_delayed', condition: { field: 'datumDoruceniOdPrepravce', operator: 'is_not_today' }, situationId: 'sit_zpozdeni_v_den_doruceni', severityId: 'sev_critical_delay', name: 'Zpožděná zásilka', description: 'Kontrola neúspěšná a datum od přepravce není dnes', priority: 'urgent', actions: [{ akceId: 'akce_vytvorit_vkr', enabled: true, description: '' }] },
      ],
    },
    {
      id: 'k_scan1_3', name: 'Kontrola 3 (R39)', timing: { mode: 'relative', position: 'after', hours: 2 },
      condition: { field: 'datumDoruceniOdPrepravce', operator: 'is_today' },
      onFulfilled: [{ ...vetevOk('DD - 1.scan - v pořádku'), description: 'Při třetí kontrole v pořádku' }],
      onUnfulfilled: [{ id: 'v_scan1_k3_fail', condition: null, situationId: 'sit_zpozdeni_v_den_doruceni', severityId: 'sev_critical_delay', name: 'Zpožděná zásilka', description: 'Ani při třetí kontrole se scan nenašel', priority: 'urgent', actions: [{ akceId: 'akce_vytvorit_vkr', enabled: true, description: '' }] }],
    },
  ],
};

const bod2FyzickyScan = {
  id: 'bod_2_scan',
  name: '2. Fyzický scan v cílové zemi',
  match: { status: ['Destination facility'] },
  deadline: { anchor: { kind: 'bod', bodId: 'bod_1_scan' }, offsetHours: 2 },
  kontroly: [
    {
      id: 'k_scan2_1', name: 'Kontrola v termínu (R14)', timing: { mode: 'relative', position: 'at', hours: 0 }, condition: null,
      onFulfilled: [{ ...vetevOk('Předpoklad dnešního doručení - 2. scan v pořádku') }],
      onUnfulfilled: [{ id: 'v_scan2_1_fail', condition: null, situationId: 'sit_zpozdeni_v_den_doruceni', severityId: 'sev_possible_delay', name: 'Zpožděná zásilka', description: '', priority: 'medium', actions: [{ akceId: 'akce_vytvorit_vkr', enabled: true, description: '' }] }],
    },
    {
      id: 'k_scan2_2', name: 'Kontrola 1h po termínu (R14)', timing: { mode: 'relative', position: 'after', hours: 1 }, condition: null,
      onFulfilled: [{ ...vetevOk('Předpoklad dnešního doručení - 2. scan v pořádku (2. kontrola)') }],
      onUnfulfilled: [{ id: 'v_scan2_2_fail', condition: null, situationId: 'sit_zpozdeni_v_den_doruceni', severityId: 'sev_possible_delay', name: 'Zpožděná zásilka', description: '', priority: 'medium', actions: [{ akceId: 'akce_vytvorit_vkr', enabled: true, description: '' }] }],
    },
  ],
};

const bodCelniOdbaveniDokonceno = {
  id: 'bod_celni_dokonceno',
  name: 'Export - celní odbavení dokončeno',
  match: { status: ['Clearance Completed'] },
  deadline: { anchor: { kind: 'bod', bodId: 'bod_celni_zahajeno' }, offsetHours: 5 },
  kontroly: [
    {
      id: 'k_celni_1', name: 'Kontrola v termínu (R51)', timing: { mode: 'relative', position: 'at', hours: 0 }, condition: null,
      onFulfilled: [],
      onUnfulfilled: [{ id: 'v_celni_fail', condition: null, situationId: 'sit_zpozdeni_v_den_doruceni', severityId: 'sev_possible_delay', name: 'Soulad s trasou — nesplněno', description: '', priority: 'medium', actions: [{ akceId: 'akce_vytvorit_vkr', enabled: true, description: '' }] }],
    },
  ],
};

function bodBezKontrol(id, name, match, deadline) {
  return { id, name, match, deadline, kontroly: [] };
}

const bodVyzvednuti = bodBezKontrol('bod_vyzvednuti', 'Vyzvednutí zásilky', { status: ['in transit'] }, { anchor: { kind: 'system_event', key: 'pickup' }, offsetHours: 0 });
const bodOdletZeZeme = bodBezKontrol('bod_odlet_zeme', 'Export - odlet ze země původu', { status: ['origin fedex facilty'], locationType: ['ORIGIN_FEDEX_FACILITY'] }, { anchor: { kind: 'bod', bodId: 'bod_vyzvednuti' }, clockTime: '22:00', dayOffset: 0 });
const bodPriletHub = bodBezKontrol('bod_prilet_hub', 'Export - Přílet na přestupní hub', { status: ['něco'], locationCity: ['Paris'] }, { anchor: { kind: 'bod', bodId: 'bod_odlet_zeme' }, clockTime: '03:00', dayOffset: 1 });
const bodOdletHub = bodBezKontrol('bod_odlet_hub', 'Export - odlet z přestupního hubu', { status: ['něco'], locationType: ['FEDEX_HUB'], locationCity: ['Paris'] }, { anchor: { kind: 'bod', bodId: 'bod_prilet_hub' }, clockTime: '06:00', dayOffset: 0 });
const bodPriletCil = bodBezKontrol('bod_prilet_cil', 'Export - přílet do cílové destinace', { status: ['něco'], locationCity: ['Newar', 'Memphis', 'cincinnaty'] }, { anchor: { kind: 'bod', bodId: 'bod_odlet_hub' }, clockTime: '08:00', dayOffset: 0 });
const bodCelniZahajeno = bodBezKontrol('bod_celni_zahajeno', 'Export - celní odbavení', { status: ['Clearance in Progress'] }, { anchor: { kind: 'bod', bodId: 'bod_prilet_cil' }, offsetHours: 0 });

export const trasa = {
  id: 'route_endevel_test',
  name: 'ČR – USA (Endevel-test)',
  useky: [
    {
      id: 'usek_cr_paris',
      name: 'ČR - Paříž',
      body: [bodVyzvednuti, bodOdletZeZeme, bodPriletHub],
    },
    {
      id: 'usek_paris_usa',
      name: 'Paříž - USA',
      body: [bodOdletHub, bodPriletCil, bodCelniZahajeno, bodCelniOdbaveniDokonceno, bod1FyzickyScan, bod2FyzickyScan],
    },
  ],
};
```

**Poznámka pro inženýra:** `bod_celni_zahajeno` nemá vlastní Kontroly (v reálných datech je to jen časová kotva pro `bod_celni_dokonceno`, viz poznámka v exportu: "Checkpoint celní je důležité založit jako časovou kotvu"). To je platný stav, ne mezera — `SegmentEditorPage`/wireframe ho zobrazuje jako "0 kontrol".

- [ ] **Step 2: Ověřit, že modul jde načíst a `runSimulation` na něm neselže**

Run:
```bash
node -e "
import('./nastroje/kontrola-na-bodu-trasy.data.mjs').then(async ({ trasa }) => {
  const { runSimulation } = await import('./nastroje/kontrola-na-bodu-trasy.logic.mjs');
  const shipment = { add: new Date('2026-07-20T00:00:00'), pickup: new Date('2026-07-15T09:00:00'), datumDoruceniOdPrepravce: new Date('2026-07-20T00:00:00') };
  const results = runSimulation(trasa, [], shipment, new Date('2026-07-20T12:00:00'));
  console.log('OK, výsledků:', results.length);
});
"
```
Expected: `OK, výsledků: 6` (3 kontroly na `bod_1_scan` + 2 na `bod_2_scan` + 1 na `bod_celni_dokonceno`, žádná chyba/výjimka).

- [ ] **Step 3: Commit**

```bash
git add nastroje/kontrola-na-bodu-trasy.data.mjs
git commit -m "feat: seed data pro artefakt Kontrola na bodu ze skutečného exportu klienta"
```

---

## Task 6: HTML shell, CSS a state store s localStorage perzistencí

**Files:**
- Create: `nastroje/kontrola-na-bodu-trasy.html`

- [ ] **Step 1: Napsat základní HTML kostru se state store**

Vytvoř `nastroje/kontrola-na-bodu-trasy.html`:

```html
<!doctype html>
<html lang="cs">
<head>
<meta charset="utf-8">
<title>Kontrola na bodu trasy</title>
<style>
  :root {
    --bg: #f7f5f1; --surface: #ffffff; --ink: #201d2b; --ink-soft: #55506a;
    --primary: #6d5ae6; --primary-soft: #efeafc; --border: #e4e0ee;
    --ok: #1f7a5c; --ok-soft: #e3f3ec; --warn: #a15a1f; --warn-soft: #f8ecdf;
    --muted: #f1eff5;
  }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; background: var(--bg); color: var(--ink); }
  header { display: flex; align-items: center; justify-content: space-between; padding: 12px 20px; background: var(--surface); border-bottom: 1px solid var(--border); }
  header h1 { font-size: 16px; margin: 0; }
  .tabs { display: flex; gap: 4px; }
  .tab-btn { border: none; background: transparent; padding: 6px 14px; border-radius: 6px; font-size: 13px; cursor: pointer; color: var(--ink-soft); }
  .tab-btn.active { background: var(--primary-soft); color: var(--primary); font-weight: 600; }
  .toolbar { display: flex; gap: 8px; }
  .toolbar button { border: 1px solid var(--border); background: var(--surface); border-radius: 6px; padding: 6px 10px; font-size: 12px; cursor: pointer; }
  main { display: flex; min-height: calc(100vh - 49px); }
  #view-config, #view-test { display: flex; flex: 1; min-width: 0; }
  .hidden { display: none !important; }
  #tree { width: 280px; flex-shrink: 0; border-right: 1px solid var(--border); padding: 14px; overflow-y: auto; }
  #detail { flex: 1; padding: 18px; overflow-y: auto; }
  .tree-usek { font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--ink-soft); margin: 14px 0 6px; }
  .tree-bod { display: block; width: 100%; text-align: left; padding: 6px 8px; border-radius: 6px; border: none; background: transparent; font-size: 13px; cursor: pointer; }
  .tree-bod.active { background: var(--primary-soft); color: var(--primary); font-weight: 600; }
  .tree-bod .count { color: var(--ink-soft); font-size: 11px; margin-left: 4px; }
  table.kontroly { width: 100%; border-collapse: collapse; font-size: 12.5px; margin-top: 10px; }
  table.kontroly th { text-align: left; padding: 6px 8px; border-bottom: 2px solid var(--border); font-size: 11px; text-transform: uppercase; color: var(--ink-soft); }
  table.kontroly td { padding: 8px; border-bottom: 1px solid var(--border); vertical-align: top; }
  table.kontroly tr.kontrola-row { cursor: pointer; }
  table.kontroly tr.kontrola-row:hover { background: var(--muted); }
  .kontrola-detail { padding: 10px 14px; background: var(--muted); border-radius: 8px; margin: 4px 0 10px; }
  .branch-ok { color: var(--ok); }
  .branch-warn { color: var(--warn); }
</style>
</head>
<body>

<header>
  <h1>Kontrola na bodu trasy</h1>
  <div class="tabs">
    <button class="tab-btn active" data-tab="config">Konfigurace</button>
    <button class="tab-btn" data-tab="test">Test</button>
  </div>
  <div class="toolbar">
    <button id="btn-export">Export JSON</button>
    <button id="btn-import">Import JSON</button>
    <input type="file" id="file-import" accept="application/json" class="hidden">
  </div>
</header>

<main>
  <div id="view-config">
    <nav id="tree"></nav>
    <section id="detail"></section>
  </div>
  <div id="view-test" class="hidden"></div>
</main>

<script type="module">
import { trasa as seedTrasa, situace as seedSituace, akce as seedAkce } from './kontrola-na-bodu-trasy.data.mjs';
import * as logic from './kontrola-na-bodu-trasy.logic.mjs';

const STORAGE_KEY = 'kontrola-na-bodu-trasy:v1';

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      return reviveDates(JSON.parse(raw));
    } catch (e) {
      console.warn('Poškozený localStorage, načítám seed data.', e);
    }
  }
  return { trasa: seedTrasa, situace: seedSituace, akce: seedAkce, selectedBodId: null, activeTab: 'config' };
}

function reviveDates(state) {
  // localStorage ukládá jen JSON — data (avizované doručení atd.) v uloženém stavu žijí jen ve formulářích záložky Test,
  // ta si je čte jako datetime-local stringy přímo z DOM, takže tu není co revivovat. Ponecháno jako místo pro budoucí rozšíření.
  return state;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();

function setState(patch) {
  state = { ...state, ...patch };
  saveState();
  render();
}

window.__kontrolaNaBoduState = () => state; // pro manuální ověření v konzoli prohlížeče (Task 12)
window.__kontrolaNaBoduLogic = logic;

function render() {
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === state.activeTab);
  });
  document.getElementById('view-config').classList.toggle('hidden', state.activeTab !== 'config');
  document.getElementById('view-test').classList.toggle('hidden', state.activeTab !== 'test');
}

document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => setState({ activeTab: btn.dataset.tab }));
});

document.getElementById('btn-export').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'kontrola-na-bodu-trasy-export.json';
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('btn-import').addEventListener('click', () => {
  document.getElementById('file-import').click();
});

document.getElementById('file-import').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const text = await file.text();
  setState(JSON.parse(text));
});

render();
</script>
</body>
</html>
```

- [ ] **Step 2: Ověřit ručně v prohlížeči, že stránka naběhne bez chyby**

Otevři `nastroje/kontrola-na-bodu-trasy.html` přímo v prohlížeči (dvojklik na soubor, nebo přes lokální statický server kvůli ES modulům — `python3 -m http.server 8123` v `nastroje/` a otevřít `http://localhost:8123/kontrola-na-bodu-trasy.html`).

Expected: Hlavička s přepínačem "Konfigurace"/"Test", žádná chyba v konzoli (`⌥⌘J` v Chrome). V konzoli `window.__kontrolaNaBoduState()` vrátí objekt se `state.trasa.name === 'ČR – USA (Endevel-test)'`.

**Poznámka:** `type="module"` vyžaduje `http://`, ne `file://` (prohlížeče blokují ES module import z `file:` protokolu kvůli CORS) — proto lokální server v tomto kroku. Task 13 tohle vyřeší úplně jiným způsobem (vše se sloučí do jednoho souboru bez `import`).

- [ ] **Step 3: Commit**

```bash
git add nastroje/kontrola-na-bodu-trasy.html
git commit -m "feat: HTML kostra, CSS a state store s localStorage perzistencí"
```

---

## Task 7: Konfigurační pohled — strom Trasa → Úsek → Bod

**Files:**
- Modify: `nastroje/kontrola-na-bodu-trasy.html`

- [ ] **Step 1: Přidat renderování stromu a výběr bodu**

V `nastroje/kontrola-na-bodu-trasy.html`, uvnitř `<script type="module">`, nahraď funkci `render()` (a vše pod ní) tímto:

```js
function renderTree() {
  const tree = document.getElementById('tree');
  tree.innerHTML = '';
  for (const usek of state.trasa.useky) {
    const heading = document.createElement('div');
    heading.className = 'tree-usek';
    heading.textContent = usek.name;
    tree.appendChild(heading);
    for (const bod of usek.body) {
      const btn = document.createElement('button');
      btn.className = 'tree-bod' + (bod.id === state.selectedBodId ? ' active' : '');
      btn.innerHTML = `${bod.name} <span class="count">${bod.kontroly.length} kontrol</span>`;
      btn.addEventListener('click', () => setState({ selectedBodId: bod.id }));
      tree.appendChild(btn);
    }
  }
}

function findBod(bodId) {
  for (const usek of state.trasa.useky) {
    const found = usek.body.find((b) => b.id === bodId);
    if (found) return found;
  }
  return null;
}

function render() {
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === state.activeTab);
  });
  document.getElementById('view-config').classList.toggle('hidden', state.activeTab !== 'config');
  document.getElementById('view-test').classList.toggle('hidden', state.activeTab !== 'test');
  renderTree();
  renderDetail();
}

function renderDetail() {
  const detail = document.getElementById('detail');
  const bod = state.selectedBodId ? findBod(state.selectedBodId) : null;
  if (!bod) {
    detail.innerHTML = '<p>Vyber bod v levém stromu.</p>';
    return;
  }
  detail.innerHTML = `<h2>${bod.name}</h2><p>Detail kontrol přidá Task 8.</p>`;
}
```

- [ ] **Step 2: Ověřit ručně v prohlížeči**

Obnov stránku (server z Tasku 6 Step 2 pořád běží).

Expected: Vlevo strom se dvěma úseky ("ČR - Paříž", "Paříž - USA") a jejich body, u „1. Fyzický scan v cílové zemi" značka „3 kontrol", u „Vyzvednutí zásilky" značka „0 kontrol". Klik na bod ho zvýrazní a vpravo se zobrazí jeho název.

- [ ] **Step 3: Commit**

```bash
git add nastroje/kontrola-na-bodu-trasy.html
git commit -m "feat: strom Trasa/Úsek/Bod v konfiguračním pohledu"
```

---

## Task 8: Konfigurační pohled — tabulka Kontrol pro vybraný bod

**Files:**
- Modify: `nastroje/kontrola-na-bodu-trasy.html`

- [ ] **Step 1: Přidat state pro rozbalený řádek a vykreslení tabulky**

Přidej do state inicializace (v `loadState()` fallback objektu) pole `expandedKontrolaId: null`, a nahraď `renderDetail()`:

```js
function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try { return reviveDates(JSON.parse(raw)); } catch (e) { console.warn('Poškozený localStorage, načítám seed data.', e); }
  }
  return { trasa: seedTrasa, situace: seedSituace, akce: seedAkce, selectedBodId: null, activeTab: 'config', expandedKontrolaId: null };
}

function findSituace(situationId) { return state.situace.find((s) => s.id === situationId) ?? null; }
function findZavaznost(situationId, severityId) {
  const s = findSituace(situationId);
  return s ? s.zavaznosti.find((z) => z.id === severityId) ?? null : null;
}

function formatTiming(timing) {
  if (timing.mode === 'fixed_clock') return `pevně v ${timing.time}`;
  const label = { before: 'před termínem', at: 'v termínu', after: 'po termínu' }[timing.position];
  return timing.hours === 0 ? label : `${timing.hours} h ${label}`;
}

function formatVetev(vetev) {
  if (!vetev) return '<span style="color:var(--ink-soft)">— (větev nenastavena)</span>';
  const zav = findZavaznost(vetev.situationId, vetev.severityId);
  const sit = findSituace(vetev.situationId);
  return `<b>${vetev.name}</b><br><span style="font-size:11px;color:var(--ink-soft)">${sit?.name ?? '—'} · ${zav?.name ?? '—'}</span>`;
}

function renderDetail() {
  const detail = document.getElementById('detail');
  const bod = state.selectedBodId ? findBod(state.selectedBodId) : null;
  if (!bod) {
    detail.innerHTML = '<p>Vyber bod v levém stromu.</p>';
    return;
  }
  const rows = bod.kontroly.map((k, i) => {
    const expanded = state.expandedKontrolaId === k.id;
    const okVetev = k.onFulfilled[0] ?? null;
    const failVetev = k.onUnfulfilled[0] ?? null;
    let html = `
      <tr class="kontrola-row" data-kontrola-id="${k.id}">
        <td>${i + 1}</td>
        <td>${formatTiming(k.timing)}</td>
        <td>${k.condition ? `${k.condition.field} ${k.condition.operator}` : '—'}</td>
        <td class="branch-ok">${okVetev ? okVetev.name : '<i>bez větve</i>'}</td>
        <td class="branch-warn">${failVetev ? failVetev.name : '<i>bez větve</i>'}</td>
      </tr>`;
    if (expanded) {
      html += `<tr><td colspan="5"><div class="kontrola-detail">
        <p><b>Splněno:</b><br>${k.onFulfilled.map(formatVetev).join('<hr>') || '—'}</p>
        <p><b>Nesplněno:</b><br>${k.onUnfulfilled.map(formatVetev).join('<hr>') || '—'}</p>
      </div></td></tr>`;
    }
    return html;
  }).join('');

  detail.innerHTML = `
    <h2>${bod.name}</h2>
    <p style="font-size:12.5px;color:var(--ink-soft)">Co musí být na záznamu: ${JSON.stringify(bod.match)}</p>
    <table class="kontroly">
      <thead><tr><th>#</th><th>Časování</th><th>Podmínka</th><th>Splněno →</th><th>Nesplněno →</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="5"><i>Zatím žádné kontroly.</i></td></tr>'}</tbody>
    </table>
  `;

  detail.querySelectorAll('.kontrola-row').forEach((row) => {
    row.addEventListener('click', () => {
      const id = row.dataset.kontrolaId;
      setState({ expandedKontrolaId: state.expandedKontrolaId === id ? null : id });
    });
  });
}
```

- [ ] **Step 2: Ověřit ručně v prohlížeči**

Obnov stránku, klikni na „1. Fyzický scan v cílové zemi".

Expected: Tabulka se 3 řádky (Kontrola 1/2/3), sloupec "Nesplněno →" u řádku 2 ukazuje jméno první varianty větve (`DD - Kontrola 2 FedEx Facility (1.scan)- NEÚSPĚCH`). Klik na řádek 1 rozbalí detail se Situací/Závažností pro obě větve ("Kontrola bodu · v pořádku" / "Kontrola bodu · zpožděno"), druhý klik na stejný řádek detail zase schová.

- [ ] **Step 3: Commit**

```bash
git add nastroje/kontrola-na-bodu-trasy.html
git commit -m "feat: tabulka Kontrol s rozbalitelným detailem větví"
```

---

## Task 9: Editace Kontroly a větví (situace/závažnost/akce, přidání kontroly)

**Files:**
- Modify: `nastroje/kontrola-na-bodu-trasy.html`

- [ ] **Step 1: Přidat formulář pro editaci rozbaleného řádku a tlačítko "+ Přidat kontrolu"**

Nejdřív smaž funkci `formatVetev` z Tasku 8 (Step 1) — ten static text nahrazuje editovatelný formulář níže, `formatVetev` by po téhle úpravě zůstal jako nepoužívaný mrtvý kód.

Nahraď blok `if (expanded) { ... }` uvnitř `renderDetail()` tímto (přidává editovatelné selecty místo statického textu) a přidej tlačítko pod tabulku:

```js
function situaceOptionsHtml(selectedId) {
  return state.situace.map((s) => `<option value="${s.id}" ${s.id === selectedId ? 'selected' : ''}>${s.name}</option>`).join('');
}

function zavaznostOptionsHtml(situationId, selectedId) {
  const sit = findSituace(situationId);
  if (!sit) return '';
  return sit.zavaznosti.map((z) => `<option value="${z.id}" ${z.id === selectedId ? 'selected' : ''}>${z.name}</option>`).join('');
}

function findAkce(akceId) { return state.akce.find((a) => a.id === akceId) ?? null; }

function akceChecklistHtml(kontrolaId, branchKey, vetevIndex, vetev) {
  if (!vetev.actions || vetev.actions.length === 0) return '<p style="font-size:11px;color:var(--ink-soft);"><i>Žádné akce.</i></p>';
  return vetev.actions.map((a, actionIndex) => {
    const akceDef = findAkce(a.akceId);
    return `
      <div style="display:flex;align-items:center;gap:6px;margin-top:4px;">
        <input type="checkbox" class="edit-akce-enabled" data-kontrola-id="${kontrolaId}" data-branch="${branchKey}" data-index="${vetevIndex}" data-action-index="${actionIndex}" ${a.enabled ? 'checked' : ''}>
        <span style="font-size:12px;">${akceDef ? akceDef.icon + ' ' + akceDef.label : a.akceId}</span>
        <input class="edit-akce-desc" data-kontrola-id="${kontrolaId}" data-branch="${branchKey}" data-index="${vetevIndex}" data-action-index="${actionIndex}" placeholder="volitelný text akce" value="${a.description ?? ''}" style="flex:1;font-size:11px;">
      </div>`;
  }).join('');
}

function editableVetevHtml(kontrolaId, branchKey, vetev, index) {
  if (!vetev) return '<p><i>Bez větve.</i></p>';
  return `
    <div style="border:1px solid var(--border);border-radius:6px;padding:8px;margin-bottom:6px;">
      <label style="font-size:11px;">Situace
        <select class="edit-situace" data-kontrola-id="${kontrolaId}" data-branch="${branchKey}" data-index="${index}">
          ${situaceOptionsHtml(vetev.situationId)}
        </select>
      </label>
      <label style="font-size:11px;margin-left:8px;">Závažnost
        <select class="edit-zavaznost" data-kontrola-id="${kontrolaId}" data-branch="${branchKey}" data-index="${index}">
          ${zavaznostOptionsHtml(vetev.situationId, vetev.severityId)}
        </select>
      </label>
      <br>
      <label style="font-size:11px;">Název VkŘ
        <input class="edit-name" data-kontrola-id="${kontrolaId}" data-branch="${branchKey}" data-index="${index}" value="${vetev.name}" style="width:100%;">
      </label>
      <label style="font-size:11px;">Popis VkŘ
        <textarea class="edit-description" data-kontrola-id="${kontrolaId}" data-branch="${branchKey}" data-index="${index}" style="width:100%;" rows="2">${vetev.description ?? ''}</textarea>
      </label>
      <label style="font-size:11px;">Priorita
        <select class="edit-priority" data-kontrola-id="${kontrolaId}" data-branch="${branchKey}" data-index="${index}">
          ${['low', 'medium', 'high', 'urgent'].map((p) => `<option value="${p}" ${p === vetev.priority ? 'selected' : ''}>${p}</option>`).join('')}
        </select>
      </label>
      <div style="margin-top:6px;">
        <span style="font-size:11px;font-weight:600;">Akce</span>
        ${akceChecklistHtml(kontrolaId, branchKey, index, vetev)}
      </div>
    </div>`;
}
```

Uvnitř `renderDetail()` uprav blok pro `expanded`, ať používá `editableVetevHtml`:

```js
    if (expanded) {
      html += `<tr><td colspan="5"><div class="kontrola-detail">
        <p><b>Splněno:</b></p>${k.onFulfilled.map((v, idx) => editableVetevHtml(k.id, 'onFulfilled', v, idx)).join('') || '<p><i>Bez větve.</i></p>'}
        <p><b>Nesplněno:</b></p>${k.onUnfulfilled.map((v, idx) => editableVetevHtml(k.id, 'onUnfulfilled', v, idx)).join('') || '<p><i>Bez větve.</i></p>'}
      </div></td></tr>`;
    }
```

Na konec `renderDetail()` (za `detail.innerHTML = ...` a listenery na `.kontrola-row`) přidej listenery na nové edit prvky a tlačítko "+ Přidat kontrolu":

```js
  detail.querySelectorAll('.edit-situace').forEach((sel) => {
    sel.addEventListener('change', (e) => {
      updateVetev(e.target.dataset.kontrolaId, e.target.dataset.branch, Number(e.target.dataset.index), (v) => {
        v.situationId = e.target.value;
        v.severityId = findSituace(e.target.value)?.zavaznosti[0]?.id ?? null;
      });
    });
  });
  detail.querySelectorAll('.edit-zavaznost').forEach((sel) => {
    sel.addEventListener('change', (e) => {
      updateVetev(e.target.dataset.kontrolaId, e.target.dataset.branch, Number(e.target.dataset.index), (v) => {
        v.severityId = e.target.value;
      });
    });
  });
  detail.querySelectorAll('.edit-name').forEach((input) => {
    input.addEventListener('change', (e) => {
      updateVetev(e.target.dataset.kontrolaId, e.target.dataset.branch, Number(e.target.dataset.index), (v) => {
        v.name = e.target.value;
      });
    });
  });
  detail.querySelectorAll('.edit-description').forEach((textarea) => {
    textarea.addEventListener('change', (e) => {
      updateVetev(e.target.dataset.kontrolaId, e.target.dataset.branch, Number(e.target.dataset.index), (v) => {
        v.description = e.target.value;
      });
    });
  });
  detail.querySelectorAll('.edit-priority').forEach((sel) => {
    sel.addEventListener('change', (e) => {
      updateVetev(e.target.dataset.kontrolaId, e.target.dataset.branch, Number(e.target.dataset.index), (v) => {
        v.priority = e.target.value;
      });
    });
  });
  detail.querySelectorAll('.edit-akce-enabled').forEach((cb) => {
    cb.addEventListener('change', (e) => {
      const actionIndex = Number(e.target.dataset.actionIndex);
      updateVetev(e.target.dataset.kontrolaId, e.target.dataset.branch, Number(e.target.dataset.index), (v) => {
        v.actions[actionIndex].enabled = e.target.checked;
      });
    });
  });
  detail.querySelectorAll('.edit-akce-desc').forEach((input) => {
    input.addEventListener('change', (e) => {
      const actionIndex = Number(e.target.dataset.actionIndex);
      updateVetev(e.target.dataset.kontrolaId, e.target.dataset.branch, Number(e.target.dataset.index), (v) => {
        v.actions[actionIndex].description = e.target.value;
      });
    });
  });

  const addBtn = document.getElementById('btn-add-kontrola');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const newId = 'k_' + Date.now();
      bod.kontroly.push({
        id: newId,
        name: 'Nová kontrola',
        timing: { mode: 'fixed_clock', time: '08:00' },
        condition: null,
        onFulfilled: [],
        onUnfulfilled: [],
      });
      setState({ expandedKontrolaId: newId });
    });
  }
}

function updateVetev(kontrolaId, branchKey, index, mutate) {
  const bod = findBod(state.selectedBodId);
  const kontrola = bod.kontroly.find((k) => k.id === kontrolaId);
  mutate(kontrola[branchKey][index]);
  setState({});
}
```

A přidej tlačítko do šablony `detail.innerHTML` v `renderDetail()`, hned za `</table>`:

```js
      <tbody>${rows || '<tr><td colspan="5"><i>Zatím žádné kontroly.</i></td></tr>'}</tbody>
    </table>
    <button id="btn-add-kontrola" style="margin-top:10px;">+ Přidat kontrolu</button>
  `;
```

(Nahrazuje předchozí konec šablony z Tasku 8 — ujisti se, že `</table>` řádek a `+ Přidat kontrolu` tlačítko jsou uvnitř stejného template literalu, ne duplicitně.)

- [ ] **Step 2: Ověřit ručně v prohlížeči**

Obnov stránku, rozbal Kontrolu 2 na bodu „1. Fyzický scan v cílové zemi", u první varianty Nesplněno přepni Závažnost na „kritické zpoždění" — Situace/Závažnost select se má okamžitě změnit a zůstat po refreshi stránky (localStorage). Odškrtni checkbox u akce „📋 Vytvořit věc k řešení" a napiš do vedlejšího pole libovolný text — po refreshi zůstává odškrtnuté i text. Klikni „+ Přidat kontrolu" na bodu bez kontrol (např. "Vyzvednutí zásilky") — objeví se nová Kontrola 1 s výchozím časováním 08:00.

- [ ] **Step 3: Commit**

```bash
git add nastroje/kontrola-na-bodu-trasy.html
git commit -m "feat: editace Situace/Závažnosti/názvu větve a přidání nové Kontroly"
```

---

## Task 10: Simulátor — vstupní formulář

**Files:**
- Modify: `nastroje/kontrola-na-bodu-trasy.html`

- [ ] **Step 1: Přidat state pro simulátor a vykreslení formuláře**

Přidej do fallback state v `loadState()` klíč `simInput`:

```js
    simInput: {
      destCountry: 'US',
      carrier: 'FedEx',
      serviceType: 'Economy',
      add: '2026-07-20T08:00',
      pickup: '2026-07-15T09:00',
      datumDoruceniOdPrepravce: '2026-07-20T00:00',
      now: '2026-07-20T09:00',
      records: [],
    },
```

Přidej funkci `renderTest()` a zavolej ji z `render()` (za `renderDetail();`):

```js
function render() {
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === state.activeTab);
  });
  document.getElementById('view-config').classList.toggle('hidden', state.activeTab !== 'config');
  document.getElementById('view-test').classList.toggle('hidden', state.activeTab !== 'test');
  renderTree();
  renderDetail();
  renderTest();
}

function renderTest() {
  const view = document.getElementById('view-test');
  const s = state.simInput;
  const recordsHtml = s.records.map((r, i) => `
    <div style="display:flex;gap:6px;margin-bottom:4px;">
      <input class="rec-status" data-index="${i}" placeholder="status" value="${r.status ?? ''}" style="flex:1;">
      <input class="rec-city" data-index="${i}" placeholder="město" value="${r.locationCity ?? ''}" style="flex:1;">
      <input class="rec-time" data-index="${i}" type="datetime-local" value="${r.time ?? ''}" style="flex:1;">
      <button class="rec-remove" data-index="${i}">✕</button>
    </div>`).join('');

  view.innerHTML = `
    <div style="padding:18px;max-width:640px;">
      <h2>Simulátor</h2>
      <fieldset style="border:1px solid var(--border);border-radius:8px;padding:10px;margin-bottom:14px;">
        <legend>Zásilka</legend>
        <label>Cílová země <input id="sim-destCountry" value="${s.destCountry}"></label><br>
        <label>Avizované doručení (ADD) <input id="sim-add" type="datetime-local" value="${s.add}"></label><br>
        <label>Vyzvednutí <input id="sim-pickup" type="datetime-local" value="${s.pickup}"></label><br>
        <label>Datum doručení od přepravce <input id="sim-datumDoruceniOdPrepravce" type="datetime-local" value="${s.datumDoruceniOdPrepravce}"></label><br>
        <label>Aktuální čas (simulované "teď") <input id="sim-now" type="datetime-local" value="${s.now}"></label>
      </fieldset>
      <fieldset style="border:1px solid var(--border);border-radius:8px;padding:10px;margin-bottom:14px;">
        <legend>Tracking záznamy, které "jakoby přišly"</legend>
        ${recordsHtml || '<p><i>Zatím žádné.</i></p>'}
        <button id="sim-add-record">+ Přidat záznam</button>
      </fieldset>
      <button id="sim-run" style="background:var(--primary);color:white;border:none;border-radius:6px;padding:8px 16px;">Spustit simulaci</button>
      <div id="sim-results" style="margin-top:16px;"></div>
    </div>
  `;

  document.getElementById('sim-add-record').addEventListener('click', () => {
    state.simInput.records.push({ status: '', locationCity: '', time: '' });
    setState({});
  });
  view.querySelectorAll('.rec-remove').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      state.simInput.records.splice(Number(e.target.dataset.index), 1);
      setState({});
    });
  });
  view.querySelectorAll('.rec-status, .rec-city, .rec-time').forEach((input) => {
    input.addEventListener('change', (e) => {
      const idx = Number(e.target.dataset.index);
      const field = e.target.classList.contains('rec-status') ? 'status' : e.target.classList.contains('rec-city') ? 'locationCity' : 'time';
      state.simInput.records[idx][field] = e.target.value;
      setState({});
    });
  });
  ['destCountry', 'add', 'pickup', 'datumDoruceniOdPrepravce', 'now'].forEach((field) => {
    document.getElementById('sim-' + field).addEventListener('change', (e) => {
      state.simInput[field] = e.target.value;
      setState({});
    });
  });
  document.getElementById('sim-run').addEventListener('click', runSimulationFromUi);
}

function runSimulationFromUi() {
  document.getElementById('sim-results').innerHTML = '<p><i>Vyhodnocení přidá Task 11.</i></p>';
}
```

- [ ] **Step 2: Ověřit ručně v prohlížeči**

Obnov stránku, přepni na záložku „Test". Klikni „+ Přidat záznam", vyplň status "Destination facility" a čas, klikni "Spustit simulaci" — zobrazí se placeholder text (nahradí ho Task 11). Přepni zpět na "Konfigurace" a znovu na "Test" — zadaný záznam zůstává (state se drží).

- [ ] **Step 3: Commit**

```bash
git add nastroje/kontrola-na-bodu-trasy.html
git commit -m "feat: vstupní formulář simulátoru (zásilka + tracking záznamy + teď)"
```

---

## Task 11: Simulátor — vyhodnocení a výsledky

**Files:**
- Modify: `nastroje/kontrola-na-bodu-trasy.html`

- [ ] **Step 1: Napojit `runSimulation` z logic modulu a vykreslit výsledky**

Nahraď `runSimulationFromUi()`:

```js
function runSimulationFromUi() {
  const s = state.simInput;
  const shipment = {
    add: new Date(s.add),
    pickup: new Date(s.pickup),
    datumDoruceniOdPrepravce: new Date(s.datumDoruceniOdPrepravce),
  };
  const now = new Date(s.now);
  const records = s.records
    .filter((r) => r.status && r.time)
    .map((r) => ({ status: r.status, locationCity: r.locationCity || undefined, time: new Date(r.time) }));

  let results;
  try {
    results = logic.runSimulation(state.trasa, records, shipment, now);
  } catch (err) {
    document.getElementById('sim-results').innerHTML = `<p style="color:var(--warn)">Chyba: ${err.message}</p>`;
    return;
  }

  const statusLabel = { pending: 'ještě neproběhla', skipped: 'přeskočena (podmínka kontroly neplatí)', fulfilled: 'Splněno', unfulfilled: 'Nesplněno' };
  const statusClass = { fulfilled: 'branch-ok', unfulfilled: 'branch-warn', pending: '', skipped: '' };

  const rows = results.map((r) => {
    const bod = findBod(r.bodId);
    return `
      <tr>
        <td>${bod.name}</td>
        <td>${r.triggerTime.toLocaleString('cs-CZ')}</td>
        <td class="${statusClass[r.status]}">${statusLabel[r.status]}</td>
        <td>${r.vetev ? r.vetev.name : '—'}</td>
      </tr>`;
  }).join('');

  document.getElementById('sim-results').innerHTML = `
    <table class="kontroly">
      <thead><tr><th>Bod</th><th>Spouštěcí čas</th><th>Výsledek</th><th>VkŘ</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}
```

- [ ] **Step 2: Ověřit ručně v prohlížeči — golden path**

Na záložce Test nastav: ADD = `2026-07-20T08:00`, teď = `2026-07-20T09:30`, přidej záznam status="Destination facility", čas=`2026-07-20T07:55`. Spusť simulaci.

Expected: Řádek pro bod „1. Fyzický scan v cílové zemi" ukazuje Kontrolu 1 (spouštěcí čas 20.7. 08:00) jako **Splněno** s VkŘ „1. fyzický scan - úspěšná kontrola v 8 hod", Kontrolu 2 (09:00) taky **Splněno**, Kontrolu 3 (10:00) jako **ještě neproběhla** (spouštěcí čas je po "teď").

- [ ] **Step 3: Ověřit okrajový případ — bod nastal později, mezi Kontrolou 1 a 2**

Změň záznam na čas `2026-07-20T08:30`, teď necháme `2026-07-20T09:30`. Spusť simulaci.

Expected: Kontrola 1 (08:00) → **Nesplněno** (záznam ještě nepřišel), Kontrola 2 (09:00) → **Splněno** (záznam už do 09:00 dorazil). Přesně scénář, který popisujete v zadání — „co se stane, když bod nastane později".

- [ ] **Step 4: Ověřit kaskádu — pozdní bod posune termín navazujícího bodu**

Přidej druhý záznam: status="Destination facility"... **pozor**, oba body `bod_1_scan` i `bod_2_scan` mají v seed datech stejný `match.status` (`Destination facility`) — to je platné zjednodušení seed dat (reálná data měla i strojové `location_type`, které tenhle test nerozlišuje). Pro tenhle krok tedy over kaskádu přímo v Node konzoli místo přes formulář:

Run:
```bash
node -e "
import('./nastroje/kontrola-na-bodu-trasy.data.mjs').then(async ({ trasa }) => {
  const { computeBodTermin } = await import('./nastroje/kontrola-na-bodu-trasy.logic.mjs');
  const bodyById = new Map(trasa.useky.flatMap(u => u.body).map(b => [b.id, b]));
  const ctx = {
    shipment: { add: new Date('2026-07-20T08:00:00') },
    matchedRecords: { bod_1_scan: { time: new Date('2026-07-20T11:00:00') } },
    bodyById, terminCache: new Map(),
  };
  console.log('Termín bod_2_scan (bod_1_scan o 3h později):', computeBodTermin('bod_2_scan', ctx).toISOString());
});
"
```
Expected: `2026-07-20T13:00:00.000Z` — termín druhého scanu se o 3 hodiny posunul spolu s prvním (plán by byl `10:00:00.000Z` = ADD 08:00 + 2h).

- [ ] **Step 5: Commit**

```bash
git add nastroje/kontrola-na-bodu-trasy.html
git commit -m "feat: vyhodnocení simulace a zobrazení výsledků napříč celou trasou"
```

---

## Task 12: Manuální ověření celého golden path v prohlížeči (přes Browser nástroj projektu)

**Files:** žádné (jen ověření), případné drobné opravy v `nastroje/kontrola-na-bodu-trasy.html`.

- [ ] **Step 1: Spustit lokální server a projít golden path**

Spusť `python3 -m http.server 8123` v adresáři `nastroje/` a otevři `http://localhost:8123/kontrola-na-bodu-trasy.html` v Browser nástroji projektu (`preview_start` s `{url: "http://localhost:8123/kontrola-na-bodu-trasy.html"}`).

Projdi:
1. Strom vlevo — všech 6 bodů z obou úseků viditelných, správné počty kontrol u každého.
2. Klik na „1. Fyzický scan v cílové zemi" → tabulka 3 kontrol, rozbalení řádku 2 ukáže obě varianty větve Nesplněno.
3. Editace názvu VkŘ u jedné větve → reload stránky → změna zůstala (localStorage).
4. Export JSON → stáhne se soubor, otevřít a ověřit, že obsahuje upravený název z kroku 3.
5. Import JSON zpět (stejný soubor) → data se nezmění (idempotentní).
6. Záložka Test → scénář z Tasku 11 Step 2 a Step 3 (bod nastal dřív / později) → výsledky odpovídají.

- [ ] **Step 2: Zaznamenat a opravit jakékoliv nalezené problémy**

Pokud něco z kroku 1 neodpovídá popisu, over pomocí `read_console_messages` chyby v konzoli, oprav přímo v `nastroje/kontrola-na-bodu-trasy.html` a zopakuj příslušný krok.

- [ ] **Step 3: Commit (jen pokud došlo k opravám)**

```bash
git add nastroje/kontrola-na-bodu-trasy.html
git commit -m "fix: opravy nalezené při manuálním průchodu golden path"
```

(Pokud žádné opravy nebyly potřeba, tenhle krok se přeskočí — nic se nekomituje.)

---

## Task 13: Sloučit do jednoho self-contained souboru a publikovat jako Claude Artifact

**Files:**
- Create: `nastroje/build-artifact.mjs`
- Modify: `nastroje/kontrola-na-bodu-trasy.html`

- [ ] **Step 1: Napsat build skript, který sloučení provede deterministicky (ne ručním copy-paste)**

Vytvoř `nastroje/build-artifact.mjs`:

```js
import { readFileSync, writeFileSync } from 'node:fs';

const logicSrc = readFileSync(new URL('./kontrola-na-bodu-trasy.logic.mjs', import.meta.url), 'utf8').replace(/^export /gm, '');
const dataSrc = readFileSync(new URL('./kontrola-na-bodu-trasy.data.mjs', import.meta.url), 'utf8').replace(/^export /gm, '');
const htmlPath = new URL('./kontrola-na-bodu-trasy.html', import.meta.url);
const html = readFileSync(htmlPath, 'utf8');

const importBlock = `<script type="module">
import { trasa as seedTrasa, situace as seedSituace, akce as seedAkce } from './kontrola-na-bodu-trasy.data.mjs';
import * as logic from './kontrola-na-bodu-trasy.logic.mjs';
`;

if (!html.includes(importBlock)) {
  throw new Error('Import blok nenalezen v HTML — soubor se od Tasku 6 změnil, uprav tento build skript ručně.');
}

const inlined = [
  '<script>',
  '// ==== inlinováno: kontrola-na-bodu-trasy.logic.mjs ====',
  logicSrc,
  '// ==== inlinováno: kontrola-na-bodu-trasy.data.mjs ====',
  dataSrc,
  'const seedTrasa = trasa;',
  'const seedSituace = situace;',
  'const seedAkce = akce;',
].join('\n');

let output = html.replace(importBlock, inlined + '\n');
output = output.replace(/\blogic\./g, '');

if (output.includes('logic.') || output.includes("from './kontrola-na-bodu-trasy")) {
  throw new Error('Po sloučení zbyl nevyřešený import nebo "logic." odkaz — zkontroluj HTML ručně.');
}

writeFileSync(htmlPath, output);
console.log('Hotovo: artefakt sloučen do jednoho self-contained souboru.');
```

- [ ] **Step 2: Spustit build skript**

Run: `node nastroje/build-artifact.mjs`
Expected: `Hotovo: artefakt sloučen do jednoho self-contained souboru.` bez chyby. Otevři `nastroje/kontrola-na-bodu-trasy.html` a ověř, že `<script type="module">` a oba `import` řádky jsou pryč, nahrazené jedním `<script>` s inlinovaným obsahem.

- [ ] **Step 3: Ověřit, že self-contained verze funguje i přes `file://`**

Otevři `nastroje/kontrola-na-bodu-trasy.html` přímo dvojklikem (bez serveru).

Expected: Funguje stejně jako přes server v Tasku 12 — žádná chyba v konzoli, žádný `import`/CORS problém (protože `<script>` bez `type="module"` a bez externích `src` funguje i z `file://`).

- [ ] **Step 4: Commit**

```bash
git add nastroje/kontrola-na-bodu-trasy.html nastroje/build-artifact.mjs
git commit -m "refactor: sloučit logic+data moduly do jednoho self-contained HTML artefaktu"
```

- [ ] **Step 5: Publikovat jako Claude Artifact**

Použij nástroj `Artifact` s `file_path: nastroje/kontrola-na-bodu-trasy.html`, `favicon` (jedno emoji, např. 🧭), a `description` shrnující účel ("Konfigurace a test Kontrol na bodech trasy — review nástroj pro klienta a zadání pro vývojáře"). Ulož vrácenou URL a předej ji uživateli.

---

## Shrnutí pokrytí specu

| Sekce specu | Task |
|---|---|
| §2 Kde žije (self-contained, localStorage, export/import) | Task 6, 9, 13 |
| §3 Datový model (Bod→Kontrola→Větev→Situace/Závažnost/Akce, klasifikace ne šablona) | Task 1-5, 9 |
| §3.1 Rozsah v1 (jen kontroly na bodu, bez R85/R80) | Task 5 (seed vynechává R85/R80) |
| §4 Konfigurační pohled (strom, tabulka, detail) | Task 7, 8, 9 |
| §5 Simulátor | Task 10, 11 |
| §6 Seed data z reálného exportu | Task 5 |
| §7 Mimo rozsah | respektováno napříč (žádný task se toho nedotýká) |
