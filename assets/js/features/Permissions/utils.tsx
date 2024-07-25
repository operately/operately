import { PermissionLevels, PermissionOptions } from ".";
import { Permissions } from "./PermissionsContext";


export function calculatePrivacyLevel(permissions: Permissions, opts?: { forSpace?: boolean }) {
  if (permissions.public !== PermissionLevels.NO_ACCESS) return PermissionOptions.PUBLIC;

  if(permissions.company !== PermissionLevels.NO_ACCESS) return PermissionOptions.INTERNAL;

  if(permissions.space !== PermissionLevels.NO_ACCESS || opts?.forSpace) return PermissionOptions.CONFIDENTIAL;

  return PermissionOptions.SECRET;
}