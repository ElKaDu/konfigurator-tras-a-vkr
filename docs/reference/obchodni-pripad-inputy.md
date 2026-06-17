# Inputy entity "Obchodní případ" — celá stránka zásilky

Dokument pokrývá všechny editovatelné inputy na stránce detailu zásilky (obchodního případu). Rozdělen do:
1. **Header** — přepínače fáze, stavu a životního cyklu + operátor
2. **Levý sidebar** — platba a stav platby
3. **Editační formulář** — hlavní pole zásilky (různé kontexty)
4. **Pravý sidebar** — věci k řešení, poznámky

---

## 1. HEADER — přepínače stavu

Tři selecty a jeden picker operátora vždy viditelné v horní části stránky.

### Dropdown: Fáze (`select`)
| Hodnota | Label |
|---|---|
| `DEMAND` | Poptávka |
| `ORDER` | Objednávka |
| `CONS` | Zásilka |
| `AFTER_SHIPPING` | Po přepravě |

### Dropdown: Stav (`select`) — hodnoty závisí na vybrané Fázi

**Fáze = Poptávka:**
| Hodnota | Label |
|---|---|
| `NEW` | Nová |
| `ASSESSMENT` | Vyhodnocení |
| `PRICING` | Nacenění |
| `WAITING_FOR_CUSTOMER` | Čeká na zákazníka |
| `DATA_COMPLETION` | Kompletování údajů |

**Fáze = Objednávka:**
| Hodnota | Label |
|---|---|
| `NEW` | Nová |
| `EVALUATION_AND_VERIFICATION` | Vyhodnocení a kontrola |
| `PROCESSING` | Zpracování |

**Fáze = Zásilka:**
| Hodnota | Label |
|---|---|
| `PICKING_UP` | Vyzvedávání |
| `PICKED_UP` | Vyzvednuto |
| `CUSTOMS_CLEARANCE_EXPORT` | Proclení (export) |
| `IN_TRANSIT_EXPORT` | V přepravě (export) |
| `CUSTOMS_CLEARANCE_IMPORT` | Proclení (import) |
| `IN_TRANSIT_IMPORT` | V přepravě (import) |
| `DELIVERY` | Doručování |
| `DELIVERED` | Doručeno |

**Fáze = Po přepravě:**
| Hodnota | Label |
|---|---|
| `INVOICING` | Fakturace |
| `CLAIMS` | Reklamace |

### Dropdown: Stav životního cyklu objednávky (`select`)
| Hodnota | Label |
|---|---|
| `ACTIVE` | Aktivní |
| `COMPLETED` | Dokončeno |
| `CANCELLED` | Zrušeno |
| `UNSUCCESSFUL` | *(bez českého labelu v mapě — zobrazuje se raw hodnota)* |

### Picker: Operátor
- **Typ:** custom menu s vyhledáváním
- Zobrazuje seznam operátorů rozdělený do skupin: „Já" / „Ostatní operátoři"
- Podporuje fulltextové vyhledávání podle jména
- Oblíbení operátoři označeni hvězdičkou

---

## 2. LEVÝ SIDEBAR — Platba

Sekce „Platba" zobrazuje informace o ceně a obsahuje editační sidebar otevíraný ikonou tužky.

### Editační sidebar „Upravit platbu"

| Název | Typ | Povinné |
|---|---|---|
| Způsob platby | select | ne |
| Stav | select | ne |

### Dropdown: Způsob platby
Některé možnosti mohou být disabled podle nastavení zákazníka.

| Hodnota | Label |
|---|---|
| `invoice_with_due_date` | Faktura se splatností |
| `summary_invoice` | Souhrnná faktura |
| `payment_card` | Platební karta |
| `online_transfer` | Online převod |
| `gopay` | GoPay |
| `paypal` | PayPal |
| `internal_delivery` | Interní doručení |

### Dropdown: Stav platby
| Hodnota | Label |
|---|---|
| `UNRESOLVED` | Nevyřešeno |
| `AWAITING_PREPAYMENT` | Čeká na zaplacení |
| `RESOLVED` | Zaplaceno |
| `PARTIALLY_REFUNDED` | Částečně vráceno |
| `REFUNDED` | Vráceno |

