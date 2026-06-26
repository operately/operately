export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || "";
}
