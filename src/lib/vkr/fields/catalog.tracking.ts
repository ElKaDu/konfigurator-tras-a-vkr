import type { FieldDef } from "../types";

/**
 * Tracking pole — §5 reference (TRACKING MODAL).
 * Cesty kopírují schéma ParSerPackage* (např. `tracking.activities.status_code`).
 */
export const TRACKING_FIELDS: FieldDef[] = [
  // Virtuální pole: timestamp tracking eventu, který jako první splnil match daného checkpointu trasy.
  // V editoru podmínky vyžaduje druhý select na konkrétní CP trasy (Condition.routeCheckpointId).
  { id: "route.checkpoint_fulfilled_at", label: "Splnění checkpointu", type: "datetime", category: "Trasa — checkpointy" },


  // §5.1 Parametry zásilky (`shipment_info` → ParSerPackageShipmentInfoSchema)
  { id: "tracking.shipment_info.packaging_type", label: "Tracking — Typ balení", type: "text", category: "Tracking — parametry zásilky" },
  { id: "tracking.shipment_info.packaging_description", label: "Tracking — Popis balení", type: "text", category: "Tracking — parametry zásilky" },
  { id: "tracking.shipment_info.package_count", label: "Tracking — Počet balíků", type: "number", category: "Tracking — parametry zásilky" },
  { id: "tracking.shipment_info.package_content", label: "Tracking — Obsah balíku", type: "text", category: "Tracking — parametry zásilky" },
  { id: "tracking.shipment_info.sequence_number", label: "Tracking — Pořadové číslo balíku", type: "number", category: "Tracking — parametry zásilky" },
  { id: "tracking.shipment_info.dimensions_cm_length", label: "Tracking — Délka (cm)", type: "number", category: "Tracking — parametry zásilky", unit: "cm" },
  { id: "tracking.shipment_info.dimensions_cm_width", label: "Tracking — Šířka (cm)", type: "number", category: "Tracking — parametry zásilky", unit: "cm" },
  { id: "tracking.shipment_info.dimensions_cm_height", label: "Tracking — Výška (cm)", type: "number", category: "Tracking — parametry zásilky", unit: "cm" },
  { id: "tracking.shipment_info.dimensions_cm_unit", label: "Tracking — Jednotka rozměrů (cm)", type: "text", category: "Tracking — parametry zásilky" },
  { id: "tracking.shipment_info.dimensions_in_length", label: "Tracking — Délka (in)", type: "number", category: "Tracking — parametry zásilky", unit: "in" },
  { id: "tracking.shipment_info.dimensions_in_width", label: "Tracking — Šířka (in)", type: "number", category: "Tracking — parametry zásilky", unit: "in" },
  { id: "tracking.shipment_info.dimensions_in_height", label: "Tracking — Výška (in)", type: "number", category: "Tracking — parametry zásilky", unit: "in" },
  { id: "tracking.shipment_info.dimensions_in_unit", label: "Tracking — Jednotka rozměrů (in)", type: "text", category: "Tracking — parametry zásilky" },
  { id: "tracking.shipment_info.weight_kg_value", label: "Tracking — Hmotnost (kg)", type: "number", category: "Tracking — parametry zásilky", unit: "kg" },
  { id: "tracking.shipment_info.weight_kg_unit", label: "Tracking — Jednotka hmotnosti (kg)", type: "text", category: "Tracking — parametry zásilky" },
  { id: "tracking.shipment_info.total_kg_value", label: "Tracking — Celková hmotnost (kg)", type: "number", category: "Tracking — parametry zásilky", unit: "kg" },
  { id: "tracking.shipment_info.total_kg_unit", label: "Tracking — Jednotka celkové hmotnosti (kg)", type: "text", category: "Tracking — parametry zásilky" },
  { id: "tracking.shipment_info.weight_lb_value", label: "Tracking — Hmotnost (lb)", type: "number", category: "Tracking — parametry zásilky", unit: "lb" },
  { id: "tracking.shipment_info.weight_lb_unit", label: "Tracking — Jednotka hmotnosti (lb)", type: "text", category: "Tracking — parametry zásilky" },
  { id: "tracking.shipment_info.total_lb_value", label: "Tracking — Celková hmotnost (lb)", type: "number", category: "Tracking — parametry zásilky", unit: "lb" },
  { id: "tracking.shipment_info.total_lb_unit", label: "Tracking — Jednotka celkové hmotnosti (lb)", type: "text", category: "Tracking — parametry zásilky" },
  { id: "tracking.shipment_info.shipment_location.name", label: "Tracking — Místo zásilky (název)", type: "text", category: "Tracking — parametry zásilky" },
  { id: "tracking.shipment_info.shipment_location.street", label: "Tracking — Místo zásilky (ulice)", type: "text", category: "Tracking — parametry zásilky" },
  { id: "tracking.shipment_info.shipment_location.city", label: "Tracking — Místo zásilky (město)", type: "text", category: "Tracking — parametry zásilky" },
  { id: "tracking.shipment_info.shipment_location.country", label: "Tracking — Místo zásilky (země)", type: "text", category: "Tracking — parametry zásilky" },
  { id: "tracking.shipment_info.shipment_location.country_code", label: "Tracking — Místo zásilky (kód země)", type: "text", category: "Tracking — parametry zásilky" },
  { id: "tracking.shipment_info.shipment_location.residential", label: "Tracking — Místo zásilky (residenční)", type: "boolean", category: "Tracking — parametry zásilky" },
  { id: "tracking.shipment_info.shipment_location.location_id", label: "Tracking — Místo zásilky (ID místa)", type: "text", category: "Tracking — parametry zásilky" },
  { id: "tracking.shipment_info.shipment_location.state_province_code", label: "Tracking — Místo zásilky (kraj/stát)", type: "text", category: "Tracking — parametry zásilky" },

  // §5.2/5.3 Historie změn rozměrů (`dimension_histories[]`)
  { id: "tracking.dimension_histories.action", label: "Tracking — Historie rozměrů (akce)", type: "text", category: "Tracking — historie rozměrů" },
  { id: "tracking.dimension_histories.weight_kg_value", label: "Tracking — Historie: Váha (kg)", type: "number", category: "Tracking — historie rozměrů", unit: "kg" },
  { id: "tracking.dimension_histories.weight_lb_value", label: "Tracking — Historie: Váha (lb)", type: "number", category: "Tracking — historie rozměrů", unit: "lb" },
  { id: "tracking.dimension_histories.dimensions_cm_length", label: "Tracking — Historie: Délka (cm)", type: "number", category: "Tracking — historie rozměrů", unit: "cm" },
  { id: "tracking.dimension_histories.dimensions_cm_width", label: "Tracking — Historie: Šířka (cm)", type: "number", category: "Tracking — historie rozměrů", unit: "cm" },
  { id: "tracking.dimension_histories.dimensions_cm_height", label: "Tracking — Historie: Výška (cm)", type: "number", category: "Tracking — historie rozměrů", unit: "cm" },
  { id: "tracking.dimension_histories.dimensions_in_length", label: "Tracking — Historie: Délka (in)", type: "number", category: "Tracking — historie rozměrů", unit: "in" },
  { id: "tracking.dimension_histories.dimensions_in_width", label: "Tracking — Historie: Šířka (in)", type: "number", category: "Tracking — historie rozměrů", unit: "in" },
  { id: "tracking.dimension_histories.dimensions_in_height", label: "Tracking — Historie: Výška (in)", type: "number", category: "Tracking — historie rozměrů", unit: "in" },

  // §5.4 Pohyb zásilky — statusy (`activities[]`, aktuální + historie)
  { id: "tracking.activities.status", label: "Tracking — Stav (status)", type: "text", category: "Tracking — pohyb zásilky" },
  { id: "tracking.activities.status_code", label: "Tracking — Kód stavu", type: "text", category: "Tracking — pohyb zásilky" },
  { id: "tracking.activities.status_description", label: "Tracking — Popis stavu", type: "text", category: "Tracking — pohyb zásilky" },
  { id: "tracking.activities.status_simplified_description", label: "Tracking — Zjednodušený popis", type: "text", category: "Tracking — pohyb zásilky" },
  { id: "tracking.activities.status_type", label: "Tracking — Typ stavu", type: "text", category: "Tracking — pohyb zásilky" },
  { id: "tracking.activities.status_date", label: "Tracking — Datum záznamu", type: "datetime", category: "Tracking — pohyb zásilky" },
  { id: "tracking.activities.status_time", label: "Tracking — Čas záznamu", type: "text", category: "Tracking — pohyb zásilky" },
  { id: "tracking.activities.status_datetime", label: "Tracking — Datum a čas (UTC)", type: "datetime", category: "Tracking — pohyb zásilky" },
  { id: "tracking.activities.status_datetime_local", label: "Tracking — Datum a čas (lokální)", type: "datetime", category: "Tracking — pohyb zásilky" },
  { id: "tracking.activities.exception_code", label: "Tracking — Kód výjimky", type: "text", category: "Tracking — pohyb zásilky" },
  { id: "tracking.activities.exception_description", label: "Tracking — Popis výjimky", type: "text", category: "Tracking — pohyb zásilky" },
  { id: "tracking.activities.location_city", label: "Tracking — Město záznamu", type: "text", category: "Tracking — pohyb zásilky" },
  { id: "tracking.activities.location_country", label: "Tracking — Země záznamu", type: "text", category: "Tracking — pohyb zásilky" },
  { id: "tracking.activities.location_country_code", label: "Tracking — Kód země záznamu", type: "text", category: "Tracking — pohyb zásilky" },
  { id: "tracking.activities.location_postal_code", label: "Tracking — PSČ záznamu", type: "text", category: "Tracking — pohyb zásilky" },
  { id: "tracking.activities.location_province_code", label: "Tracking — Kód provincie záznamu", type: "text", category: "Tracking — pohyb zásilky" },
  { id: "tracking.activities.location_slic", label: "Tracking — SLIC záznamu", type: "text", category: "Tracking — pohyb zásilky" },
  { id: "tracking.activities.location_id", label: "Tracking — ID místa záznamu", type: "text", category: "Tracking — pohyb zásilky" },
  { id: "tracking.activities.location_type", label: "Tracking — Typ místa záznamu", type: "text", category: "Tracking — pohyb zásilky" },
  { id: "tracking.activities.ancillary_action", label: "Tracking — Ancillary akce", type: "text", category: "Tracking — pohyb zásilky" },
  { id: "tracking.activities.ancillary_action_description", label: "Tracking — Popis ancillary akce", type: "text", category: "Tracking — pohyb zásilky" },
  { id: "tracking.activities.ancillary_reason", label: "Tracking — Ancillary důvod", type: "text", category: "Tracking — pohyb zásilky" },
  { id: "tracking.activities.ancillary_reason_description", label: "Tracking — Popis ancillary důvodu", type: "text", category: "Tracking — pohyb zásilky" },
  { id: "tracking.activities.latest", label: "Tracking — Jen aktuální záznam (latest)", type: "boolean", category: "Tracking — pohyb zásilky" },

  // §5.5 Milníky přepravy (`milestones[]`)
  { id: "tracking.milestones.code", label: "Tracking — Milník: Kód", type: "text", category: "Tracking — milníky" },
  { id: "tracking.milestones.state", label: "Tracking — Milník: Stav", type: "text", category: "Tracking — milníky" },
  { id: "tracking.milestones.description", label: "Tracking — Milník: Popis", type: "text", category: "Tracking — milníky" },
  { id: "tracking.milestones.current", label: "Tracking — Milník: Aktuální", type: "boolean", category: "Tracking — milníky" },
  { id: "tracking.milestones.datetime", label: "Tracking — Milník: Datum a čas", type: "datetime", category: "Tracking — milníky" },
  { id: "tracking.milestones.datetime_local", label: "Tracking — Milník: Datum a čas (lokální)", type: "datetime", category: "Tracking — milníky" },
  { id: "tracking.milestones.date", label: "Tracking — Milník: Datum", type: "datetime", category: "Tracking — milníky" },
  { id: "tracking.milestones.time", label: "Tracking — Milník: Čas", type: "text", category: "Tracking — milníky" },
  { id: "tracking.milestones.linked_activity", label: "Tracking — Milník: Propojená aktivita", type: "text", category: "Tracking — milníky" },

  // §5.6 Změny v doručení a přesměrování (`delivery_times[]` + `last_update_location`)
  { id: "tracking.delivery_times.type", label: "Tracking — Doručení: Typ", type: "text", category: "Tracking — doručení" },
  { id: "tracking.delivery_times.time_type", label: "Tracking — Doručení: Typ času", type: "text", category: "Tracking — doručení" },
  { id: "tracking.delivery_times.date", label: "Tracking — Doručení: Datum", type: "datetime", category: "Tracking — doručení" },
  { id: "tracking.delivery_times.time_range_start", label: "Tracking — Doručení: Čas od", type: "text", category: "Tracking — doručení" },
  { id: "tracking.delivery_times.time_range_end", label: "Tracking — Doručení: Čas do", type: "text", category: "Tracking — doručení" },
  { id: "tracking.delivery_times.description", label: "Tracking — Doručení: Popis", type: "text", category: "Tracking — doručení" },
  { id: "tracking.last_update_location.city", label: "Tracking — Poslední poloha: Město", type: "text", category: "Tracking — doručení" },
  { id: "tracking.last_update_location.postal_code", label: "Tracking — Poslední poloha: PSČ", type: "text", category: "Tracking — doručení" },
  { id: "tracking.last_update_location.country", label: "Tracking — Poslední poloha: Země", type: "text", category: "Tracking — doručení" },
  { id: "tracking.last_update_location.country_code", label: "Tracking — Poslední poloha: Kód země", type: "text", category: "Tracking — doručení" },
  { id: "tracking.last_update_location.name", label: "Tracking — Poslední poloha: Název", type: "text", category: "Tracking — doručení" },
  { id: "tracking.last_update_location.location_id", label: "Tracking — Poslední poloha: ID lokace", type: "text", category: "Tracking — doručení" },
  { id: "tracking.last_update_location.residential", label: "Tracking — Poslední poloha: Residenční", type: "boolean", category: "Tracking — doručení" },
  { id: "tracking.last_update_location.slic", label: "Tracking — Poslední poloha: SLIC", type: "text", category: "Tracking — doručení" },

  // §5.7 Informace o doručení (`delivery_info`)
  { id: "tracking.delivery_info.location_type", label: "Tracking — Doručeno: Typ lokace", type: "text", category: "Tracking — info doručení" },
  { id: "tracking.delivery_info.received_by_name", label: "Tracking — Doručeno: Převzal", type: "text", category: "Tracking — info doručení" },
  { id: "tracking.delivery_info.delivery_attempts", label: "Tracking — Doručeno: Počet pokusů", type: "number", category: "Tracking — info doručení", unit: "×" },
  { id: "tracking.delivery_info.location_description", label: "Tracking — Doručeno: Popis lokace", type: "text", category: "Tracking — info doručení" },

  // §5.8 Speciální služby (`special_services[]`)
  { id: "tracking.special_services.description", label: "Tracking — Spec. služby: Popis", type: "text", category: "Tracking — speciální služby" },
  { id: "tracking.special_services.service_type", label: "Tracking — Spec. služby: Typ", type: "text", category: "Tracking — speciální služby" },
  { id: "tracking.special_services.payment_type", label: "Tracking — Spec. služby: Typ platby", type: "text", category: "Tracking — speciální služby" },

  // §5.10 Interní informace (`additional_info`)
  { id: "tracking.additional_info.nickname", label: "Tracking — Přezdívka", type: "text", category: "Tracking — interní" },
  { id: "tracking.additional_info.has_associated_shipments", label: "Tracking — Má přidružené zásilky", type: "boolean", category: "Tracking — interní" },
  { id: "tracking.additional_info.shipment_notes", label: "Tracking — Poznámky k zásilce", type: "text", category: "Tracking — interní" },
  { id: "tracking.additional_info.identifiers.type", label: "Tracking — Identifikátor: Typ", type: "text", category: "Tracking — interní" },
  { id: "tracking.additional_info.identifiers.values", label: "Tracking — Identifikátor: Hodnoty", type: "text", category: "Tracking — interní" },
  { id: "tracking.additional_info.identifiers.carrier_code", label: "Tracking — Identifikátor: Kód dopravce", type: "text", category: "Tracking — interní" },
  { id: "tracking.additional_info.identifiers.tracking_number_unique_id", label: "Tracking — Identifikátor: Tracking číslo (unique ID)", type: "text", category: "Tracking — interní" },

  // §5.11 Dostupná upozornění
  { id: "tracking.par_ser_available_notifications", label: "Tracking — Dostupná upozornění (kódy)", type: "text", category: "Tracking — upozornění" },

  // §5.13 Fotka
  { id: "tracking.photo", label: "Tracking — Má fotku", type: "boolean", category: "Tracking — fotka" },

  // §5.14 Pickup tracking (`pickup_tracking_infos[]`)
  { id: "tracking.pickup_tracking_infos.service_date", label: "Tracking — Vyzvednutí: Datum služby", type: "datetime", category: "Tracking — vyzvednutí" },
  { id: "tracking.pickup_tracking_infos.created", label: "Tracking — Vyzvednutí: Vytvořeno", type: "datetime", category: "Tracking — vyzvednutí" },
  { id: "tracking.pickup_tracking_infos.pickup_status_message", label: "Tracking — Vyzvednutí: Stav (zpráva)", type: "text", category: "Tracking — vyzvednutí" },
  { id: "tracking.pickup_tracking_infos.on_call_status_code", label: "Tracking — Vyzvednutí: On-call kód stavu", type: "text", category: "Tracking — vyzvednutí" },
];
