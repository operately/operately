export default function plurarize(number: number, singular: string, plural: string) {
  return number === 1 ? `${number} ${singular}` : `${number} ${plural}`;
}
