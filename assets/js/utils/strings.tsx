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
    name =  name.charAt(0).toUpperCase() + name.slice(1);
  }

  return name;
}

export function camelCaseToSpacedWords(input: string, options?: { capitalizeFirst?: boolean }) {
  let result = input.replace(/([A-Z])/g, ' $1').toLowerCase();

  if (options?.capitalizeFirst) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }

  return result;
}

export function truncateString(str: string, limit: number, suffix: string = "...") {
  if(str.length <= limit) return str;
  
  return str.slice(0, limit).trim() + suffix;
}