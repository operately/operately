export const limitDecimals = (num: number, precision: number): number => {
  if (Number.isInteger(num)) {
    return num;
  } else {
    return parseFloat(num.toFixed(precision));
  }
};

export function findOrdinalNumberSuffix(num: number) {
  if (num % 100 >= 11 && num % 100 <= 13) {
    return "th";
  }

  switch (num % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}
