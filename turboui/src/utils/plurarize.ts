export function plurarizeWord(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural;
}

export function plurarize(count: number, singular: string, plural: string) {
  return `${count} ${plurarizeWord(count, singular, plural)}`;
}
