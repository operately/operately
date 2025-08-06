import { DateField } from ".";

export const getCurrentYear = () => new Date().getFullYear();

export const generateQuarters = (year: number, useStartOfPeriod = false) => [
  { value: useStartOfPeriod ? `${year}-01-01T00:00:00` : `${year}-03-31T23:59:59`, label: "Q1" },
  { value: useStartOfPeriod ? `${year}-04-01T00:00:00` : `${year}-06-30T23:59:59`, label: "Q2" },
  { value: useStartOfPeriod ? `${year}-07-01T00:00:00` : `${year}-09-30T23:59:59`, label: "Q3" },
  { value: useStartOfPeriod ? `${year}-10-01T00:00:00` : `${year}-12-31T23:59:59`, label: "Q4" },
];

export const generateMonths = (year: number, useStartOfPeriod = false) => [
  { value: useStartOfPeriod ? `${year}-01-01T00:00:00` : `${year}-01-31T23:59:59`, label: "Jan", name: "January" },
  {
    value: useStartOfPeriod ? `${year}-02-01T00:00:00` : `${year}-02-${year % 4 === 0 ? "29" : "28"}T23:59:59`,
    label: "Feb",
    name: "February",
  }, // Leap year handling
  { value: useStartOfPeriod ? `${year}-03-01T00:00:00` : `${year}-03-31T23:59:59`, label: "Mar", name: "March" },
  { value: useStartOfPeriod ? `${year}-04-01T00:00:00` : `${year}-04-30T23:59:59`, label: "Apr", name: "April" },
  { value: useStartOfPeriod ? `${year}-05-01T00:00:00` : `${year}-05-31T23:59:59`, label: "May", name: "May" },
  { value: useStartOfPeriod ? `${year}-06-01T00:00:00` : `${year}-06-30T23:59:59`, label: "Jun", name: "June" },
  { value: useStartOfPeriod ? `${year}-07-01T00:00:00` : `${year}-07-31T23:59:59`, label: "Jul", name: "July" },
  { value: useStartOfPeriod ? `${year}-08-01T00:00:00` : `${year}-08-31T23:59:59`, label: "Aug", name: "August" },
  { value: useStartOfPeriod ? `${year}-09-01T00:00:00` : `${year}-09-30T23:59:59`, label: "Sep", name: "September" },
  { value: useStartOfPeriod ? `${year}-10-01T00:00:00` : `${year}-10-31T23:59:59`, label: "Oct", name: "October" },
  { value: useStartOfPeriod ? `${year}-11-01T00:00:00` : `${year}-11-30T23:59:59`, label: "Nov", name: "November" },
  { value: useStartOfPeriod ? `${year}-12-01T00:00:00` : `${year}-12-31T23:59:59`, label: "Dec", name: "December" },
];

export const getYearDate = (year: number, useStartOfPeriod = false) => {
  return useStartOfPeriod ? new Date(year, 0, 1) : new Date(year, 11, 31);
};

/**
 * Formats the date display text, omitting the year if it matches the current year
 * @param date The selected date object
 * @returns Formatted date string
 */
export function getDateWithoutCurrentYear(date: DateField.ContextualDate) {
  if (date.dateType !== "day") {
    return date.value;
  }

  const parts = date.value.split(",");

  if (parts.length === 2) {
    const currentYear = new Date().getFullYear();
    const selectedYear = parseInt(parts[1]!.trim());

    if (selectedYear === currentYear) {
      return parts[0]!.trim();
    }
  }

  return date.value;
}
