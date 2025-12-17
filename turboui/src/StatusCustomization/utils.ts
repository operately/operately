import {
  StatusAppearance,
  STATUS_APPEARANCES,
  APPEARANCE_ORDER,
} from "./StatusAppearancePicker";
import { StatusSelector } from "../StatusSelector";

/**
 * Generates a status value from a label by converting to lowercase and replacing spaces with underscores.
 * @returns The generated value (e.g., "In Progress" -> "in_progress")
 */
export function generateStatusValueFromLabel(label: string): string {
  return label.toLowerCase().replace(/\s+/g, "_");
}

export const generateId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `status-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export const getAppearanceFromStatus = (status?: Partial<StatusSelector.StatusOption>): StatusAppearance => {
  if (!status) return "gray";
  const found = APPEARANCE_ORDER.find((appearance) => {
    const preset = STATUS_APPEARANCES[appearance];
    return status.color === preset.color && status.icon === preset.icon;
  });
  return found ?? "gray";
};

export const buildStatus = (
  status?: Partial<StatusSelector.StatusOption>,
  index?: number,
  isNew?: boolean,
): StatusSelector.StatusOption => {
  const appearance = getAppearanceFromStatus(status);
  const preset = STATUS_APPEARANCES[appearance];

  return {
    id: status?.id ?? generateId(),
    value: status?.value ?? "",
    label: status?.label ?? "",
    color: preset.color,
    icon: preset.icon,
    index: status?.index ?? index ?? 0,
    isNew: status?.isNew ?? isNew ?? false,
    closed: status?.closed ?? (appearance === "green" || appearance === "red"),
  };
};
