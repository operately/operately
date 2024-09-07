import React, { useMemo } from "react";
import { useRevalidator } from "react-router-dom";

import { useLoadedData } from "./loader";
import { useEditSpacePermissions } from "@/models/spaces";
import { ReducerActions, Permissions, PermissionsState } from "@/features/Permissions/usePermissionsState";

import { SpacePermissionSelector } from "@/features/Permissions";
import { GhostButton, PrimaryButton } from "@/components/Buttons";

export function SpaceAccessLevel({ state }: { state: PermissionsState }) {
  const { space } = useLoadedData();
  const { permissions, dispatch } = state;

  const { revalidate } = useRevalidator();
  const [edit, { loading }] = useEditSpacePermissions();

  const hasChanged = useMemo(
    () => permissions.company !== space.accessLevels?.company || permissions.public !== space.accessLevels?.public,
    [space.accessLevels, permissions],
  );

  const handleEditPermissions = async () => {
    edit({
      spaceId: space.id,
      accessLevels: permissions,
    }).then(() => revalidate());
  };

  const handleReset = () => {
    dispatch({ type: ReducerActions.SET_ALL, payload: space.accessLevels as Permissions });
  };

  return (
    <div className="flex flex-col gap-4">
      <SpacePermissionSelector state={state} />

      {hasChanged && (
        <div className="flex gap-2">
          <PrimaryButton loading={loading} size="xs" onClick={handleEditPermissions}>
            Save
          </PrimaryButton>
          <GhostButton type="secondary" size="xs" onClick={handleReset}>
            Cancel
          </GhostButton>
        </div>
      )}
    </div>
  );
}