---

## 3. EDITAČNÍ FORMULÁŘ — Hlavní pole zásilky

Formulář je rozdělen do několika kontextů/sekcí. Pole jsou sdílená napříč kontexty, ale některá se zobrazují jen v určitém kontextu nebo při splnění podmínek.

---

## Sekce: Základní info (kontext: zákazník / operátor)

| Název | Typ | Povinné | Podmínka zobrazení | Poznámka |
|---|---|---|---|---|
| Typ balení | select | ne | — | |
| Obsah | text | ne | — | Pole se mění podle kontextu (suffix `_carrier`, `_insurance`) |
| Hodnota | number | ne | — | Pole se mění podle kontextu |
| Clení v ČR | select | ne | — | |
| Celní deklarant | select | ne | Clení v ČR = `us_declaration` | |
| Celní faktura | select | ne | — | |
| Instrukce od zákazníka | text | ne | — | |
| Reference na fakturu | text | ne | — | |
| Poskytovatel služby | select | ne | — | Oddělovač před polem |
| Kód služby | select (autocomplete) | ne | — | |
| Důvod vývozu | select (autocomplete) | ne | — | |
| Balíky | array | ne | kontext ≠ insurance | Viz sekce Balíky níže |
| Soubory od zákazníka | file | ne | kontext ≠ insurance | Přijímá `.pdf`, `.doc`; multiple |
| Pojištění | boolean | ne | kontext ≠ carrier a ≠ transport | |

### Dropdown: Typ balení
| Hodnota | Label |
|---|---|
| `DOCUMENTS` | Dokumenty |
| `PARCELS` | Balíky |
| `PALLETS` | Palety |

### Dropdown: Clení v ČR
| Hodnota | Label |
|---|---|
| `customer` | Zákazník |
| `us_supplier` | My, přepravce |
| `us_declaration` | My, deklarant |

### Dropdown: Celní deklarant
| Hodnota | Label |
|---|---|
| `FEDEX` | FEDEX |
| `UPS` | UPS |
| `DHL` | DHL |
| `TNT` | TNT |
| `DSV` | DSV |
| `SCHENKER` | SCHENKER |

### Dropdown: Celní faktura
| Hodnota | Label |
|---|---|
| `customer` | Zákazník |
| `us` | My |

### Dropdown: Poskytovatel služby
Stejné hodnoty jako Celní deklarant (CarriersProviders): FEDEX, UPS, DHL, TNT, DSV, SCHENKER

### Dropdown: Kód služby (UPS ServiceCodes + FedexServiceType — autocomplete)

**UPS:**
| Hodnota | Label |
|---|---|
| `01` | Next Day Air |
| `02` | 2nd Day Air |
| `03` | Ground |
| `07` | Worldwide Express |
| `08` | Worldwide Expedited |
| `11` | Standard |
| `12` | Three-Day Select |
| `13` | Next Day Air Saver |
| `14` | UPS Next Day Air Early |
| `54` | Worldwide Express Plus |
| `59` | Second Day Air AM |
| `65` | Saver |
| `71` | UPS Worldwide Express Freight Midday |
| `75` | UPS Heavy Goods |
| `96` | UPS Worldwide Express Freight |

