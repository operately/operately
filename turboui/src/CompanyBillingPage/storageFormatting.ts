function roundDisplayValue(value: number): number {
  if (value >= 10) {
    return Math.round(value);
  }

  return Math.round(value * 10) / 10;
}

export function formatStorageBytes(bytes?: number | null): string {
  if (bytes == null) {
    return "Unavailable";
  }

  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  let value = bytes;
  let unit = units[0]!;

  for (const nextUnit of units) {
    unit = nextUnit;

    if (Math.abs(value) < 1024 || nextUnit === units[units.length - 1]) {
      break;
    }

    value /= 1024;
  }

  const roundedValue = unit === "B" ? Math.round(value) : roundDisplayValue(value);
  const formatter = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: Number.isInteger(roundedValue) ? 0 : 1,
    maximumFractionDigits: Number.isInteger(roundedValue) ? 0 : 1,
  });

  return `${formatter.format(roundedValue)} ${unit}`;
}
