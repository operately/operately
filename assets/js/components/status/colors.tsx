const COLORS = {
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

  if (status === "concern") {
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

const bgColorMap: Record<string, string> = {
  "on_track": "bg-green-200",
  "caution": "bg-yellow-200",
  "concern": "bg-yellow-200",
  "issue":   "bg-red-200",
  "paused":  "bg-gray-200",
  "outdated": "bg-gray-200",
  "pending": "bg-gray-200",
};


export function statusBGColorClass(status: string): string {
  const colorClass = bgColorMap[status];
  if (!colorClass) {
    throw new Error(`Unknown status: ${status}`);
  }
  return colorClass;
}
