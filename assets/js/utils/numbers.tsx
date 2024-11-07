export const limitDecimals = (num: number, precision: number): number => {
  if (Number.isInteger(num)) {
    return num;
  } else {
    return parseFloat(num.toFixed(precision));
  }
};
