export function assertPresent<T>(value: T | null | undefined, message?: string): T {
  if (value === null || value === undefined) {
    throw new Error(message || "Value is null or undefined");
  }

  return value;
}

export function assertEnum<T>(value: string | null | undefined, enumValuesArray: readonly T[]): T {
  if (value === null || value === undefined) {
    throw new Error(`Value is null or undefined. Expected one of: ${enumValuesArray.join(", ")}`);
  }

  if (!enumValuesArray.includes(value as T)) {
    throw new Error(`Invalid enum value: ${value}. Expected one of: ${enumValuesArray.join(", ")}`);
  }
  return value as T;
}
