---
name: Memory index
description: Project memory entry point — Core rules always applied, Memories listed for deeper drill-down.
type: preference
---

# Project Memory

## Core
Konfigurátor se jmenuje "Konfigurátor pravidel" — entity v něm = "pravidla". "Věc k řešení" (VkŘ) je výstup pravidla pro operátora (nezaměňovat).
Při editaci pravidla se používá stejný modál jako při vytvoření.
Enum pole používají {value,label} přes `enumOptions` (label se ukazuje, value se ukládá) — viz `getEnumOptions` v `src/lib/vkr/fields.ts`.
Spouštěče pravidel jsou jen 3: `schedule`, `condition_met`, `manual`.
`Schedule.times[]` je homogenní seznam pevných časů `time_of_day` (HH:MM + TZ). Žádné `relative_to_checkpoint` — offsety od splnění checkpointu se řeší přes trigger `condition_met` + podmínku `field_state_duration` nad virtuálním datetime polem `route.checkpoint_fulfilled_at` (s `Condition.routeCheckpointId`).
`Rule.skipIfPrior?: { ruleIds[], outcome: any|positive|negative }` — přeskočí dnešní opakovaný běh při outcome z některého z uvedených pravidel. Default ON u kontrol typu „8:00 → 9:00 → 10:00".
Aplikace má dvě hlavní sekce v top nav: `/` Konfigurátor pravidel a `/trasy` Trasy zásilek (`AppHeader`).
Trasy: pole `serviceTypes` u trasy = "Varianta přepravy" (Express/Economy/Pallet/Freight z `TRANSPORT_VARIANTS`), shodné s polem `service_type` zásilky. Pro každou kombinaci dopravce × varianta × cílová země smí existovat max. 1 aktivní hlavní trasa. Trasa NEMÁ PSČ — PSČ jsou na checkpointech (`appliesWhenDestZip`) nebo na `CheckpointMatch.zipMatchesDestination`/`locationPostalCode`.
PSČ scénáře jsou UI vrstva nad `Checkpoint.appliesWhenDestZip` — taby v editoru i detailu trasy.
Alternativní cesty trasy = samostatné `Route` s `parentRouteId`. Musí mít SHODNÉ pokrytí s parentem.
Checkpoint NEMÁ `required`, `timing` ani `CheckpointMatch.eventTimestamp` — definuje jen „CO se musí stát" (Match). Časový aspekt žije VÝHRADNĚ v problémových podmínkách trasy. Volitelně `Checkpoint.expectedDuration: { normal: OffsetSpec; critical?: OffsetSpec }` — sdílený slovník prahů pro `state_too_long`.
`CheckpointMatch` pokrývá VÝHRADNĚ pole `ParSerPackageActivityDetailSchema` (§5.4 reference) BEZ časových polí. Pole: `status`, `statusCode`, `statusDescription`, `simplifiedDescription` (= `status_simplified_description`), `statusType`, `exceptionCode`, `exceptionDescription`, `locationCity/Country/CountryCode/PostalCode/ProvinceCode/Slic/Id/Type`, `ancillaryAction` + `ancillaryActionDescription`, `ancillaryReason` + `ancillaryReasonDescription`, `latest` (default true), `zipMatchesDestination: { mode: "exact"|"prefix"; prefixLength? }`, `eventId`, `freeText`.
Hodnoty z trackingu nejsou enums — `observedCatalog.ts` je katalog s autocomplete; zachovat volný text.
Pole „Datum doručení avizované zákazníkovi" = `promised_delivery_at` (NÁŠ údaj). Datum hlášené dopravcem = `carrier_announced_delivery_at`.
Vyhodnocení trasy přes `Route.problems[]` (v UI „Pokročilé podmínky") s AND/OR `ProblemCondition`. Legacy varianty: `checkpoint_not_met`, `state_too_long` (deprecated v UI), `checkpoint_not_met_by`, `checkpoint_not_met_within`. Nové varianty (model, bez UI editoru): `record_older_than`, `record_before_fixed_time`, `checkpoint_repeated`, `field_value_repeated`, `field_changes_while_other_stays`, `record_count_in_window`, `checkpoint_actual_time_gap` (label-based „čas od splnění checkpointu"), `checkpoint_sequence_violated`, `last_updated` (target = shipment_record / checkpoint label / field). Helper `isLegacyCheckpointCondition` rozlišuje legacy vs. pokročilé. Pravidlo VkŘ vybere `problemTypeId` v `route_compliance` (var. 6) a větví AKCE přes `Action.runWhenRouteCondition`.
`Condition.kind: "route_compliance"` má pole `routeCheck`: 6 variant (`checkpoint_state`, `time_since_any_checkpoint`, `time_since_checkpoint`, `tracking_not_updated_for`, `general_compliance`, `advanced_problem`). Default `advanced_problem` = stávající chování (problémy / generalCheck / routeMatching). Var. 1 přejala dřívější `Condition.kind: "checkpoint"` (label + state) — samostatná položka v dropdownu „Přidat podmínku" je skrytá. Var. 1 přidává stavy `exceeded_expected_duration` (+ `checkpointDurationThreshold: normal|critical`), `fulfilled_with_exception`, `fulfilled_late`.
`CheckpointMatch.eventTime?: { op: before|after|between|equals; time: HH:MM; time2?: HH:MM; timezone: TimezoneSpec }` — volitelný filtr záznamu nad `eventTimestamp` (UI editor zatím nedoplněn, model existuje).
`Action.assignMode` rozšířen: `unassigned | shipment_operator | customer_operator | content_specialist (placeholder bez logiky) | role | specific_user | round_robin`. Sekce v editoru: „Komu se VkŘ zobrazí (volitelné)".
`Rule.activeWindow?: { businessDaysOnly: true }` — toggle „Spouštět jen v pracovní dny" na pravidle.

