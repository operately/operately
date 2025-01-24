export const COLORS = {
  green: "rgb(22, 163, 74)",
  yellow: "rgb(250, 204, 21)",
  red: "rgb(239, 68, 68)",
  gray: "rgb(107, 114, 128)",
};

export function statusColor(status: string): string {
  if (status === "on_track") {
    return COLORS.green;
  }

  if (status === "caution") {
    return COLORS.yellow;
  }

  if (status === "issue") {
    return COLORS.red;
  }

  if (status === "paused") {
    return COLORS.gray;
  }

  if (status === "outdated") {
    return COLORS.gray;
  }

  if (status === "pending") {
    return COLORS.gray;
  }

  throw new Error(`Unknown status: ${status}`);
}
