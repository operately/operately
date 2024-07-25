import React, { useEffect, useMemo } from "react";
import PrivacyLevel from "./PrivacyLevel";
import { AccessLevel, ResourceAccessLevel } from "./AccessLevel";
import { ReducerActions, usePermissionsContext } from "./PermissionsContext";
import { compareIds } from "@/routes/paths";
import { PermissionOptions } from ".";
import { calculatePrivacyLevel } from "./utils";


export function SpacePermissionSelector() {
  const { hasPermissions, permissions } = usePermissionsContext();

  const PRIVACY_OPTIONS = [
    {label: "Public - Anyone on the internet", value: PermissionOptions.PUBLIC},
    {label: "Internal - Only organization members", value: PermissionOptions.INTERNAL},
    {label: "Confidential - Only people invited to the space", value: PermissionOptions.CONFIDENTIAL},
  ]

  const defaultPrivacyLevel = useMemo(() => {
    if(hasPermissions) {
      return calculatePrivacyLevel(permissions, { forSpace: true });
    }
    else {
      return PermissionOptions.CONFIDENTIAL;
    }
  }, []);

  return (
    <>
      <PrivacyLevel
        description="Who can view information in this space?"
        options={PRIVACY_OPTIONS}
        defaultValue={defaultPrivacyLevel}
      />
      <AccessLevel />
    </>
  )
}

export function ResourcePermissionSelector() {
  const { space, company, dispatch, hasPermissions, permissions } = usePermissionsContext();

  const companySpaceSelected = (!company.companySpaceId || !space?.id) ? false : compareIds(company.companySpaceId, space.id);

  useEffect(() => {
    if(!hasPermissions) {
      dispatch({type: ReducerActions.SET_SECRET});
    }
  }, [space]);

  const privacyOptions = useMemo(() => {
    let options = [
      {label: "Public - Anyone on the internet", value: PermissionOptions.PUBLIC},
      {label: "Internal - All organization members", value: PermissionOptions.INTERNAL},
      {label: "Confidential - All people invited to the space", value: PermissionOptions.CONFIDENTIAL},
      {label: "Secret - Only people explicitly invited", value: PermissionOptions.SECRET},
    ]

    if (companySpaceSelected) {
      options = options.filter(obj => obj.value != PermissionOptions.CONFIDENTIAL);
    }

    return options;
  }, [companySpaceSelected]);

  const defaultPrivacyLevel = useMemo(() => {
    if(hasPermissions) {
      return calculatePrivacyLevel(permissions);
    }
    else {
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
      />
      <ResourceAccessLevel
        companySpaceSelected={companySpaceSelected}
      />
    </>
  )
}
