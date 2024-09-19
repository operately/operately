import { PermissionLevels, PERMISSIONS_LIST } from "@/features/Permissions";
import Forms from "@/components/Forms";

export function useAccessLevelField(level: PermissionLevels) {
  return Forms.useSelectNumberField(level, PERMISSIONS_LIST);
}