**FedEx:**
| Hodnota | Label |
|---|---|
| `FEDEX_INTERNATIONAL_PRIORITY_EXPRESS` | FedEx International Priority Express |
| `INTERNATIONAL_FIRST` | International First |
| `FEDEX_INTERNATIONAL_PRIORITY` | FedEx International Priority |
| `INTERNATIONAL_ECONOMY` | International Economy |
| `FEDEX_GROUND` | FedEx Ground |
| `FIRST_OVERNIGHT` | First Overnight |
| `FEDEX_FIRST_FREIGHT` | FedEx First Freight |
| `FEDEX_1_DAY_FREIGHT` | FedEx 1 Day Freight |
| `FEDEX_2_DAY_FREIGHT` | FedEx 2 Day Freight |
| `FEDEX_3_DAY_FREIGHT` | FedEx 3 Day Freight |
| `INTERNATIONAL_PRIORITY_FREIGHT` | International Priority Freight |
| `INTERNATIONAL_ECONOMY_FREIGHT` | International Economy Freight |
| `FEDEX_INTERNATIONAL_DEFERRED_FREIGHT` | FedEx International Deferred Freight |
| `INTERNATIONAL_PRIORITY_DISTRIBUTION` | International Priority Distribution |
| `INTERNATIONAL_DISTRIBUTION_FREIGHT` | International Distribution Freight |
| `INTL_GROUND_DISTRIBUTION` | Intl. Ground Distribution |
| `GROUND_HOME_DELIVERY` | Ground Home Delivery |
| `SMART_POST` | Smart Post |
| `PRIORITY_OVERNIGHT` | Priority Overnight |
| `STANDARD_OVERNIGHT` | Standard Overnight |
| `FEDEX_2_DAY` | FedEx 2 Day |
| `FEDEX_2_DAY_AM` | FedEx 2 Day AM |
| `FEDEX_EXPRESS_SAVER` | FedEx Express Saver |
| `SAME_DAY` | Same Day |
| `SAME_DAY_CITY` | Same Day City |
| `FEDEX_ECONOMY_SELECT` | FedEx Economy Select |
| `FEDEX_PRIORITY_FREIGHT` | FedEx Priority Freight |
| `FEDEX_PRIORITY_EXPRESS_FREIGHT` | FedEx Priority Express Freight |
| `FEDEX_PRIORITY` | FedEx Priority |
| `FEDEX_PRIORITY_EXPRESS` | FedEx Priority Express |
| `FEDEX_FIRST` | FedEx First |
| `FEDEX_REGIONAL_ECONOMY_FREIGHT` | FedEx Regional Economy Freight |
| `FEDEX_REGIONAL_ECONOMY` | FedEx Regional Economy |

### Dropdown: Důvod vývozu
| Hodnota | Label |
|---|---|
| `commercial` | Kommerční účely |
| `gift` | Dárek |
| `sample` | Vzorek |
| `return` | Vrácení |
| `personal_effects` | Osobní potřeby |
| `personal_use` | Osobní užití |
| `other` | Jiný důvod |

---

## Sekce: Pojistné informace (kontext: insurance)

Zobrazí se, pokud je zaškrtnuto „Pojištění".

| Název | Typ | Povinné | Podmínka zobrazení |
|---|---|---|---|
| Kategorie zboží | select (autocomplete) | ano | Pojištění = true AND Pojistná hodnota > 9 999 |
| Typ zboží | select | ano | Pojištění = true AND Pojistná hodnota > 9 999 |
| Pojištění (krytí) | select | ano | Pojištění = true |
| Typ pojištění | select | ano | Pojištění = true |
| Pojišťovna | select | ano | Pojištění = true |
| Typ přihlášení | select | ano | Pojištění = true |
| Přihláška odeslána | boolean | ne | Pojištění = true |

### Dropdown: Kategorie zboží
| Hodnota | Label |
|---|---|
| `ARTWORKS` | Umělecká díla |
| `ATTRACTIVE_GOODS` | Atraktivní zboží |
| `BULK_AND_LIQUID` | Sypké a kapalné |
| `DONT_KNOW` | Neznámá |
| `FRAGILE_GOODS` | Křehké zboží |
| `RAW_MATERIALS` | Suroviny |
| `REGULAR_GOODS` | Běžné zboží |

### Dropdown: Typ zboží
| Hodnota | Label |
|---|---|
| `NEW` | Nové |
| `REUSED` | Použité |

### Dropdown: Pojištění (krytí)
| Hodnota | Label |
|---|---|
| `100` | 100 % |
| `110` | 110 % |
| `120` | 120 % |

### Dropdown: Typ pojištění
| Hodnota | Label |
|---|---|
| `FULL` | Plný rozsah |
| `LIMITED` | Omezený rozsah |

### Dropdown: Pojišťovna
| Hodnota | Label |
|---|---|
| `GENERALI` | Generali |
| `BYTORP` | ByTorp |

