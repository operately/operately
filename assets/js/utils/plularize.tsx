export default function plularize(number: number, singular: string, plural: string) {
  return number === 1 ? `${number} ${singular}` : `${number} ${plural}`;
}
