import React, { useMemo } from "react";
import { useRevalidator } from "react-router-dom";

import { useLoadedData } from "./loader";
import { useEditSpacePermissions } from "@/models/spaces";
import { usePermissionsContext, ReducerActions, Permissions } from "@/features/Permissions/PermissionsContext";

import { SpacePermissionSelector } from "@/features/Permissions";
import Button from "@/components/Button";


export function SpaceAccessLevel() {
  const { space } = useLoadedData();
  const { permissions, dispatch } = usePermissionsContext();

  const { revalidate } = useRevalidator();
  const [edit, { loading }] = useEditSpacePermissions();

  const hasChanged = useMemo(() => (
    permissions.company !== space.accessLevels?.company ||
    permissions.public !== space.accessLevels?.public
  ), [space.accessLevels, permissions])

  const handleEditPermissions = async () => {
    edit({
      spaceId: space.id,
      accessLevels: permissions,
    })
    .then(() => revalidate());
  };

  const handleReset = () => {
    dispatch({ type: ReducerActions.SET_ALL, payload: space.accessLevels as Permissions });
  }

  return (
    <div className="flex flex-col gap-4">
      <SpacePermissionSelector />

      {hasChanged && (
        <div className="flex gap-2">
          <Button loading={loading} variant="success" size="small" onClick={handleEditPermissions} >
            Save
          </Button>
          <Button variant="secondary" size="small" onClick={handleReset} >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
