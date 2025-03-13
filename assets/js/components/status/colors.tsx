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
  on_track: "green-200",
  caution: "yellow-200",
  concern: "yellow-200",
  issue: "red-200",
  paused: "gray-200",
  outdated: "gray-200",
  pending: "gray-200",
};

function statusColorClass(status: string, opts?: { customShade?: number }): string {
  const colorClass = bgColorMap[status];
  if (!colorClass) {
    throw new Error(`Unknown status: ${status}`);
  }

  if (opts?.customShade) {
    return colorClass.replace("200", opts.customShade.toString());
  }

  return colorClass;
}

export function statusTextColorClass(status: string, opts?: { customShade?: number }): string {
  const color = statusColorClass(status, opts);
  return "text-" + color;
}

export function statusBGColorClass(status: string, opts?: { customShade?: number }): string {
  const color = statusColorClass(status, opts);
  return "bg-" + color;
}
