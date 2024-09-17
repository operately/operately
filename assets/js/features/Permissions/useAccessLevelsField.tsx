import * as React from "react";

import {
  PermissionLevels,
  COMMENT_ACCESS,
  EDIT_ACCESS,
  FULL_ACCESS,
  NO_ACCESS,
  VIEW_ACCESS,
} from "@/features/Permissions";

import Forms from "@/components/Forms";

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

const DEFAULT_ANNONYMOUS_OPTIONS = [VIEW_ACCESS, NO_ACCESS];
const DEFAULT_COMPANY_OPTIONS = [FULL_ACCESS, EDIT_ACCESS, COMMENT_ACCESS, VIEW_ACCESS, NO_ACCESS];
const DEFAULT_SPACE_OPTIONS = [FULL_ACCESS, EDIT_ACCESS, COMMENT_ACCESS, VIEW_ACCESS, NO_ACCESS];

const DEFAULT_PROPS: Props = {
  isAdvanced: false,
  annonymousMembers: PermissionLevels.NO_ACCESS,
  companyMembers: PermissionLevels.COMMENT_ACCESS,
  spaceMembers: PermissionLevels.COMMENT_ACCESS,
};

export type AccessFields = ReturnType<typeof useProjectAccessFields>;

export function useProjectAccessFields(props?: Props) {
  const { isAdvanced, annonymousMembers, companyMembers, spaceMembers } = { ...DEFAULT_PROPS, ...props };

  const access = Forms.useFieldSet({
    fields: {
      isAdvanced: Forms.useBooleanField(isAdvanced!),
      annonymousMembers: Forms.useSelectNumberField(annonymousMembers, DEFAULT_ANNONYMOUS_OPTIONS),
      companyMembers: Forms.useSelectNumberField(companyMembers, DEFAULT_COMPANY_OPTIONS),
      spaceMembers: Forms.useSelectNumberField(spaceMembers, DEFAULT_SPACE_OPTIONS),
    },
  });

  //
  // Adjust the company and space levels so that they satisfy the condition:
  // spaceMembers >= companyMembers >= annonymousMembers
  //
  React.useEffect(() => adjustCompanyLevels(access), [access.fields.annonymousMembers.value]);
  React.useEffect(() => adjustSpaceLevels(access), [access.fields.companyMembers.value]);

  return access;
}

function adjustCompanyLevels(access: AccessFields) {
  const annonymous = access.fields.annonymousMembers.value!;
  const company = access.fields.companyMembers.value!;

  if (company < annonymous) {
    access.fields.companyMembers.setValue(annonymous);
  }

  const options = DEFAULT_COMPANY_OPTIONS.filter((option) => option.value >= annonymous);
  access.fields.companyMembers.setOptions(options);
}

function adjustSpaceLevels(access: AccessFields) {
  const company = access.fields.companyMembers.value!;
  const space = access.fields.spaceMembers.value!;

  if (space < company) {
    access.fields.spaceMembers.setValue(company);
  }

  const options = DEFAULT_SPACE_OPTIONS.filter((option) => option.value >= company);
  access.fields.spaceMembers.setOptions(options);
}