`TimezoneSpec` = `"destination_country" | "current_location" | "UTC" | "operator" | <IANA>`. Sdílený dropdown `src/components/ui/timezone-select.tsx` (sekce „Speciální / Zóny", tooltip u `current_location`). Používá se v Plánu spuštění i v `checkpoint_not_met_by`.
`OffsetSpec` má `dayMode: calendar|business` — `business` má smysl jen pro `days`; UI skrývá toggle u min/h.
`ActionType: "request_field_from_operator"` — VkŘ s žádostí o vyplnění pole; po vyplnění může spustit navazující pravidlo přes `condition_met`.
`Action.runAtScheduleTime?: string[]` — akci spustit jen v některých HH:MM časech Plánu spuštění (≥ 2 časy). `Action.runWhenField?: Array<{ fieldId; operator; value }>` — AND seznam dodatečných podmínek nad polem zásilky (skrytý v UI, pokud `route_compliance` používá `generalCheck`). `Action.runWhenRouteCondition` viz výše.
`RunLogEntry.triggeringEventTimestamp?` — engine ho automaticky plní z tracking eventu (žádné UI zaškrtávátko; `Action.captureTrackingEventTimestamp` neexistuje).
`TimingAnchor` (vkr/types): sdílený typ `{ kind: "shipment_created" } | { kind: "pickup_done" } | { kind: "checkpoint_fulfilled_at"; checkpointId }`.
VkŘ podmínky: pravá strana porovnání je VŽDY literál (text/number/date/enum/boolean). Volby „hodnota = jiné pole" / „% jiného pole" / „jiné datetime pole" jsou odstraněny z UI (`NUMBER_MODES` jen `absolute`, `DURATION_ANCHORS` bez `field_datetime`, `compare_field` operátor odebrán z `number`).
VkŘ pole — sekce „Tracking — …": kompletní §5 reference (shipment_info, dimension_histories, activities vč. časových polí, milestones, delivery_times, last_update_location, delivery_info, special_services, additional_info+identifiers, par_ser_available_notifications, photo, pickup_tracking_infos). Cesty kopírují schéma (např. `tracking.activities.status_code`). Plus virtuální `route.checkpoint_fulfilled_at` (datetime) pro „Splnění checkpointu" — vyžaduje `Condition.routeCheckpointId`.
`FieldDef` NEOBSAHUJE metadata (žádné `source`/`updateHint`/`mockFreshnessMin`/`mockCoverage`) — UI je nezobrazuje.
LocalStorage klíče: `routes_v12`, `vkr_rules_v12`, `problem_types_v1`. Bump verze = úplný reset seedu při dalším načtení (legacy v10/v11 vyřazené).
Katalog zásilky — sekce „Zákazník" obsahuje nová pole `customer.business_cases_count` (number), `customer.time_since_last_order` (datetime), `customer.operator` (user enum s hodnotou `current_user` = „Já").
DB seed = JEN scénář „Kontrola doručení v den D": 1 trasa `route_fedex_cz_express` (CP `cp_fx_cz_first_phys_scan`, `cp_fx_cz_dest_facility`) + 4 pravidla v E (`rule_today_8h`, `rule_today_9h`, `rule_today_cp2` s triggerem `condition_met` + `field_state_duration` nad „Splnění CP1" + `activeWindow.businessDaysOnly: true`, `rule_today_10h`). `pt_hub_stuck` na trase = OR (`checkpoint_not_met_within` CP2 do 2h po CP1 ∪ `checkpoint_actual_time_gap` CP1→CP2 > 2h).


## Memories
- [Obchodní případ — pole](mem://reference/obchodni-pripad-fields) — katalog polí entity zásilky (uložen v `docs/reference/obchodni-pripad-inputy.md`, 811 ř.)
- [Katalog VkŘ polí — moduly](mem://reference/fields-modules) — `src/lib/vkr/fields.ts` je BARREL; data v `fields/catalog.shipment.ts` (zásilka) a `fields/catalog.tracking.ts` (§5 tracking + virtuální `route.checkpoint_fulfilled_at`); helpers v `fields/enums.ts`, `fields/operators.ts`, `fields/schedule.ts`. Při editaci konkrétního pole se otevírá jen příslušný catalog.* soubor.
- [Trasy zásilek — datový model](mem://reference/trasy-model) — Route, Checkpoint, Match, ProblemCondition + napojení do podmínek pravidel VkŘ přes `route_compliance`
