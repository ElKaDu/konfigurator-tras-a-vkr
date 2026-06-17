import type { FieldDef } from "../types";
import { CARRIER_PROVIDERS, SERVICE_CODES } from "./enums";

/**
 * Pole zásilky (mimo Tracking §5).
 * Obsahuje: Základní, Trasu, Časové milníky, Systémové události, Stav & lifecycle,
 * Platbu, Základní info, Pojištění, Přepravce, Průběh přepravy, Avizované doručení,
 * Zákazníka, Adresy (4 role), Balíky, Celní doklady, Soubory, Vyzvednutí, Read-only enumy, VkŘ.
 */
export const SHIPMENT_FIELDS: FieldDef[] = [
  // Základní
  { id: "phase", label: "Fáze zásilky", type: "enum", category: "Základní", enumValues: ["Nabídka", "Objednávka", "Zásilka", "Vyzvedávání", "Průběh přepravy", "Celní řízení", "Doručení", "Po přepravě"] },
  { id: "status", label: "Stav zásilky", type: "enum", category: "Základní", enumValues: ["Aktivní", "Pozastavená", "Uzavřená"] },
  { id: "carrier", label: "Dopravce", type: "enum", category: "Základní", enumValues: ["FedEx", "UPS", "DHL", "DSV", "Schenker"] },
  { id: "service_type", label: "Typ služby", type: "enum", category: "Základní", enumValues: ["Express", "Economy", "Pallet", "Freight"] },
  { id: "operator", label: "Přiřazený operátor", type: "user", category: "Základní" },
  { id: "created_at", label: "Datum vytvoření", type: "datetime", category: "Základní" },
  { id: "reference", label: "Reference zásilky", type: "text", category: "Základní" },
  { id: "tracking_number", label: "Tracking číslo", type: "text", category: "Základní" },

  // Trasa
  { id: "origin_country", label: "Země odeslání", type: "text", category: "Trasa" },

  // Časové milníky (zachované — používají se v podmínkách pravidel)
  { id: "delivery_actual_at", label: "Skutečné doručení", type: "datetime", category: "Časové milníky" },
  { id: "etd", label: "ETD — plánovaný odjezd", type: "datetime", category: "Časové milníky" },
  { id: "eta", label: "ETA — plánovaný příjezd", type: "datetime", category: "Časové milníky" },

  // Systémové události (kotvy pro relativní porovnání i samostatné podmínky)
  { id: "system.shipment_created_at", label: "Vytvoření zásilky", type: "datetime", category: "Systémové události" },
  { id: "system.shipment_updated_at", label: "Poslední aktualizace zásilky", type: "datetime", category: "Systémové události" },
  { id: "system.order_created_at", label: "Vytvoření objednávky", type: "datetime", category: "Systémové události" },

  // ============================================================
  //  Stav & lifecycle (header zásilky)
  // ============================================================
  { id: "shipment_phase", label: "Fáze (header)", type: "text", category: "Stav & lifecycle" },
  { id: "shipment_status", label: "Stav (header)", type: "text", category: "Stav & lifecycle" },
  { id: "lifecycle_status", label: "Stav životního cyklu", type: "text", category: "Stav & lifecycle" },

  // ============================================================
  //  Platba
  // ============================================================
  { id: "payment_method", label: "Způsob platby", type: "text", category: "Platba" },
  { id: "payment_status", label: "Stav platby", type: "text", category: "Platba" },

  // ============================================================
  //  Základní info (formulář zásilky)
  // ============================================================
  { id: "packaging_type", label: "Typ balení", type: "enum", category: "Základní info",
    enumOptions: [
      { value: "DOCUMENTS", label: "Dokumenty" },
      { value: "PARCELS", label: "Balíky" },
      { value: "PALLETS", label: "Palety" },
    ] },
  { id: "content_text", label: "Obsah zásilky", type: "text", category: "Základní info" },
  { id: "shipment_value", label: "Hodnota", type: "number", category: "Základní info", unit: "Kč" },
  { id: "customs_cz", label: "Clení v ČR", type: "enum", category: "Základní info",
    enumOptions: [
      { value: "customer", label: "Zákazník" },
      { value: "us_supplier", label: "My, přepravce" },
      { value: "us_declaration", label: "My, deklarant" },
    ] },
  { id: "customs_declarant", label: "Celní deklarant", type: "enum", category: "Základní info", enumOptions: CARRIER_PROVIDERS },
  { id: "customs_invoice_party", label: "Celní faktura — kdo dodá", type: "enum", category: "Základní info",
    enumOptions: [
      { value: "customer", label: "Zákazník" },
      { value: "us", label: "My" },
    ] },
  { id: "instructions_from_customer", label: "Instrukce od zákazníka", type: "text", category: "Základní info" },
  { id: "invoice_reference", label: "Reference na fakturu", type: "text", category: "Základní info" },
  { id: "service_provider", label: "Poskytovatel služby", type: "enum", category: "Základní info", enumOptions: CARRIER_PROVIDERS },
  { id: "service_code", label: "Kód služby", type: "enum", category: "Základní info", autocomplete: true, enumOptions: SERVICE_CODES },
  { id: "export_reason", label: "Důvod vývozu", type: "enum", category: "Základní info", autocomplete: true,
    enumOptions: [
      { value: "commercial", label: "Komerční účely" },
      { value: "gift", label: "Dárek" },
      { value: "sample", label: "Vzorek" },
      { value: "return", label: "Vrácení" },
      { value: "personal_effects", label: "Osobní potřeby" },
      { value: "personal_use", label: "Osobní užití" },
      { value: "other", label: "Jiný důvod" },
    ] },

  // ============================================================
  //  Pojistné informace
  // ============================================================
  { id: "insurance_enabled", label: "Pojištění (zapnuto)", type: "boolean", category: "Pojištění (detail)" },
  { id: "insurance_goods_category", label: "Kategorie zboží (pojištění)", type: "text", category: "Pojištění (detail)" },
  { id: "insurance_goods_condition", label: "Typ zboží (nové/použité)", type: "text", category: "Pojištění (detail)" },
  { id: "insurance_coverage", label: "Pojištění (krytí %)", type: "text", category: "Pojištění (detail)" },
  { id: "insurance_type_scope", label: "Typ pojištění (rozsah)", type: "text", category: "Pojištění (detail)" },
  { id: "insurance_company", label: "Pojišťovna", type: "text", category: "Pojištění (detail)" },
  { id: "insurance_application_type", label: "Typ přihlášení (pojištění)", type: "text", category: "Pojištění (detail)" },
  { id: "insurance_application_sent", label: "Přihláška odeslána", type: "boolean", category: "Pojištění (detail)" },

  // ============================================================
  //  Přepravce / Transport
  // ============================================================
  { id: "pickup_required_date", label: "Požadované datum vyzvednutí", type: "datetime", category: "Přepravce" },
  { id: "direct_signature", label: "Přímý podpis", type: "boolean", category: "Přepravce" },
  { id: "ddp", label: "DDP", type: "boolean", category: "Přepravce" },

  // ============================================================
  //  Průběh přepravy
  // ============================================================
  { id: "export_customs_docs_provision", label: "Exportní clení — poskytnutí podkladů", type: "text", category: "Průběh přepravy" },
  { id: "import_customs_docs_provision", label: "Importní clení — poskytnutí podkladů", type: "text", category: "Průběh přepravy" },
  { id: "carrier_announced_delivery_at", label: "Datum doručení avizované přepravcem", type: "datetime", category: "Průběh přepravy" },

  // ============================================================
  //  Avizované datum doručení (ADD) — náš údaj směrem k zákazníkovi
  // ============================================================
  { id: "promised_delivery_at", label: "Datum doručení avizované zákazníkovi (ADD)", type: "datetime", category: "Avizované doručení" },
  { id: "promised_delivery_source", label: "Zdroj ADD", type: "text", category: "Avizované doručení" },
  { id: "promised_delivery_changed_at", label: "ADD — poslední změna", type: "datetime", category: "Avizované doručení" },
  { id: "promised_delivery_change_count_today", label: "ADD — počet změn dnes", type: "number", category: "Avizované doručení", unit: "×" },
  { id: "today_delivery_check_state", label: "Stav dnešní kontroly doručení", type: "text", category: "Avizované doručení" },
  { id: "today_delivery_check_count", label: "Počet kontrol dnešního doručení", type: "number", category: "Avizované doručení", unit: "×" },

  // ============================================================
  //  Komunikační preference zákazníka
  // ============================================================
  { id: "customer_notification_preference", label: "Preference notifikace zákazníka", type: "text", category: "Zákazník" },

  // Nová pole sekce „Zákazník" — počet OP / čas od poslední zakázky / operátor zákazníka
  { id: "customer.business_cases_count", label: "Počet obchodních případů zákazníka", type: "number", category: "Zákazník", unit: "×" },
  { id: "customer.time_since_last_order", label: "Čas od poslední zakázky zákazníka", type: "datetime", category: "Zákazník" },
  { id: "customer.operator", label: "Operátor zákazníka", type: "user", category: "Zákazník" },


  // ============================================================
  //  Adresy (čtyři role — sdílené enum)
  // ============================================================
  ...(["sender", "receiver", "shipper", "delivery"] as const).flatMap((role) => {
    const labels: Record<string, string> = { sender: "Odesílatel", receiver: "Příjemce", shipper: "Shipper", delivery: "Delivery" };
    const cat = `Adresa — ${labels[role]}`;
    return [
      { id: `${role}_address.person_type`, label: `${labels[role]} – Typ osoby`, type: "text" as const, category: cat },
      { id: `${role}_address.country`, label: `${labels[role]} – Země`, type: "text" as const, category: cat },
      { id: `${role}_address.city`, label: `${labels[role]} – Město`, type: "text" as const, category: cat },
      { id: `${role}_address.zip`, label: `${labels[role]} – PSČ`, type: "text" as const, category: cat },
      { id: `${role}_address.is_residential`, label: `${labels[role]} – Residenční adresa`, type: "boolean" as const, category: cat },
    ];
  }),

  // ============================================================
  //  Balíky
  // ============================================================
  { id: "package.battery_packaging", label: "Balík — Balení baterie", type: "text", category: "Balíky" },
  { id: "package.battery_material", label: "Balík — Materiál baterie", type: "text", category: "Balíky" },
  { id: "package.nonstackable", label: "Balík — Nestohovatelný", type: "boolean", category: "Balíky" },
  { id: "package.additional_handling", label: "Balík — Dodatečná manipulace", type: "boolean", category: "Balíky" },
  // Per-balík rozměry / hmotnost / hodnota / popis (§5b reference)
  { id: "package.width", label: "Balík — Šířka", type: "number", category: "Balíky", unit: "cm/in" },
  { id: "package.height", label: "Balík — Výška", type: "number", category: "Balíky", unit: "cm/in" },
  { id: "package.length", label: "Balík — Délka", type: "number", category: "Balíky", unit: "cm/in" },
  { id: "package.weight", label: "Balík — Hmotnost", type: "number", category: "Balíky", unit: "kg/lb" },
  { id: "package.value", label: "Balík — Deklarovaná hodnota", type: "number", category: "Balíky" },
  { id: "package.description", label: "Balík — Popis", type: "text", category: "Balíky" },
  { id: "package.count", label: "Balík — Počet balíků", type: "number", category: "Balíky" },
  { id: "package.sequence_number", label: "Balík — Pořadové číslo", type: "number", category: "Balíky" },

  // ============================================================
  //  Celní doklady (§5b — 8 typů uploadu)
  // ============================================================
  { id: "customs_files.proforma_invoice", label: "Celní doklad — Proforma faktura", type: "document", category: "Celní doklady" },
  { id: "customs_files.commercial_invoice", label: "Celní doklad — Obchodní faktura", type: "document", category: "Celní doklady" },
  { id: "customs_files.packing_list", label: "Celní doklad — Packing list", type: "document", category: "Celní doklady" },
  { id: "customs_files.certificate_of_origin", label: "Celní doklad — Certifikát o původu", type: "document", category: "Celní doklady" },
  { id: "customs_files.bill_of_lading", label: "Celní doklad — Konosament (B/L)", type: "document", category: "Celní doklady" },
  { id: "customs_files.import_license", label: "Celní doklad — Dovozní licence", type: "document", category: "Celní doklady" },
  { id: "customs_files.power_of_attorney", label: "Celní doklad — Plná moc", type: "document", category: "Celní doklady" },
  { id: "customs_files.other", label: "Celní doklad — Jiný", type: "document", category: "Celní doklady" },

  // ============================================================
  //  Customer files + pickup time
  // ============================================================
  { id: "customer_files", label: "Soubory od zákazníka", type: "document", category: "Soubory" },
  { id: "pickup_time_from", label: "Čas vyzvednutí — od", type: "datetime", category: "Vyzvednutí" },
  { id: "pickup_time_to", label: "Čas vyzvednutí — do", type: "datetime", category: "Vyzvednutí" },

  // ============================================================
  //  Read-only enumy (§5f reference)
  // ============================================================
  { id: "delivery_indication", label: "Indikace doručení", type: "text", category: "Doručení" },
  { id: "duties_payer", label: "Plátce cla", type: "text", category: "Celní informace" },
  { id: "carrier_code", label: "Kód dopravce", type: "enum", category: "Základní",
    enumOptions: [
      { value: "FDXE", label: "FedEx Express" },
      { value: "FDXG", label: "FedEx Ground" },
      { value: "FXSP", label: "FedEx SmartPost" },
      { value: "FXFR", label: "FedEx Freight" },
    ] },
  { id: "unit_of_weight", label: "Jednotka hmotnosti", type: "text", category: "Parametry" },
  { id: "unit_of_length", label: "Jednotka rozměru", type: "text", category: "Parametry" },

  // ============================================================
  //  VkŘ (sebevztažné)
  // ============================================================
  { id: "vkr.priority", label: "Priorita VkŘ", type: "text", category: "Věci k řešení" },
];
