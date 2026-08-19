/** Sort items into a stored id order (template milestones and tasks). Items missing from `ids` stay at the end. */
export function orderByIds<T extends { id: string }>(items: T[], ids: string[]): T[] {
  const positions = new Map(ids.map((id, index) => [id, index]));
  return items
    .slice()
    .sort(
      (left, right) =>
        (positions.get(left.id) ?? Number.MAX_SAFE_INTEGER) - (positions.get(right.id) ?? Number.MAX_SAFE_INTEGER),
    );
}
