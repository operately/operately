import React, { useEffect, useMemo } from "react";
import PrivacyLevel from "./PrivacyLevel";
import { ResourceAccessLevel } from "./AccessLevel";
import { PermissionsState, ReducerActions } from "./usePermissionsState";
import { compareIds } from "@/routes/paths";
import { PermissionOptions } from ".";
import { calculatePrivacyLevel } from "./utils";

export function ResourcePermissionSelector({ state }: { state: PermissionsState }) {
  const { space, company, dispatch, hasPermissions, permissions } = state;

  const companySpaceSelected =
    !company.companySpaceId || !space?.id ? false : compareIds(company.companySpaceId, space.id);

  useEffect(() => {
    if (!hasPermissions) {
      dispatch({ type: ReducerActions.SET_SECRET });
    }
  }, [space]);

  const privacyOptions = useMemo(() => {
    let options = [
      { label: "Public - Anyone on the internet", value: PermissionOptions.PUBLIC },
      { label: "Internal - All organization members", value: PermissionOptions.INTERNAL },
      { label: "Confidential - All people invited to the space", value: PermissionOptions.CONFIDENTIAL },
      { label: "Secret - Only people explicitly invited", value: PermissionOptions.SECRET },
    ];

    if (companySpaceSelected) {
      options = options.filter((obj) => obj.value != PermissionOptions.CONFIDENTIAL);
    }

    return options;
  }, [companySpaceSelected]);

  const defaultPrivacyLevel = useMemo(() => {
    if (hasPermissions) {
      return calculatePrivacyLevel(permissions);
    } else {
      return PermissionOptions.SECRET;
    }
  }, []);

  return (
    <>
      <PrivacyLevel
        description="Who can access this project?"
        options={privacyOptions}
        defaultValue={defaultPrivacyLevel}
        key={space?.id}
        state={state}
      />
      <ResourceAccessLevel companySpaceSelected={companySpaceSelected} state={state} />
    </>
  );
}