### Dropdown: Typ přihlášení
| Hodnota | Label |
|---|---|
| `SUMMARY_APPLICATION` | Souhrnné hlášení |
| `INDIVIDUAL_APPLICATION` | Individuální přihláška |
| `APPLICATION_WITH_CONFIRMATION` | Přihláška s potvrzením pojišťovny |

---

## Sekce: Přepravce / Transport (kontext: carrier / transport)

| Název | Typ | Povinné | Podmínka zobrazení |
|---|---|---|---|
| Požadované datum vyzvednutí | date | ne | — |
| Čas (od) | time | ne | — |
| Čas (do) | time | ne | — |
| Přímý podpis | boolean | ne | — |
| DDP | boolean | ne | — |

*V kontextu transport se navíc zobrazují pole pojistných informací (viz výše), s polem „Pojistná hodnota" (number, required, podmínka: Pojištění = true).*

---

## Sekce: Průběh přepravy (transport progress)

| Název | Typ | Podmínka zobrazení |
|---|---|---|
| Exportní clení - poskytnutí podkladů | select | — |
| Datum doručení avizované přepravcem | date + čas | — |
| Importní clení - poskytnutí podkladů | select | — |
| Exportní clení - dokument s instrukcemi | file | — |
| Exportní clení - VDD | file | — |
| Exportní clení - XML | file | — |
| Exportní clení - ostatní | file | — |
| Importní clení - dokument s instrukcemi | file | — |
| Importní clení - VDD | file | — |
| Importní clení - XML | file | — |
| Importní clení - ostatní | file | — |

Všechna file pole přijímají: `.pdf`, `.doc`, `.docx`, `.xls`, `.xlsx`, `.xml`, `.txt`; multiple.

### Dropdown: Exportní / Importní clení - poskytnutí podkladů
| Hodnota | Label |
|---|---|
| `AUTOMATIC` | Automaticky |
| `AUTOMATIC_EMAIL` | Automaticky e-mailem |
| `MANUAL` | Ručně |

---

## Sekce: Adresy

Čtyři typy adres: **Odesílatel** (`sender_address`), **Příjemce** (`receiver_address`), **Shipper** (`shipper_address`), **Delivery** (`delivery_address`).

Každá adresa obsahuje stejná pole:

| Název | Typ | Povinné | Podmínka zobrazení |
|---|---|---|---|
| Typ osoby | button-group | ne | — |
| Název společnosti | text | ne | Typ osoby = COMPANY |
| IČ | text | ne | Typ osoby = COMPANY |
| DIČ | text | ne | Typ osoby = COMPANY |
| Jméno | text | ne | — |
| Ulice | text | ne | — | Obsahuje Google address lookup |
| Adresa (řádek 2) | text | ne | — |
| Číslo bytu | text | ne | Typ osoby = INDIVIDUAL |
| Město | text | ne | — |
| PSČ | text | ne | — |
| Země | select (autocomplete) | ne | — | Hodnoty: všechny CountryEnum |
| Kód státu/Provincie | select (autocomplete) | ano | Země = US, CA, AU, MX, IN, AE, CN, BR |
| E-mail | text | ne | — |
| Telefon | phone | ne | — |
| Poznámka | text | ne | — |
| Residenční adresa | boolean | ne | — |

**Navíc pro `sender_address`:**
| Požadované datum vyzvednutí | date | ne | — |
| Čas (od) | time | ne | — |
| Čas (do) | time | ne | — |

**Navíc pro `receiver_address`:**
| Datum a čas doručení | date + čas | ne | — |

### Button-group: Typ osoby
| Hodnota | Label |
|---|---|
| `INDIVIDUAL` | Fyzická osoba |
| `COMPANY` | Právnická osoba |

---

## Sekce: Balíky (array field)

Max. 5 položek. Každý balík obsahuje:

