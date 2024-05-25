export function camelCaseToSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, " $1")
    .trim()
    .split(" ")
    .join("_")
    .toLowerCase();
}

export function camelCaseToSpacedWords(input: string, options?: { capitalizeFirst?: boolean }) {
  let result = input.replace(/([A-Z])/g, ' $1').toLowerCase();

  if (options?.capitalizeFirst) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }

  return result;
}