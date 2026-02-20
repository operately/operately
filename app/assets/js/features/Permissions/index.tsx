import { match } from "ts-pattern";

export { PermissionLevels } from "./PermissionLevels";

import { AccessOptions } from "@/models/permissions";
import { PermissionLevels } from "./PermissionLevels";

export const VIEW_ACCESS = {
  value: PermissionLevels.VIEW_ACCESS,
  label: "View Access",
};

export const NO_ACCESS = {
  value: PermissionLevels.NO_ACCESS,
  label: "No Access",
};

export const COMMENT_ACCESS = {
  value: PermissionLevels.COMMENT_ACCESS,
  label: "Comment Access",
};

export const EDIT_ACCESS = {
  value: PermissionLevels.EDIT_ACCESS,
  label: "Edit Access",
};

export const FULL_ACCESS = {
  value: PermissionLevels.FULL_ACCESS,
  label: "Full Access",
};

export const PERMISSIONS_LIST = [
  { value: PermissionLevels.FULL_ACCESS, label: "Full Access" },
  { value: PermissionLevels.EDIT_ACCESS, label: "Edit Access" },
  { value: PermissionLevels.COMMENT_ACCESS, label: "Comment Access" },
  VIEW_ACCESS,
];

export function accessLevelAsString(permission: PermissionLevels) {
  return match(permission)
    .with(PermissionLevels.FULL_ACCESS, () => "Full Access")
    .with(PermissionLevels.EDIT_ACCESS, () => "Edit Access")
    .with(PermissionLevels.COMMENT_ACCESS, () => "Comment Access")
    .with(PermissionLevels.VIEW_ACCESS, () => "View Access")
    .with(PermissionLevels.NO_ACCESS, () => "No Access")
    .run();
}

export function accessLevelAsEnumValue(permission: PermissionLevels): AccessOptions {
  return match(permission)
    .with(PermissionLevels.FULL_ACCESS, () => "full_access" as const)
    .with(PermissionLevels.EDIT_ACCESS, () => "edit_access" as const)
    .with(PermissionLevels.COMMENT_ACCESS, () => "comment_access" as const)
    .with(PermissionLevels.VIEW_ACCESS, () => "view_access" as const)
    .with(PermissionLevels.NO_ACCESS, () => "no_access" as const)
    .run();
}
