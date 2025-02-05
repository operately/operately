import React, { useEffect, useMemo } from "react";
import PrivacyLevel from "./PrivacyLevel";
import { ResourceAccessLevel } from "./AccessLevel";
import { PermissionsState, ReducerActions } from "./usePermissionsState";
import { compareIds } from "@/routes/paths";
import { PermissionOptions } from ".";
import { calculatePrivacyLevel } from "./utils";

export function ResourcePermissionSelector({ state }: { state: PermissionsState }) {
  const { space, company, dispatch, permissions } = state;
  const companySpaceSelected = isCompanySpaceSelected(company, space);

  const privacyOptions = useMemo(() => getPrivacyOptions(companySpaceSelected), [companySpaceSelected]);

  useEffect(() => {
    if (companySpaceSelected && calculatePrivacyLevel(permissions) === PermissionOptions.CONFIDENTIAL) {
      dispatch({ type: ReducerActions.SET_FOR_COMPANY_SPACE });
    }
  }, [companySpaceSelected]);

  return (
    <>
      <PrivacyLevel
        description="Who can access this project?"
        options={privacyOptions}
        defaultValue={calculatePrivacyLevel(permissions)}
        key={space?.id}
        state={state}
      />
      <ResourceAccessLevel companySpaceSelected={companySpaceSelected} state={state} />
    </>
  );
}

const isCompanySpaceSelected = (company, space) => {
  return company?.companySpaceId && space?.id && compareIds(company.companySpaceId, space.id);
};

const getPrivacyOptions = (isCompanySpaceSelected: boolean) => {
  const options = [
    { label: "Internal - All organization members", value: PermissionOptions.INTERNAL },
    { label: "Confidential - All people invited to the space", value: PermissionOptions.CONFIDENTIAL },
    { label: "Secret - Only people explicitly invited", value: PermissionOptions.SECRET },
  ];

  // Remove CONFIDENTIAL option if company space is selected
  return isCompanySpaceSelected ? options.filter((option) => option.value !== PermissionOptions.CONFIDENTIAL) : options;
};
