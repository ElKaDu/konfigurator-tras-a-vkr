export interface TrackingFieldDef {
  value: string;
  label: string;
  group: string;
}

export const TRACKING_FIELDS: TrackingFieldDef[] = [
  { value: "eventType", label: "Typ záznamu (eventType)", group: "Typ a status" },
  { value: "derivedStatus", label: "Odvozený status", group: "Typ a status" },
  { value: "derivedStatusCode", label: "Kód odvozeného statusu", group: "Typ a status" },
  { value: "eventDescription", label: "Popis události", group: "Typ a status" },
  { value: "exceptionCode", label: "Kód výjimky", group: "Výjimka" },
  { value: "exceptionDescription", label: "Popis výjimky", group: "Výjimka" },
  { value: "locationType", label: "Typ místa", group: "Lokace" },
  { value: "locationId", label: "ID místa", group: "Lokace" },
  { value: "city", label: "Město", group: "Lokace" },
  { value: "countryCode", label: "Kód země", group: "Lokace" },
  { value: "postalCode", label: "PSČ", group: "Lokace" },
  { value: "deliveryAttempts", label: "Počet pokusů o doručení", group: "Doručení" },
  { value: "eventTime", label: "Čas záznamu (eventTime)", group: "Čas" },
];

/** Podmnožina polí, u kterých dává smysl "stejná hodnota se opakuje" (režim Opakuje se). */
export const REPEATABLE_FIELDS: TrackingFieldDef[] = TRACKING_FIELDS.filter((f) =>
  ["locationId", "city", "countryCode"].includes(f.value)
);

export const TRACKING_OPERATORS = ["je jedním z", "není žádným z", "je", "není", "obsahuje", "je větší než", "je menší nebo rovno"];

/** Zjednodušené operátory pro "Podmínky současného záznamu" → režim Shoda hodnoty. */
export const SIMPLE_OPERATORS = ["je", "není"];
