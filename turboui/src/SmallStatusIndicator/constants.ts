export const COLORS = {
  on_track: "green",
  caution: "yellow",
  off_track: "red",
  paused: "gray",
  outdated: "gray",
  pending: "gray",
} as const;

export const TITLES = {
  on_track: "On Track",
  caution: "Caution",
  off_track: "Off Track",
  paused: "Paused",
  outdated: "Outdated",
  pending: "Pending",
} as const;

export const CIRCLE_BORDER_COLORS = {
  green: "border-green-600",
  yellow: "border-yellow-400",
  red: "border-red-500",
  gray: "border-gray-500",
} as const;

export const CIRCLE_BACKGROUND_COLORS = {
  green: "bg-green-600",
  yellow: "bg-yellow-400",
  red: "bg-red-500",
  gray: "bg-gray-500",
} as const;

export type SmallStatusIndicatorStatus = keyof typeof TITLES;
