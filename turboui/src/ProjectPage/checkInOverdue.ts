import type { ProjectPage } from ".";

export function isCheckInOverdue(
  nextCheckInScheduledAt: Date | null | undefined,
  state: ProjectPage.State["state"],
  today = new Date(),
): boolean {
  if (state !== "active" || !nextCheckInScheduledAt) return false;

  const dueDay = startOfDay(nextCheckInScheduledAt);
  const currentDay = startOfDay(today);

  return dueDay.getTime() < currentDay.getTime();
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
