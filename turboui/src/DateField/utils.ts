export const getCurrentYear = () => new Date().getFullYear();

export const generateQuarters = (year = getCurrentYear(), useStartOfPeriod = false) => [
  { value: useStartOfPeriod ? `${year}-01-01` : `${year}-03-31`, label: "Q1" },
  { value: useStartOfPeriod ? `${year}-04-01` : `${year}-06-30`, label: "Q2" },
  { value: useStartOfPeriod ? `${year}-07-01` : `${year}-09-30`, label: "Q3" },
  { value: useStartOfPeriod ? `${year}-10-01` : `${year}-12-31`, label: "Q4" },
];

export const generateMonths = (year = getCurrentYear(), useStartOfPeriod = false) => [
  { value: useStartOfPeriod ? `${year}-01-01` : `${year}-01-31`, label: "Jan", name: "January" },
  { value: useStartOfPeriod ? `${year}-02-01` : `${year}-02-${year % 4 === 0 ? "29" : "28"}`, label: "Feb", name: "February" }, // Leap year handling
  { value: useStartOfPeriod ? `${year}-03-01` : `${year}-03-31`, label: "Mar", name: "March" },
  { value: useStartOfPeriod ? `${year}-04-01` : `${year}-04-30`, label: "Apr", name: "April" },
  { value: useStartOfPeriod ? `${year}-05-01` : `${year}-05-31`, label: "May", name: "May" },
  { value: useStartOfPeriod ? `${year}-06-01` : `${year}-06-30`, label: "Jun", name: "June" },
  { value: useStartOfPeriod ? `${year}-07-01` : `${year}-07-31`, label: "Jul", name: "July" },
  { value: useStartOfPeriod ? `${year}-08-01` : `${year}-08-31`, label: "Aug", name: "August" },
  { value: useStartOfPeriod ? `${year}-09-01` : `${year}-09-30`, label: "Sep", name: "September" },
  { value: useStartOfPeriod ? `${year}-10-01` : `${year}-10-31`, label: "Oct", name: "October" },
  { value: useStartOfPeriod ? `${year}-11-01` : `${year}-11-30`, label: "Nov", name: "November" },
  { value: useStartOfPeriod ? `${year}-12-01` : `${year}-12-31`, label: "Dec", name: "December" },
];

export const getYearDate = (year: number, useStartOfPeriod = false) => {
  return useStartOfPeriod ? new Date(year, 0, 1) : new Date(year, 11, 31);
};
