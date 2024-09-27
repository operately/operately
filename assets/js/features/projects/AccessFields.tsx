import * as Api from "@/api";
import { PermissionLevels } from "@/features/Permissions";
import { DEFAULT_ANNONYMOUS_OPTIONS, DEFAULT_COMPANY_OPTIONS, DEFAULT_SPACE_OPTIONS } from "@/features/Permissions";

type Option = { value: PermissionLevels; label: string };

type AccessLevels = {
  annonymousMembers: PermissionLevels;
  annonynousMembersOptions: Option[];
  companyMembers: PermissionLevels;
  companyMembersOptions: Option[];
  spaceMembers: PermissionLevels;
  spaceMembersOptions: Option[];
};

//
// Usage:
// To use the AccessLevels in a form, you can use the following code:
//
//   const form = Forms.useForm({
//     fields: {
//       access: initialAccessLevels(),
//     },
//     onChange: (values) => {
//       applyAccessLevelConstraints(values.access, parentAccessLevel);
//     }
//   });
//
// On every change the following constraints will be applied:
//
// 1. The annonynousMembers should not be greater than the parent access level's public access level.
// 2. The companyMembers should not be greater than the parent access level's company access level.
// 3. The access level for companyMembers should be greater than or equal to the access level for annonynousMembers.
// 4. The access level for spaceMembers should be greater than or equal to the access level for companyMembers.
//

export function initialAccessLevels(): AccessLevels {
  return {
    annonymousMembers: PermissionLevels.NO_ACCESS,
    annonynousMembersOptions: DEFAULT_ANNONYMOUS_OPTIONS,
    companyMembers: PermissionLevels.COMMENT_ACCESS,
    companyMembersOptions: DEFAULT_COMPANY_OPTIONS,
    spaceMembers: PermissionLevels.COMMENT_ACCESS,
    spaceMembersOptions: DEFAULT_SPACE_OPTIONS,
  };
}

export function applyAccessLevelConstraints(values: AccessLevels, parentAccessLevel: Api.AccessLevels) {
  if (values.annonymousMembers > parentAccessLevel.public!) {
    values.annonymousMembers = parentAccessLevel.public!;
  }

  if (values.companyMembers > parentAccessLevel.company!) {
    values.companyMembers = parentAccessLevel.company!;
  }

  // if (values.companyMembers < values.annonymousMembers) {
  //   values.annonymousMembers = values.companyMembers;
  // }

  // if (values.spaceMembers < values.companyMembers) {
  //   values.companyMembers = values.spaceMembers;
  // }

  // values.annonynousMembersOptions = DEFAULT_ANNONYMOUS_OPTIONS.filter(
  //   (option) => option.value >= parentAccessLevel.public!,
  // );

  // values.companyMembersOptions = DEFAULT_COMPANY_OPTIONS.filter(
  //   (option) => option.value >= values.annonymousMembers && option.value >= parentAccessLevel.company!,
  // );
}
