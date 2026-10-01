import i18n from "../i18n";
export const COLORS = {
  on_track: "green",
  caution: "yellow",
  off_track: "red",
  paused: "gray",
  outdated: "gray",
  pending: "gray",
} as const;

export const TITLES = {
  get on_track() {
    return i18n.t("On Track");
  },
  get caution() {
    return i18n.t("Caution");
  },
  get off_track() {
    return i18n.t("Off Track");
  },
  get paused() {
    return i18n.t("Paused");
  },
  get outdated() {
    return i18n.t("Outdated");
  },
  get pending() {
    return i18n.t("Pending");
  },
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