| Název | Typ | Poznámka |
|---|---|---|
| Šířka | number | — |
| Výška | number | — |
| Délka | number | — |
| Váha | number | Povoleny desetinné hodnoty |
| Hodnota | number | Povoleny desetinné hodnoty |
| Popis | text | — |
| Balení baterie | select | — |
| Materiál baterie | select | — |
| Nestohovatelný | boolean | — |
| Dodatečná manipulace | boolean | — |

### Dropdown: Balení baterie
| Hodnota | Label |
|---|---|
| `null` | Žádná |
| `CONTAINED_IN_EQUIPMENT` | Obsažené v zařízení |
| `PACKED_WITH_EQUIPMENT` | Přibalené k zařízení |

### Dropdown: Materiál baterie
| Hodnota | Label |
|---|---|
| `null` | Žádný |
| `LITHIUM_METAL` | Kovové |
| `LITHIUM_ION` | Iontové |

---

## 4. PRAVÝ SIDEBAR

### Sekce: Věci k řešení

Kliknutím na `+` se otevře editační sidebar „Nová věc k řešení" / „Upravit věc k řešení".

**Formulář věci k řešení:**

| Název | Typ | Povinné | Poznámka |
|---|---|---|---|
| Název | text | ano | |
| Popis | textarea (auto-grow, 3 řádky) | ne | |
| AI prompt pro automatické vyřešení | text (FieldPathInput) | ne | Podporuje vkládání polí přes `/` |
| Kategorie | select (autocomplete) | ne | Dynamicky načítané kategorie z API |
| Operátoři | select (autocomplete, multiple, chips) | ne | Výběr kolegů/operátorů |
| Priorita | select | ne | |
| Termín splnění | date + čas | ne | |

**Dropdown: Priorita**
| Hodnota | Label |
|---|---|
| `urgent` | Urgentní |
| `high` | Vysoká |
| `medium` | Vyšší |
| `low` | Nízká |

> Sekce „Dodatečné informace" obsahuje Propojený objekt (typ + ID zásilky) — při otevření z detailu zásilky je automaticky uzamčena na danou zásilku a nelze ji měnit.

---

### Sekce: Poznámky

Rozbalovatelná sekce. Po kliknutí na `+` se zobrazí inline formulář.

| Název | Typ | Povinné | Poznámka |
|---|---|---|---|
| Text poznámky | textarea (auto-grow, 3 řádky) | ne* | *Buď text nebo soubor |
| Přiložené soubory | file (multiple, hidden input) | ne* | Přijímá jakýkoliv typ souboru |

Akce formuláře: **Přiložit soubory** (otevře file dialog) · **Uložit poznámku** · **Zrušit**

---

## 5. TRACKING MODAL — Informace o sledování zásilky

Otevírá se kliknutím na tracking číslo v headeru. Data se načítají live z ParSer API (`/par-ser/track/{shipmentId}/`). Modal obsahuje záložky podle dostupných dat balíku.

---

### Záložka: Parametry zásilky (`shipment_info` → `ParSerPackageShipmentInfoSchema`)

#### Informace o balíku

| Název | Pole | Typ |
|---|---|---|
| Typ balení | `packaging_type` | text |
| Popis balení | `packaging_description` | text |
| Počet balíků | `package_count` | number |
| Obsah balíku | `package_content` | text |
| Pořadové číslo | `sequence_number` | number |

#### Rozměry (cm)

| Název | Pole | Typ |
|---|---|---|
| Délka | `dimensions_cm_length` + `dimensions_cm_unit` | number + jednotka |
| Šířka | `dimensions_cm_width` + `dimensions_cm_unit` | number + jednotka |
| Výška | `dimensions_cm_height` + `dimensions_cm_unit` | number + jednotka |

#### Rozměry (palce)

| Název | Pole | Typ |
|---|---|---|
| Délka | `dimensions_in_length` + `dimensions_in_unit` | number + jednotka |
| Šířka | `dimensions_in_width` + `dimensions_in_unit` | number + jednotka |
| Výška | `dimensions_in_height` + `dimensions_in_unit` | number + jednotka |

#### Hmotnost (kg)

| Název | Pole | Typ |
|---|---|---|
| Hmotnost | `weight_kg_value` + `weight_kg_unit` | number + jednotka |
| Celková hmotnost | `total_kg_value` + `total_kg_unit` | number + jednotka |

