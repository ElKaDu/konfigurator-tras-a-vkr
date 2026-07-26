# Katalog polí a operátorů pro podmínky — Tracking, Zásilka, Zákazník

**Datum:** 2026-07-26
**Účel:** Referenční číselník pro vývojářský tým — kompletní seznam polí (a jejich enum hodnot), která má být možné použít v podmínkách Pravidel pro tracking (bloky „Podmínky pro příchozí záznam", „Podmínky pro historické záznamy" a „Co dále platí" — viz `specifikace-situace-akce-tracking.md` §5.5). Prototyp a jeho specifikace dnes nabízí jen malý ukázkový podvýběr (13 tracking polí, 2 pole zásilky/zákazníka) — tenhle dokument je zdrojem pravdy pro **plný rozsah**, který má produkční verze pokrýt.

**Zdroj dat:** katalog je 1:1 přepsaný z existujících, appkou dnes nepoužívaných TypeScript souborů v repu — `src/lib/vkr/fields/catalog.tracking.ts`, `src/lib/vkr/fields/catalog.shipment.ts`, `src/lib/vkr/fields/enums.ts` a `src/lib/vkr/fields/operators.ts`. Tyhle soubory jsou pozůstatkem staršího, propracovanějšího návrhu appky — zapojené jsou dnes jen do appkou nepoužívaného kódu (`src/components/vkr/*`), obsahově jsou ale platné a použitelné jako číselník. Kdykoliv se text tohoto dokumentu a zdrojový TS soubor rozejdou, je zdrojem pravdy TS soubor (je strojově přesný), tenhle dokument je jen čitelný přepis pro zadání.

---

## 1. Tracking pole (ze záznamů trackingu — schéma ParSer)

Tahle pole popisují jeden konkrétní tracking záznam (nebo agregovaně historii záznamů) zásilky. V produkční verzi mají nahradit dnešní malý katalog `TRACKING_FIELDS` (13 položek) — pokrývají celé schéma dat, které z trackingu chodí, ne jen výběr.

### 1.1 Parametry zásilky (`shipment_info`)

| Pole | Technické ID | Typ | Jednotka |
|---|---|---|---|
| Typ balení | `tracking.shipment_info.packaging_type` | text | |
| Popis balení | `tracking.shipment_info.packaging_description` | text | |
| Počet balíků | `tracking.shipment_info.package_count` | number | |
| Obsah balíku | `tracking.shipment_info.package_content` | text | |
| Pořadové číslo balíku | `tracking.shipment_info.sequence_number` | number | |
| Délka (cm) | `tracking.shipment_info.dimensions_cm_length` | number | cm |
| Šířka (cm) | `tracking.shipment_info.dimensions_cm_width` | number | cm |
| Výška (cm) | `tracking.shipment_info.dimensions_cm_height` | number | cm |
| Jednotka rozměrů (cm) | `tracking.shipment_info.dimensions_cm_unit` | text | |
| Délka (in) | `tracking.shipment_info.dimensions_in_length` | number | in |
| Šířka (in) | `tracking.shipment_info.dimensions_in_width` | number | in |
| Výška (in) | `tracking.shipment_info.dimensions_in_height` | number | in |
| Jednotka rozměrů (in) | `tracking.shipment_info.dimensions_in_unit` | text | |
| Hmotnost (kg) | `tracking.shipment_info.weight_kg_value` | number | kg |
| Jednotka hmotnosti (kg) | `tracking.shipment_info.weight_kg_unit` | text | |
| Celková hmotnost (kg) | `tracking.shipment_info.total_kg_value` | number | kg |
| Jednotka celkové hmotnosti (kg) | `tracking.shipment_info.total_kg_unit` | text | |
| Hmotnost (lb) | `tracking.shipment_info.weight_lb_value` | number | lb |
| Jednotka hmotnosti (lb) | `tracking.shipment_info.weight_lb_unit` | text | |
| Celková hmotnost (lb) | `tracking.shipment_info.total_lb_value` | number | lb |
| Jednotka celkové hmotnosti (lb) | `tracking.shipment_info.total_lb_unit` | text | |
| Místo zásilky (název) | `tracking.shipment_info.shipment_location.name` | text | |
| Místo zásilky (ulice) | `tracking.shipment_info.shipment_location.street` | text | |
| Místo zásilky (město) | `tracking.shipment_info.shipment_location.city` | text | |
| Místo zásilky (země) | `tracking.shipment_info.shipment_location.country` | text | |
| Místo zásilky (kód země) | `tracking.shipment_info.shipment_location.country_code` | text | |
| Místo zásilky (residenční) | `tracking.shipment_info.shipment_location.residential` | boolean | |
| Místo zásilky (ID místa) | `tracking.shipment_info.shipment_location.location_id` | text | |
| Místo zásilky (kraj/stát) | `tracking.shipment_info.shipment_location.state_province_code` | text | |

### 1.2 Historie změn rozměrů (`dimension_histories[]`)

| Pole | Technické ID | Typ | Jednotka |
|---|---|---|---|
| Historie rozměrů (akce) | `tracking.dimension_histories.action` | text | |
| Historie: Váha (kg) | `tracking.dimension_histories.weight_kg_value` | number | kg |
| Historie: Váha (lb) | `tracking.dimension_histories.weight_lb_value` | number | lb |
| Historie: Délka (cm) | `tracking.dimension_histories.dimensions_cm_length` | number | cm |
| Historie: Šířka (cm) | `tracking.dimension_histories.dimensions_cm_width` | number | cm |
| Historie: Výška (cm) | `tracking.dimension_histories.dimensions_cm_height` | number | cm |
| Historie: Délka (in) | `tracking.dimension_histories.dimensions_in_length` | number | in |
| Historie: Šířka (in) | `tracking.dimension_histories.dimensions_in_width` | number | in |
| Historie: Výška (in) | `tracking.dimension_histories.dimensions_in_height` | number | in |

### 1.3 Pohyb zásilky — statusy (`activities[]`, aktuální i historie)

Tohle je hlavní kategorie pro bloky „Podmínky pro příchozí záznam" a „Podmínky pro historické záznamy" — dnešní 13 polí (`derivedStatus`, `city`, `eventTime` apod.) jsou přejmenovaný podvýběr přesně z téhle skupiny.

| Pole | Technické ID | Typ |
|---|---|---|
| Stav (status) | `tracking.activities.status` | text |
| Kód stavu | `tracking.activities.status_code` | text |
| Popis stavu | `tracking.activities.status_description` | text |
| Zjednodušený popis | `tracking.activities.status_simplified_description` | text |
| Typ stavu | `tracking.activities.status_type` | text |
| Datum záznamu | `tracking.activities.status_date` | datetime |
| Čas záznamu | `tracking.activities.status_time` | text |
| Datum a čas (UTC) | `tracking.activities.status_datetime` | datetime |
| Datum a čas (lokální) | `tracking.activities.status_datetime_local` | datetime |
| Kód výjimky | `tracking.activities.exception_code` | text |
| Popis výjimky | `tracking.activities.exception_description` | text |
| Město záznamu | `tracking.activities.location_city` | text |
| Země záznamu | `tracking.activities.location_country` | text |
| Kód země záznamu | `tracking.activities.location_country_code` | text |
| PSČ záznamu | `tracking.activities.location_postal_code` | text |
| Kód provincie záznamu | `tracking.activities.location_province_code` | text |
| SLIC záznamu | `tracking.activities.location_slic` | text |
| ID místa záznamu | `tracking.activities.location_id` | text |
| Typ místa záznamu | `tracking.activities.location_type` | text |
| Ancillary akce | `tracking.activities.ancillary_action` | text |
| Popis ancillary akce | `tracking.activities.ancillary_action_description` | text |
| Ancillary důvod | `tracking.activities.ancillary_reason` | text |
| Popis ancillary důvodu | `tracking.activities.ancillary_reason_description` | text |
| Jen aktuální záznam (latest) | `tracking.activities.latest` | boolean |

### 1.4 Milníky přepravy (`milestones[]`)

| Pole | Technické ID | Typ |
|---|---|---|
| Milník: Kód | `tracking.milestones.code` | text |
| Milník: Stav | `tracking.milestones.state` | text |
| Milník: Popis | `tracking.milestones.description` | text |
| Milník: Aktuální | `tracking.milestones.current` | boolean |
| Milník: Datum a čas | `tracking.milestones.datetime` | datetime |
| Milník: Datum a čas (lokální) | `tracking.milestones.datetime_local` | datetime |
| Milník: Datum | `tracking.milestones.date` | datetime |
| Milník: Čas | `tracking.milestones.time` | text |
| Milník: Propojená aktivita | `tracking.milestones.linked_activity` | text |

### 1.5 Změny v doručení a poslední poloha (`delivery_times[]`, `last_update_location`)

| Pole | Technické ID | Typ |
|---|---|---|
| Doručení: Typ | `tracking.delivery_times.type` | text |
| Doručení: Typ času | `tracking.delivery_times.time_type` | text |
| Doručení: Datum | `tracking.delivery_times.date` | datetime |
| Doručení: Čas od | `tracking.delivery_times.time_range_start` | text |
| Doručení: Čas do | `tracking.delivery_times.time_range_end` | text |
| Doručení: Popis | `tracking.delivery_times.description` | text |
| Poslední poloha: Město | `tracking.last_update_location.city` | text |
| Poslední poloha: PSČ | `tracking.last_update_location.postal_code` | text |
| Poslední poloha: Země | `tracking.last_update_location.country` | text |
| Poslední poloha: Kód země | `tracking.last_update_location.country_code` | text |
| Poslední poloha: Název | `tracking.last_update_location.name` | text |
| Poslední poloha: ID lokace | `tracking.last_update_location.location_id` | text |
| Poslední poloha: Residenční | `tracking.last_update_location.residential` | boolean |
| Poslední poloha: SLIC | `tracking.last_update_location.slic` | text |

### 1.6 Informace o doručení (`delivery_info`)

| Pole | Technické ID | Typ | Jednotka |
|---|---|---|---|
| Doručeno: Typ lokace | `tracking.delivery_info.location_type` | text | |
| Doručeno: Převzal | `tracking.delivery_info.received_by_name` | text | |
| Doručeno: Počet pokusů | `tracking.delivery_info.delivery_attempts` | number | × |
| Doručeno: Popis lokace | `tracking.delivery_info.location_description` | text | |

### 1.7 Speciální služby (`special_services[]`)

| Pole | Technické ID | Typ |
|---|---|---|
| Spec. služby: Popis | `tracking.special_services.description` | text |
| Spec. služby: Typ | `tracking.special_services.service_type` | text |
| Spec. služby: Typ platby | `tracking.special_services.payment_type` | text |

### 1.8 Interní informace (`additional_info`)

| Pole | Technické ID | Typ |
|---|---|---|
| Přezdívka | `tracking.additional_info.nickname` | text |
| Má přidružené zásilky | `tracking.additional_info.has_associated_shipments` | boolean |
| Poznámky k zásilce | `tracking.additional_info.shipment_notes` | text |
| Identifikátor: Typ | `tracking.additional_info.identifiers.type` | text |
| Identifikátor: Hodnoty | `tracking.additional_info.identifiers.values` | text |
| Identifikátor: Kód dopravce | `tracking.additional_info.identifiers.carrier_code` | text |
| Identifikátor: Tracking číslo (unique ID) | `tracking.additional_info.identifiers.tracking_number_unique_id` | text |

### 1.9 Ostatní tracking pole

| Pole | Technické ID | Typ |
|---|---|---|
| Dostupná upozornění (kódy) | `tracking.par_ser_available_notifications` | text |
| Má fotku | `tracking.photo` | boolean |
| Vyzvednutí: Datum služby | `tracking.pickup_tracking_infos.service_date` | datetime |
| Vyzvednutí: Vytvořeno | `tracking.pickup_tracking_infos.created` | datetime |
| Vyzvednutí: Stav (zpráva) | `tracking.pickup_tracking_infos.pickup_status_message` | text |
| Vyzvednutí: On-call kód stavu | `tracking.pickup_tracking_infos.on_call_status_code` | text |

---

## 2. Pole zásilky a zákazníka (mimo tracking)

Tahle pole popisují vlastnosti samotné zásilky/objednávky a zákazníka — nezávisle na konkrétních tracking záznamech. V produkční verzi mají nahradit dnešní 2 pole v katalogu bloku „Co dále platí".

### 2.1 Základní

| Pole | Technické ID | Typ | Enum hodnoty |
|---|---|---|---|
| Fáze zásilky | `phase` | enum | Nabídka → Objednávka → Zásilka → Vyzvedávání → Průběh přepravy → Celní řízení → Doručení → Po přepravě |
| Stav zásilky | `status` | enum | Aktivní / Pozastavená / Uzavřená |
| Dopravce | `carrier` | enum | FedEx / UPS / DHL / DSV / Schenker |
| Typ služby | `service_type` | enum | Express / Economy / Pallet / Freight |
| Přiřazený operátor | `operator` | user | |
| Datum vytvoření | `created_at` | datetime | |
| Reference zásilky | `reference` | text | |
| Tracking číslo | `tracking_number` | text | |

### 2.2 Trasa

| Pole | Technické ID | Typ |
|---|---|---|
| Země odeslání | `origin_country` | text |

### 2.3 Časové milníky

| Pole | Technické ID | Typ |
|---|---|---|
| Skutečné doručení | `delivery_actual_at` | datetime |
| ETD — plánovaný odjezd | `etd` | datetime |
| ETA — plánovaný příjezd | `eta` | datetime |

### 2.4 Systémové události

Slouží i jako kotvy pro relativní časové porovnání (např. „do 2 dní od vytvoření objednávky").

| Pole | Technické ID | Typ |
|---|---|---|
| Vytvoření zásilky | `system.shipment_created_at` | datetime |
| Poslední aktualizace zásilky | `system.shipment_updated_at` | datetime |
| Vytvoření objednávky | `system.order_created_at` | datetime |

### 2.5 Stav & lifecycle

| Pole | Technické ID | Typ |
|---|---|---|
| Fáze (header) | `shipment_phase` | text |
| Stav (header) | `shipment_status` | text |
| Stav životního cyklu | `lifecycle_status` | text |

### 2.6 Platba

| Pole | Technické ID | Typ |
|---|---|---|
| Způsob platby | `payment_method` | text |
| Stav platby | `payment_status` | text |

### 2.7 Základní info (formulář zásilky)

| Pole | Technické ID | Typ | Enum hodnoty |
|---|---|---|---|
| Typ balení | `packaging_type` | enum | Dokumenty / Balíky / Palety |
| Obsah zásilky | `content_text` | text | |
| Hodnota | `shipment_value` | number (Kč) | |
| Clení v ČR | `customs_cz` | enum | Zákazník / My, přepravce / My, deklarant |
| Celní deklarant | `customs_declarant` | enum | FEDEX / UPS / DHL / TNT / DSV / SCHENKER |
| Celní faktura — kdo dodá | `customs_invoice_party` | enum | Zákazník / My |
| Instrukce od zákazníka | `instructions_from_customer` | text | |
| Reference na fakturu | `invoice_reference` | text | |
| Poskytovatel služby | `service_provider` | enum | FEDEX / UPS / DHL / TNT / DSV / SCHENKER |
| Kód služby | `service_code` | enum (s vyhledáváním) | UPS – Ground (03) / UPS – Standard (11) / FedEx International Priority / FedEx International Economy / FedEx Priority Overnight |
| Důvod vývozu | `export_reason` | enum (s vyhledáváním) | Komerční účely / Dárek / Vzorek / Vrácení / Osobní potřeby / Osobní užití / Jiný důvod |

### 2.8 Pojištění

| Pole | Technické ID | Typ |
|---|---|---|
| Pojištění (zapnuto) | `insurance_enabled` | boolean |
| Kategorie zboží (pojištění) | `insurance_goods_category` | text |
| Typ zboží (nové/použité) | `insurance_goods_condition` | text |
| Pojištění (krytí %) | `insurance_coverage` | text |
| Typ pojištění (rozsah) | `insurance_type_scope` | text |
| Pojišťovna | `insurance_company` | text |
| Typ přihlášení (pojištění) | `insurance_application_type` | text |
| Přihláška odeslána | `insurance_application_sent` | boolean |

### 2.9 Přepravce

| Pole | Technické ID | Typ |
|---|---|---|
| Požadované datum vyzvednutí | `pickup_required_date` | datetime |
| Přímý podpis | `direct_signature` | boolean |
| DDP | `ddp` | boolean |

### 2.10 Průběh přepravy

| Pole | Technické ID | Typ |
|---|---|---|
| Exportní clení — poskytnutí podkladů | `export_customs_docs_provision` | text |
| Importní clení — poskytnutí podkladů | `import_customs_docs_provision` | text |
| Datum doručení avizované přepravcem | `carrier_announced_delivery_at` | datetime |

### 2.11 Avizované datum doručení (ADD)

Náš údaj směrem k zákazníkovi — odlišný od tracking data doručení hlášeného přepravcem (2.10).

| Pole | Technické ID | Typ |
|---|---|---|
| Datum doručení avizované zákazníkovi (ADD) | `promised_delivery_at` | datetime |
| Zdroj ADD | `promised_delivery_source` | text |
| ADD — poslední změna | `promised_delivery_changed_at` | datetime |
| ADD — počet změn dnes | `promised_delivery_change_count_today` | number (×) |
| Stav dnešní kontroly doručení | `today_delivery_check_state` | text |
| Počet kontrol dnešního doručení | `today_delivery_check_count` | number (×) |

### 2.12 Zákazník

| Pole | Technické ID | Typ |
|---|---|---|
| Preference notifikace zákazníka | `customer_notification_preference` | text |
| Počet obchodních případů zákazníka | `customer.business_cases_count` | number (×) |
| Čas od poslední zakázky zákazníka | `customer.time_since_last_order` | datetime |
| Operátor zákazníka | `customer.operator` | user |

### 2.13 Adresy (čtyři role — sdílená sada polí)

Platí stejná 4 pole zvlášť pro každou ze 4 rolí: **Odesílatel** (`sender_address.*`), **Příjemce** (`receiver_address.*`), **Shipper** (`shipper_address.*`), **Delivery** (`delivery_address.*`).

| Pole (za roli) | Technické ID (vzor) | Typ |
|---|---|---|
| Typ osoby | `{role}_address.person_type` | text |
| Země | `{role}_address.country` | text |
| Město | `{role}_address.city` | text |
| PSČ | `{role}_address.zip` | text |
| Residenční adresa | `{role}_address.is_residential` | boolean |

### 2.14 Balíky

| Pole | Technické ID | Typ | Jednotka |
|---|---|---|---|
| Balík — Balení baterie | `package.battery_packaging` | text | |
| Balík — Materiál baterie | `package.battery_material` | text | |
| Balík — Nestohovatelný | `package.nonstackable` | boolean | |
| Balík — Dodatečná manipulace | `package.additional_handling` | boolean | |
| Balík — Šířka | `package.width` | number | cm/in |
| Balík — Výška | `package.height` | number | cm/in |
| Balík — Délka | `package.length` | number | cm/in |
| Balík — Hmotnost | `package.weight` | number | kg/lb |
| Balík — Deklarovaná hodnota | `package.value` | number | |
| Balík — Popis | `package.description` | text | |
| Balík — Počet balíků | `package.count` | number | |
| Balík — Pořadové číslo | `package.sequence_number` | number | |

### 2.15 Celní doklady (nahrané soubory)

| Pole | Technické ID | Typ |
|---|---|---|
| Proforma faktura | `customs_files.proforma_invoice` | document |
| Obchodní faktura | `customs_files.commercial_invoice` | document |
| Packing list | `customs_files.packing_list` | document |
| Certifikát o původu | `customs_files.certificate_of_origin` | document |
| Konosament (B/L) | `customs_files.bill_of_lading` | document |
| Dovozní licence | `customs_files.import_license` | document |
| Plná moc | `customs_files.power_of_attorney` | document |
| Jiný doklad | `customs_files.other` | document |

### 2.16 Soubory a vyzvednutí

| Pole | Technické ID | Typ |
|---|---|---|
| Soubory od zákazníka | `customer_files` | document |
| Čas vyzvednutí — od | `pickup_time_from` | datetime |
| Čas vyzvednutí — do | `pickup_time_to` | datetime |

### 2.17 Read-only enumy a odvozené hodnoty

| Pole | Technické ID | Typ | Enum hodnoty |
|---|---|---|---|
| Indikace doručení | `delivery_indication` | text | |
| Plátce cla | `duties_payer` | text | |
| Kód dopravce | `carrier_code` | enum | FDXE (FedEx Express) / FDXG (FedEx Ground) / FXSP (FedEx SmartPost) / FXFR (FedEx Freight) |
| Jednotka hmotnosti | `unit_of_weight` | text | |
| Jednotka rozměru | `unit_of_length` | text | |
| Priorita VkŘ | `vkr.priority` | text | |

---

## 3. Sdílené enumy (dropdown hodnoty používané napříč více poli)

**Poskytovatelé přepravy / celní deklarant** (`CARRIER_PROVIDERS`): FEDEX, UPS, DHL, TNT, DSV, SCHENKER.

**Kódy služby** (`SERVICE_CODES`): `03` UPS – Ground, `11` UPS – Standard, `FEDEX_INTERNATIONAL_PRIORITY` FedEx International Priority, `INTERNATIONAL_ECONOMY` FedEx International Economy, `PRIORITY_OVERNIGHT` FedEx Priority Overnight.

> Obě sady jsou zjevně jen ukázkové/neúplné (reálný číselník dopravců a kódů služeb bude větší) — pro produkci je potřeba doplnit od byznysu/klienta kompletní seznam. Mechanismus (`getEnumOptions`/`getEnumLabel` v `enums.ts`) už počítá s tím, že se hodnoty budou doplňovat.

---

## 4. Operátory podle typu pole

Dnešní prototyp nabízí jen ploché „je" / „není" pro každé pole bez ohledu na typ. Pro plný katalog výše to nedává smysl (např. „Hmotnost (kg)" potřebuje „je vyšší než", „Datum záznamu" potřebuje „je v minulosti"). Doporučené operátory podle typu pole:

| Typ pole | Dostupné operátory |
|---|---|
| **text** | je / není / obsahuje / neobsahuje / začíná na / končí na / je jedna z / není žádná z / změnilo se na / je prázdné / není prázdné |
| **number** | je / není / je vyšší než / je vyšší nebo rovno / je nižší než / je nižší nebo rovno / je mezi / je prázdné / není prázdné |
| **datetime** | je přesně / je před / je po / je v den nebo dříve / je v den nebo později / je mezi (dvěma daty) / je dnes / je v minulosti / je v budoucnosti / nastane do (N min/h/d/týdnů) / nastalo před méně než (N min/h/d/týdnů) / nebylo změněno déle než / je prázdné / není prázdné |
| **enum** | je / není / je jedna z / není žádná z / změnilo se na / změnilo se z … na … / je prázdné / není prázdné |
| **boolean** | je Ano / je Ne |
| **user** (přiřazená osoba) | obsahuje / neobsahuje / je prázdné / není prázdné |
| **document** (nahraný soubor) | je přiložen / chybí / nebyl změněn déle než |

Předvolby pro časové operátory (`nastane do` / `nastalo před méně než` / `nebylo změněno déle než`): 15 min, 1 h, 4 h, 24 h, 3 dny, 7 dní, 30 dní (plus volné zadání vlastní hodnoty).

---

## 5. Poznámka ke zdroji a dalšímu použití

Tenhle katalog **1:1 odpovídá** existujícím TypeScript souborům v repu (viz úvod) — při implementaci lze buď:

- **Znovupoužít přímo tyhle soubory** (`src/lib/vkr/fields/*`, `src/lib/vkr/types.ts` pro typ `FieldDef`) jako datový základ nové verze condition-builderů, místo psaní nového katalogu od nuly — obsahově jsou hotové, jen dnes nejsou zapojené do živého wizardu.
- Nebo je použít jen jako **referenční zdroj pravdy** při psaní nové implementace v produkčním stacku, pokud se nepřebírá kód appky 1:1.

V obou případech je třeba doplnit/ověřit s byznysem: kompletní seznam hodnot u enumů označených výše jako „zjevně jen ukázkové" (dopravci, kódy služeb, kódy dopravce) — dnešní seznamy jsou demonstrační, ne finální číselník.
