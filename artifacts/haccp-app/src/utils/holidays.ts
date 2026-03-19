/**
 * Berechnet alle gesetzlichen Feiertage in Bayern für ein gegebenes Jahr.
 * Gibt ein Set von Datumsstrings im Format "YYYY-MM-DD" zurück.
 */
function easterSunday(year: number): Date {
  // Gaußsche Osterformel
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function fmt(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getBavarianHolidays(year: number): Set<string> {
  const easter = easterSunday(year);
  const holidays = new Set<string>();

  // Feste Feiertage
  holidays.add(`${year}-01-01`); // Neujahr
  holidays.add(`${year}-01-06`); // Heilige Drei Könige (Bayern)
  holidays.add(`${year}-05-01`); // Tag der Arbeit
  holidays.add(`${year}-08-15`); // Mariä Himmelfahrt (Bayern)
  holidays.add(`${year}-10-03`); // Tag der Deutschen Einheit
  holidays.add(`${year}-11-01`); // Allerheiligen (Bayern)
  holidays.add(`${year}-12-25`); // 1. Weihnachtstag
  holidays.add(`${year}-12-26`); // 2. Weihnachtstag

  // Osterabhängige Feiertage
  holidays.add(fmt(addDays(easter, -2)));  // Karfreitag
  holidays.add(fmt(easter));               // Ostersonntag
  holidays.add(fmt(addDays(easter, 1)));   // Ostermontag
  holidays.add(fmt(addDays(easter, 39)));  // Christi Himmelfahrt
  holidays.add(fmt(addDays(easter, 49)));  // Pfingstsonntag
  holidays.add(fmt(addDays(easter, 50)));  // Pfingstmontag
  holidays.add(fmt(addDays(easter, 60)));  // Fronleichnam (Bayern)

  return holidays;
}

export function getHolidayName(dateStr: string, year: number): string | null {
  const easter = easterSunday(year);
  const map: Record<string, string> = {
    [`${year}-01-01`]: "Neujahr",
    [`${year}-01-06`]: "Heilige Drei Könige",
    [`${year}-05-01`]: "Tag der Arbeit",
    [`${year}-08-15`]: "Mariä Himmelfahrt",
    [`${year}-10-03`]: "Tag der Deutschen Einheit",
    [`${year}-11-01`]: "Allerheiligen",
    [`${year}-12-25`]: "1. Weihnachtstag",
    [`${year}-12-26`]: "2. Weihnachtstag",
    [fmt(addDays(easter, -2))]: "Karfreitag",
    [fmt(easter)]: "Ostersonntag",
    [fmt(addDays(easter, 1))]: "Ostermontag",
    [fmt(addDays(easter, 39))]: "Christi Himmelfahrt",
    [fmt(addDays(easter, 49))]: "Pfingstsonntag",
    [fmt(addDays(easter, 50))]: "Pfingstmontag",
    [fmt(addDays(easter, 60))]: "Fronleichnam",
  };
  return map[dateStr] ?? null;
}