#### Hmotnost (lb)

| Název | Pole | Typ |
|---|---|---|
| Hmotnost (lb) | `weight_lb_value` + `weight_lb_unit` | number + jednotka |
| Celková hmotnost (lb) | `total_lb_value` + `total_lb_unit` | number + jednotka |

#### Místo zásilky (`shipment_location` → `ParSerPackageLocationSchema`)

| Název | Pole | Typ |
|---|---|---|
| Název | `shipment_location.name` | text |
| Ulice | `shipment_location.street` | text |
| Město | `shipment_location.city` | text |
| Země | `shipment_location.country` | text |
| Kód země | `shipment_location.country_code` | text |
| Rezidenční adresa | `shipment_location.residential` | boolean |
| ID místa | `shipment_location.location_id` | text |
| Kód státu/provincie | `shipment_location.state_province_code` | text |

---

### Záložka: Historie změn (`dimension_histories` → `ParSerPackageDimensionHistorySchema`)

Tabulka se sloupci (hodnoty se mění podle akce):

| Název | Pole | Typ |
|---|---|---|
| Váha (kg) | `weight_kg_value` | number |
| Váha (lbs) | `weight_lb_value` | number |
| Délka (cm) | `dimensions_cm_length` | number |
| Šířka (cm) | `dimensions_cm_width` | number |
| Výška (cm) | `dimensions_cm_height` | number |
| Délka (in) | `dimensions_in_length` | number |
| Šířka (in) | `dimensions_in_width` | number |
| Výška (in) | `dimensions_in_height` | number |

---

### Záložka: Historie změn (`dimension_histories` → `ParSerPackageDimensionHistorySchema`)

Tabulka s historií přeměření zásilky dopravcem. Rozdělena na dvě části: **Původní záznam** (action = `CREATED`) a **Změny** (action = `UPDATED`).

| Název | Pole | Typ |
|---|---|---|
| Akce | `action` | enum `DimensionHistoryAction` |
| Váha (kg) | `weight_kg_value` | number |
| Váha (lbs) | `weight_lb_value` | number |
| Délka (cm) | `dimensions_cm_length` | number |
| Šířka (cm) | `dimensions_cm_width` | number |
| Výška (cm) | `dimensions_cm_height` | number |
| Délka (in) | `dimensions_in_length` | number |
| Šířka (in) | `dimensions_in_width` | number |
| Výška (in) | `dimensions_in_height` | number |

**Enum: `DimensionHistoryAction`**
| Hodnota | Význam |
|---|---|
| `created` | Původní záznam |
| `updated` | Změna |

---

### Záložka: Pohyb zásilky — statusy (`activities` → `ParSerPackageActivityDetailSchema`)

#### Aktuální stav (nejnovější aktivita, `latest = true`)

| Název | Pole | Typ |
|---|---|---|
| Stav | `status` | text |
| Kód stavu | `status_code` | text |
| Popis stavu | `status_description` | text |
| Zjednodušený popis | `status_simplified_description` | text |
| Datum | `status_date` | date |
| Čas | `status_time` | time |
| Datum a čas (UTC) | `status_datetime` | datetime |
| Datum a čas (lokální) | `status_datetime_local` | datetime |
| Typ | `status_type` | text |
| Kód výjimky | `exception_code` | text |
| Popis výjimky | `exception_description` | text |
| Město | `location_city` | text |
| Země | `location_country` | text |
| Kód země | `location_country_code` | text |
| PSČ místa | `location_postal_code` | text |
| Kód provincie | `location_province_code` | text |
| SLIC | `location_slic` | text |
| ID místa | `location_id` | text |
| Typ místa | `location_type` | text |

*Doplňující detaily (`ancillary_details` → `ParSerTrackingAncillaryDetailSchema`): Akce, Popis akce, Důvod, Popis důvodu*

#### Historie aktivit (tabulka — stejná pole bez `latest`)

Stejné schéma jako výše, zobrazeno jako tabulka pro všechny předchozí aktivity (kde `latest = false`).

