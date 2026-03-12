import fs from "node:fs";

export function printJson(value: unknown, compact: boolean): void {
  const payload = compact ? JSON.stringify(value) : JSON.stringify(value, null, 2);
  console.log(payload);
}

export function writeJsonFile(path: string, value: unknown, compact: boolean): void {
  const payload = compact ? JSON.stringify(value) : JSON.stringify(value, null, 2);
  fs.writeFileSync(path, payload + "\n");
}

export function printError(message: string): void {
  console.error(message);
}
