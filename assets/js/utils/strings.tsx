export function camelCaseToSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, " $1")
    .trim()
    .split(" ")
    .join("_")
    .toLowerCase();
}