---

### Záložka: Milníky přepravy (`milestones` → `ParSerPackageMilestoneSchema`)

Tabulka:

| Název | Pole | Typ |
|---|---|---|
| Kód | `code` | text |
| Stav | `state` | text |
| Popis | `description` | text |
| Aktuální | `current` | boolean |
| Datum a čas | `datetime` | datetime |
| Datum a čas (lokální) | `datetime_local` | datetime |
| Datum | `date` | date |
| Čas | `time` | time |
| Propojená aktivita | `linked_activity` | text |

---

### Záložka: Změny v doručení a přesměrování (`delivery_times` → `ParSerPackageDeliveryTimeSchema`)

Obsahuje tabulku časů doručení + sekci Poslední známá poloha.

#### Časy doručení (tabulka)

| Název | Pole | Typ |
|---|---|---|
| Typ | `type` | text |
| Typ času | `time_type` | text |
| Datum | `date` | date |
| Čas od | `time_range_start` | time |
| Čas do | `time_range_end` | time |
| Popis | `description` | text |

#### Poslední známá poloha (`last_update_location` → `ParSerPackageLocationSchema`)

| Název | Pole | Typ |
|---|---|---|
| Město | `city` | text |
| PSČ | `postal_code` | text |
| Země | `country` | text |
| Kód země | `country_code` | text |
| Název | `name` | text |
| ID lokace | `location_id` | text |
| Rezidenční oblast | `residential` | boolean |
| SLIC | `slic` | text |

---

### Záložka: Informace o doručení (`delivery_info` → `ParSerPackageDeliveryInfoSchema`)

Tabulka:

| Název | Pole | Typ |
|---|---|---|
| Typ lokace | `location_type` | text |
| Převzal | `received_by_name` | text |
| Počet pokusů o doručení | `delivery_attempts` | number |
| Popis lokace | `location_description` | text |
| Místo doručení | `delivery_location` (ParSerPackageLocationSchema) | objekt adresy |
| Možnosti způsobilosti | `eligibility_options` | pole |

---

### Záložka: Speciální služby (`special_services` → `ParSerPackageSpecialServiceSchema`)

Tabulka:

| Název | Pole | Typ |
|---|---|---|
| Popis | `description` | text |
| Typ služby | `service_type` | text (volný text od dopravce) |
| Typ platby | `payment_type` | text (volný text od dopravce) |

---

### Záložka: Doby doručení (`delivery_times` → `ParSerPackageDeliveryTimeSchema`)

Tabulka s přehledem časových oken doručení:

| Název sloupce | Pole | Typ |
|---|---|---|
| Datum | `date` | date |
| Časový rozsah - začátek | `time_range_start` | time |
| Časový rozsah - konec | `time_range_end` | time |
| Typ | `type` | text (volný text od dopravce) |
| Typ času | `time_type` | text (volný text od dopravce) |
| Popis | `description` | text |

---

### Záložka: Interní informace (`additional_info` → `ParSerPackageAdditionalInfoSchema`)

| Název | Pole | Typ |
|---|---|---|
| Přezdívka | `nickname` | text |
| Má přidružené zásilky | `has_associated_shipments` | boolean |
| Poznámky k zásilce | `shipment_notes` | text |
| Identifikátory | `identifiers` (ParSerPackageIdentifierSchema[]) | pole |

Identifikátory (`ParSerPackageIdentifierSchema`): `type`, `values[]`, `carrier_code`, `tracking_number_unique_id`

---

### Záložka: Dostupná upozornění (`par_ser_available_notifications`)

Pole stringů — každý string je kód dostupné e-mailové notifikace pro FedEx balík.

---

### Záložka: Aktuální informace

Zobrazuje aktuální aktivitu (`latest = true`) — stejná pole jako záložka „Pohyb zásilky — statusy".

---

### Záložka: Fotka

Zobrazuje fotografii zásilky (`photo` — base64 nebo URL, pole na `ParSerPackage`).

---

### Záložka: Informace o vyzvednutí (`pickup_tracking_infos` → `ParSerInfoPickupTrackingSchema`)

