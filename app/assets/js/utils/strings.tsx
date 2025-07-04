export function camelCaseToSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, " $1")
    .trim()
    .split(" ")
    .join("_")
    .toLowerCase();
}

export function snakeCaseToSpacedWords(str: string, options?: { capitalizeFirst?: boolean }): string {
  let name = str.replace(/_/g, " ");

  if (options?.capitalizeFirst) {
    name = capitalize(name);
  }

  return name;
}

export function camelCaseToSpacedWords(input: string, options?: { capitalizeFirst?: boolean }) {
  let result = input.replace(/([A-Z])/g, " $1").toLowerCase();

  if (options?.capitalizeFirst) {
    result = capitalize(result);
  }

  return result;
}

export function truncateString(str: string, limit: number, suffix: string = "...") {
  if (str.length <= limit) return str;

  return str.slice(0, limit).trim() + suffix;
}

export const joinStr = (...args: string[]) => args.join("");

function capitalize(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}
