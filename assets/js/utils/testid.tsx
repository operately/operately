export function createTestId(...parts: string[]): string {
  return Array.from(parts).map(sanitizeName).join("-");
}

function sanitizeName(name: string) {
  return name
    .replace(/\?/g, "")
    .replace(/[^a-z0-9-]/gi, "-")
    .toLowerCase();
}