Tabulka s UPS pickup trackingem (na úrovni `ParSerInfo`, nikoli balíku):

| Název sloupce | Pole | Typ |
|---|---|---|
| Datum služby | `service_date` | date |
| Vytvořeno | `created` | datetime |
| Zpráva o stavu vyzvednutí | `pickup_status_message` | text |
| Kód stavu na vyžádání | `on_call_status_code` | text |

---

## 6. POLE NA ZÁSILCE — Read-only zobrazená data (ne editovatelné inputy)

Tato pole jsou zobrazena na stránce, ale nejde o editovatelné inputy. Jsou relevantní pro pochopení datového modelu.

### Header zásilky — read-only hodnoty

| Název | Zdroj | Poznámka |
|---|---|---|
| `service_type` | `par_ser_info.service_type` | Viz enum níže |
| `tracking_number` | `par_ser_info.tracking_number` | Zásilkové číslo |
| `created` | `created` na Shipment | Datum vytvoření zásilky |

**Enum: `ServicesTypes`**
| Hodnota | Label |
|---|---|
| `UNKNOWN` | Neznámý |
| `EXPRESS` | Express |
| `ECONOMY` | Economy |

**Enum: `DeliveryIndication`** (na `ParSerPackage` — stav doručení balíku)
| Hodnota | Label |
|---|---|
| `on_time` | Včas |
| `delayed` | Zpožděno |

**Enum: `ActionChoices`** (v záložce Historie změn trackingu — typ akce v historii)
| Hodnota | Label |
|---|---|
| `0` | Vytvořit |
| `1` | Upravit |
| `2` | Smazat |

**Enum: `ParSerDutiesPayer`** (plátce cla — pole `duties_payer` na `ParSerInfo`)
| Hodnota | Label |
|---|---|
| `SHIPPER` | Odesílatel |
| `RECIPIENT` | Příjemce |

**Enum: `PackageMeasureWeightUnits`** (jednotka váhy — pole `unit_of_weight` na `ParSerInfo`)
| Hodnota |
|---|
| `LBS` |
| `KGS` |
| `OZS` |

**Enum: `PackageDimensionUnitOfMeasurement`** (jednotka délky — pole `unit_of_length` na `ParSerInfo`)
| Hodnota |
|---|
| `IN` |
| `CM` |

**Enum: `FedExCarrierCode`** (pole `carrier_code` na `ParSerInfo`)
| Hodnota | Bedeutung |
|---|---|
| `FDXE` | FedEx Express |
| `FDXG` | FedEx Ground |

### Časové milníky (z ShipmentTransportInfo / ShippingOrder)

| Název | Pole v schématu | Poznámka |
|---|---|---|
| ETD | `etd` | Estimated Time of Departure — z `par_ser_info` resp. `transport_info` |
| ETA | `eta` | Estimated Time of Arrival — z `par_ser_info` resp. `transport_info` |
| Požadované datum vyzvednutí | `shippingorder.requested_pickup_range_start` | Editovatelné — viz sekce Přepravce |
| Datum doručení | `shippingorder.delivery_date` | Editovatelné — viz sekce Přepravce |

### Agregované parametry zásilky (z `parts_details`)

| Název | Pole | Typ |
|---|---|---|
| Celková váha | `total_weight` | float |
| Hrubá váha | `gross_weight` | float |
| Čistá váha | `net_weight` | float |
| Objem | `volume` | float |
| Počet kusů | `item_count` | int |

### Finance (z ShippingOrder)

| Název | Pole | Typ |
|---|---|---|
| Cena zákazníkovi (s DPH) | `shippingorder.exposed_to_customer_price.amount` | decimal |
| Cena zákazníkovi (bez DPH) | `shippingorder.exposed_to_customer_price_without_VAT.amount` | decimal |
| Pojistná hodnota | `shippingorder.shipment_value_insurance.amount` | decimal (editovatelné v kontextu insurance) |
| Hodnota zásilky (pro přepravce) | `shippingorder.shipment_value_carrier.amount` | decimal (editovatelné v kontextu carrier) |
