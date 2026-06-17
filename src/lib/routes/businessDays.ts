/**
 * Pomocná utilita pro práci s pracovními dny.
 * Pro mock — bez reálné databáze svátků; klient ji bude napojovat později.
 */

/** Profil pracovního týdne (převzato z `vkr/types.ts`). */
export type WorkweekProfile = "western" | "israel" | "gulf";

/** Den v týdnu, kdy je v daném profilu volno (0 = neděle … 6 = sobota). */
const WEEKEND: Record<WorkweekProfile, number[]> = {
  western: [0, 6],
  israel: [5, 6],   // pátek + sobota
  gulf: [5, 6],     // pátek + sobota (zjednodušení)
};

/** Mock seznam svátků (ISO date) pro pár zemí — pro pozdější napojení nahradit reálným zdrojem. */
const MOCK_HOLIDAYS: Record<string, string[]> = {
  CZ: ["2026-01-01", "2026-04-03", "2026-04-06", "2026-05-01", "2026-05-08", "2026-07-05", "2026-07-06", "2026-09-28", "2026-10-28", "2026-11-17", "2026-12-24", "2026-12-25", "2026-12-26"],
  DE: ["2026-01-01", "2026-04-03", "2026-04-06", "2026-05-01", "2026-05-14", "2026-05-25", "2026-10-03", "2026-12-25", "2026-12-26"],
  "DE-BY": ["2026-01-06", "2026-06-04", "2026-08-15", "2026-11-01"],
  "DE-BW": ["2026-01-06", "2026-06-04", "2026-11-01"],
  US: ["2026-01-01", "2026-01-19", "2026-02-16", "2026-05-25", "2026-07-04", "2026-09-07", "2026-11-26", "2026-12-25"],
  IL: ["2026-04-01", "2026-04-22", "2026-05-21", "2026-09-21", "2026-09-30"],
};

export function isHoliday(date: Date, country?: string, subdivision?: string): boolean {
  const iso = date.toISOString().slice(0, 10);
  if (country && MOCK_HOLIDAYS[country]?.includes(iso)) return true;
  if (subdivision && MOCK_HOLIDAYS[subdivision]?.includes(iso)) return true;
  return false;
}

export function isWeekend(date: Date, profile: WorkweekProfile = "western"): boolean {
  return WEEKEND[profile].includes(date.getDay());
}

export interface BusinessDayOpts {
  country?: string;
  subdivision?: string;
  workweek?: WorkweekProfile;
}

/** Přičte n pracovních dnů (záporné = odečte). */
export function addBusinessDays(start: Date, n: number, opts: BusinessDayOpts = {}): Date {
  const profile = opts.workweek ?? "western";
  const dir = n >= 0 ? 1 : -1;
  let remaining = Math.abs(n);
  const d = new Date(start);
  while (remaining > 0) {
    d.setDate(d.getDate() + dir);
    if (!isWeekend(d, profile) && !isHoliday(d, opts.country, opts.subdivision)) {
      remaining--;
    }
  }
  return d;
}

/** Vrátí počet pracovních dnů mezi dvěma daty (exkluzivně začátek, inkluzivně konec). */
export function businessDaysBetween(from: Date, to: Date, opts: BusinessDayOpts = {}): number {
  const profile = opts.workweek ?? "western";
  const dir = from <= to ? 1 : -1;
  let count = 0;
  const d = new Date(from);
  while ((dir === 1 ? d < to : d > to)) {
    d.setDate(d.getDate() + dir);
    if (!isWeekend(d, profile) && !isHoliday(d, opts.country, opts.subdivision)) {
      count++;
    }
  }
  return count * dir;
}

export const WORKWEEK_LABELS: Record<WorkweekProfile, string> = {
  western: "Po–Pá (běžný)",
  israel: "Ne–Čt (Izrael)",
  gulf: "Ne–Čt (Gulf / muslimské země)",
};
