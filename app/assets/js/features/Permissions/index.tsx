import { match } from "ts-pattern";

export { PermissionLevels } from "./PermissionLevels";

import { AccessOptions, AccessOptionsInt } from "@/models/permissions";
import { PermissionLevels } from "./PermissionLevels";
import i18n from "@/i18n";

export const VIEW_ACCESS = {
  value: PermissionLevels.VIEW_ACCESS,
  get label() {
    return i18n.t("View Access");
  },
};

export const NO_ACCESS = {
  value: PermissionLevels.NO_ACCESS,
  get label() {
    return i18n.t("No Access");
  },
};

export const COMMENT_ACCESS = {
  value: PermissionLevels.COMMENT_ACCESS,
  get label() {
    return i18n.t("Comment Access");
  },
};

export const EDIT_ACCESS = {
  value: PermissionLevels.EDIT_ACCESS,
  get label() {
    return i18n.t("Edit Access");
  },
};

export const FULL_ACCESS = {
  value: PermissionLevels.FULL_ACCESS,
  get label() {
    return i18n.t("Full Access");
  },
};

export function permissionsList() {
  return [
    { value: PermissionLevels.FULL_ACCESS, label: i18n.t("Full Access") },
    { value: PermissionLevels.EDIT_ACCESS, label: i18n.t("Edit Access") },
    { value: PermissionLevels.COMMENT_ACCESS, label: i18n.t("Comment Access") },
    { value: PermissionLevels.VIEW_ACCESS, label: i18n.t("View Access") },
  ];
}

export const PERMISSIONS_LIST = [
  { value: PermissionLevels.FULL_ACCESS, get label() { return i18n.t("Full Access"); } },
  { value: PermissionLevels.EDIT_ACCESS, get label() { return i18n.t("Edit Access"); } },
  { value: PermissionLevels.COMMENT_ACCESS, get label() { return i18n.t("Comment Access"); } },
  VIEW_ACCESS,
];

export function accessLevelAsString(permission: PermissionLevels) {
  return match(permission)
    .with(PermissionLevels.FULL_ACCESS, () => i18n.t("Full Access"))
    .with(PermissionLevels.EDIT_ACCESS, () => i18n.t("Edit Access"))
    .with(PermissionLevels.COMMENT_ACCESS, () => i18n.t("Comment Access"))
    .with(PermissionLevels.VIEW_ACCESS, () => i18n.t("View Access"))
    .with(PermissionLevels.NO_ACCESS, () => i18n.t("No Access"))
    .run();
}

export function accessLevelAsEnumValue(permission: PermissionLevels | AccessOptionsInt): AccessOptions {
  return match(permission)
    .with(PermissionLevels.FULL_ACCESS, () => "full_access" as const)
    .with(PermissionLevels.EDIT_ACCESS, () => "edit_access" as const)
    .with(PermissionLevels.COMMENT_ACCESS, () => "comment_access" as const)
    .with(PermissionLevels.VIEW_ACCESS, () => "view_access" as const)
    .with(PermissionLevels.NO_ACCESS, () => "no_access" as const)
    .run();
}
