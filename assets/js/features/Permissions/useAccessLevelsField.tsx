import { PermissionLevels } from "@/features/Permissions";

//
// This is a custom hook that is used to manage the state of the general access levels
// on a project. It is meant to be used inside a compoennts/Forms form.
//
// The hook returns a field set with the following fields:
//
//  - isAdvanced: a boolean field that indicates if the advanced options are visible
//  - annonymousMembers: a select field that represents the access level for annonymous members
//  - companyMembers: a select field that represents the access level for company members
//  - spaceMembers: a select field that represents the access level for space members
//
// The hook also manages the dependencies between the fields, so that the companyMembers
// and spaceMembers always satisfy the following condition:
//
//   spaceMembers >= companyMembers >= annonymousMembers
//

interface Props {
  isAdvanced?: boolean;
  annonymousMembers: PermissionLevels;
  companyMembers: PermissionLevels;
  spaceMembers: PermissionLevels;
}

const DEFAULT_PROPS: Props = {
  isAdvanced: false,
  annonymousMembers: PermissionLevels.NO_ACCESS,
  companyMembers: PermissionLevels.COMMENT_ACCESS,
  spaceMembers: PermissionLevels.COMMENT_ACCESS,
};

export function useProjectAccessFields(props?: Props) {
  const { isAdvanced, annonymousMembers, companyMembers, spaceMembers } = { ...DEFAULT_PROPS, ...props };

  return {
    isAdvanced: isAdvanced,
    annonymousMembers: annonymousMembers,
    companyMembers: companyMembers,
    spaceMembers: spaceMembers,
  };
}
