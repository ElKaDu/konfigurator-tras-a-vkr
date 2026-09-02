/**
 * Napojení technického výsledku bodu na Situaci je natvrdo v kódu, needitovatelné v UI —
 * viz docs/superpowers/specs/2026-07-17-dnesni-doruceni-bod-design.md §8 a §6.
 * Reálná appka by tohle měla v Django adminu, ne v tomhle prototypu.
 *
 * POZOR: „Problém na trase", „Problém na trase — záznam se objevil" a „Dnešní doručení"
 * byly ze seedu odebrány. Odkazy níž tedy míří do prázdna — čte je jen KontrolyPanel
 * a DnesniDoruceniKontroly, což je dnes nezapojený kód. SituaceCard chybějící situaci
 * ošetří hláškou, nespadne.
 */
export const ROUTE_COMPLIANCE_SITUATIONS = {
  problemNaTrase: { situationId: "sit_problem_na_trase", severityId: "sev_problem_na_trase" },
  problemNaTrasePozde: { situationId: "sit_problem_na_trase_pozde", severityId: "sev_problem_na_trase_pozde" },
  zpozdenaZasilka: { situationId: "sit_zpozdena_zasilka", severityId: "sev_zpozdena_zasilka" },
  dnesniDoruceni: { situationId: "sit_dnesni_doruceni", severityId: "sev_dnesni_doruceni" },
} as const;
