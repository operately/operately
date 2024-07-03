export { SpacePermissionSelector, ResourcePermissionSelector } from "./PermissionSelector"

export enum PermissionLevels {
  FULL_ACCESS=100,
  EDIT_ACCESS=70,
  COMMENT_ACCESS=40,
  VIEW_ACCESS=10,
  NO_ACCESS=0,
};

export const PERMISSIONS_LIST = [
  {value: PermissionLevels.FULL_ACCESS, label: "Has Full Access"},
  {value: PermissionLevels.EDIT_ACCESS, label: "Can Edit"},
  {value: PermissionLevels.COMMENT_ACCESS, label: "Can Comment"},
  {value: PermissionLevels.VIEW_ACCESS, label: "Can View"},
]
