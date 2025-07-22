import { DateField } from ".";

export const createContextualDate = (
  date: string | Date,
  dateType: "day" | "month" | "quarter" | "year",
): DateField.ContextualDate => {
  date = typeof date === "string" ? new Date(date) : date;
  const year = date.getFullYear();

  let value: string;

  switch (dateType) {
    case "day":
      value = date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
      break;
    case "month":
      value = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      break;
    case "quarter":
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      value = `Q${quarter} ${year}`;
      break;
    case "year":
      value = year.toString();
      break;
  }

  return {
    dateType,
    value,
    date,
  };
};
