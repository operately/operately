import React, { useEffect, useMemo } from "react";
import PrivacyLevel from "./PrivacyLevel";
import { AccessLevel, ResourceAccessLevel } from "./AccessLevel";
import { ReducerActions, usePermissionsContext } from "./PermissionsContext";


export enum PermissionOptions {
  PUBLIC="public",
  INTERNAL="internal",
  CONFIDENTIAL="confidential",
  SECRET="secret",
}


export function SpacePermissionSelector() {
  const PRIVACY_OPTIONS = [
    {label: "Public - Anyone on the internet", value: PermissionOptions.PUBLIC},
    {label: "Internal - Only organization members", value: PermissionOptions.INTERNAL},
    {label: "Confidential - Only people invited to the space", value: PermissionOptions.CONFIDENTIAL},
  ]

  return (
    <>
      <PrivacyLevel
        description="Who can view information in this space?"
        options={PRIVACY_OPTIONS}
        defaultValue={PermissionOptions.CONFIDENTIAL}
      />
      <AccessLevel />
    </>
  )
}

export function ResourcePermissionSelector() {
  const { space, company, dispatch } = usePermissionsContext();

  useEffect(() => {
    if (company.companySpaceId === space?.id) {
      dispatch({type: ReducerActions.SET_SECRET});
    }
  }, [company, space]);

  const privacy_options = useMemo(() => {
    let options = [
      {label: "Public - Anyone on the internet", value: PermissionOptions.PUBLIC},
      {label: "Internal - All organization members", value: PermissionOptions.INTERNAL},
      {label: "Confidential - Only people invited to the space", value: PermissionOptions.CONFIDENTIAL},
      {label: "Secret - Only people explicitly invited", value: PermissionOptions.SECRET},
    ]

    if (company.companySpaceId === space?.id) {
      options = options.filter(obj => obj.value != PermissionOptions.CONFIDENTIAL);
    }

    return options;
  }, [space, company]);

  return (
    <>
      <PrivacyLevel
        description="Who can access this project?"
        options={privacy_options}
        defaultValue={PermissionOptions.SECRET}
        key={space?.id}
      />
      <ResourceAccessLevel />
    </>
  )
}
