interface Quarter {
  index: number;
  year: number;
}

export function fromString(str: string): Quarter {
  const year = parseInt(str.split(" ")![1]!);
  const index = parseInt(str.split(" ")![0]!.replace("Q", "")) - 1;

  return { index, year };
}

export function toString(quarter: Quarter) {
  return `Q${quarter.index + 1} ${quarter.year}`;
}

export function next(quarter: Quarter) {
  return addQuarters(quarter, 1);
}

export function prev(quarter: Quarter) {
  return addQuarters(quarter, -1);
}

function addQuarters(quarter: Quarter, quarters: number) {
  const absolute = quarter.year * 4 + quarter.index + quarters;

  const year = Math.floor(absolute / 4);
  const index = absolute % 4;

  return { index, year };
}
