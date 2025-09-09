const COLORS = {
  green: "rgb(22, 163, 74)",
  yellow: "rgb(250, 204, 21)",
  red: "rgb(239, 68, 68)",
  gray: "rgb(107, 114, 128)",
};

export function statusColor(status: string): string {
  switch (status) {
    case "on_track":
      return COLORS.green;
    case "caution":
      return COLORS.yellow;
    case "off_track":
      return COLORS.red;
    case "paused":
    case "outdated":
    case "pending":
      return COLORS.gray;
    default:
      throw new Error(`Unknown status: ${status}`);
  }
}
