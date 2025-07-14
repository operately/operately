export const getCurrentYear = () => new Date().getFullYear();

export const generateQuarters = (year = getCurrentYear()) => [
  { value: `${year}-03-31`, label: "Q1" },
  { value: `${year}-06-30`, label: "Q2" },
  { value: `${year}-09-30`, label: "Q3" },
  { value: `${year}-12-31`, label: "Q4" },
];

export const generateMonths = (year = getCurrentYear()) => [
  { value: `${year}-01-31`, label: "Jan", name: "January" },
  { value: `${year}-02-${year % 4 === 0 ? "29" : "28"}`, label: "Feb", name: "February" }, // Leap year handling
  { value: `${year}-03-31`, label: "Mar", name: "March" },
  { value: `${year}-04-30`, label: "Apr", name: "April" },
  { value: `${year}-05-31`, label: "May", name: "May" },
  { value: `${year}-06-30`, label: "Jun", name: "June" },
  { value: `${year}-07-31`, label: "Jul", name: "July" },
  { value: `${year}-08-31`, label: "Aug", name: "August" },
  { value: `${year}-09-30`, label: "Sep", name: "September" },
  { value: `${year}-10-31`, label: "Oct", name: "October" },
  { value: `${year}-11-30`, label: "Nov", name: "November" },
  { value: `${year}-12-31`, label: "Dec", name: "December" },
];
