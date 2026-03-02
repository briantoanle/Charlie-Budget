export interface Holiday {
  name: string;
  /** MM-DD format */
  date: string;
  /** Categories typically impacted by this holiday */
  categories: string[];
}

const US_HOLIDAYS: Holiday[] = [
  { name: "New Year's Day", date: "01-01", categories: ["Dining", "Entertainment"] },
  { name: "Valentine's Day", date: "02-14", categories: ["Dining", "Gifts", "Entertainment"] },
  { name: "St. Patrick's Day", date: "03-17", categories: ["Dining", "Entertainment"] },
  { name: "Easter", date: "04-20", categories: ["Groceries", "Gifts"] },
  { name: "Mother's Day", date: "05-11", categories: ["Gifts", "Dining"] },
  { name: "Memorial Day", date: "05-26", categories: ["Travel", "Dining", "Entertainment"] },
  { name: "Father's Day", date: "06-15", categories: ["Gifts", "Dining"] },
  { name: "Independence Day", date: "07-04", categories: ["Dining", "Entertainment", "Groceries"] },
  { name: "Labor Day", date: "09-01", categories: ["Travel", "Dining", "Entertainment"] },
  { name: "Halloween", date: "10-31", categories: ["Costumes", "Entertainment", "Groceries"] },
  { name: "Thanksgiving", date: "11-27", categories: ["Groceries", "Travel", "Dining"] },
  { name: "Black Friday", date: "11-28", categories: ["Shopping", "Gifts"] },
  { name: "Christmas", date: "12-25", categories: ["Gifts", "Dining", "Travel", "Groceries"] },
  { name: "New Year's Eve", date: "12-31", categories: ["Dining", "Entertainment"] },
];

const CA_HOLIDAYS: Holiday[] = [
  { name: "New Year's Day", date: "01-01", categories: ["Dining", "Entertainment"] },
  { name: "Valentine's Day", date: "02-14", categories: ["Dining", "Gifts", "Entertainment"] },
  { name: "Family Day", date: "02-17", categories: ["Dining", "Entertainment"] },
  { name: "Easter", date: "04-20", categories: ["Groceries", "Gifts"] },
  { name: "Victoria Day", date: "05-19", categories: ["Travel", "Dining"] },
  { name: "Canada Day", date: "07-01", categories: ["Dining", "Entertainment", "Groceries"] },
  { name: "Civic Holiday", date: "08-04", categories: ["Travel", "Dining"] },
  { name: "Labour Day", date: "09-01", categories: ["Travel", "Dining", "Entertainment"] },
  { name: "Thanksgiving", date: "10-13", categories: ["Groceries", "Travel", "Dining"] },
  { name: "Halloween", date: "10-31", categories: ["Entertainment", "Groceries"] },
  { name: "Remembrance Day", date: "11-11", categories: [] },
  { name: "Christmas", date: "12-25", categories: ["Gifts", "Dining", "Travel", "Groceries"] },
  { name: "Boxing Day", date: "12-26", categories: ["Shopping", "Gifts"] },
  { name: "New Year's Eve", date: "12-31", categories: ["Dining", "Entertainment"] },
];

const HOLIDAYS_BY_COUNTRY: Record<string, Holiday[]> = {
  US: US_HOLIDAYS,
  CA: CA_HOLIDAYS,
};

/**
 * Get holidays coming up within the next N days for a given country.
 * Returns holidays sorted by how soon they are.
 */
export function getUpcomingHolidays(
  country: string = "US",
  daysAhead: number = 30
): (Holiday & { daysUntil: number })[] {
  const holidays = HOLIDAYS_BY_COUNTRY[country] ?? HOLIDAYS_BY_COUNTRY.US;
  const now = new Date();
  const year = now.getFullYear();

  return holidays
    .map((h) => {
      const [month, day] = h.date.split("-").map(Number);
      let holidayDate = new Date(year, month - 1, day);

      // If the holiday has already passed this year, look at next year
      if (holidayDate < now) {
        holidayDate = new Date(year + 1, month - 1, day);
      }

      const diff = Math.ceil(
        (holidayDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      return { ...h, daysUntil: diff };
    })
    .filter((h) => h.daysUntil > 0 && h.daysUntil <= daysAhead)
    .sort((a, b) => a.daysUntil - b.daysUntil);
}
