import React, { useMemo } from "react";

import { SelectBoxNoLabel } from "@/components/Form";
import { IconBuildingCommunity, IconNetwork } from "@tabler/icons-react";
import { ReducerActions } from "./usePermissionsState";
import { PermissionLevels, PermissionOptions, PERMISSIONS_LIST, PUBLIC_PERMISSIONS_LIST } from ".";
import { calculatePrivacyLevel } from "./utils";

import { PermissionsState } from "./usePermissionsState";

interface DropdownOption {
  value: PermissionLevels;
  label: string;
}

interface ResourceAccessLevelProps {
  companySpaceSelected: boolean;
  state: PermissionsState;
}

export function ResourceAccessLevel({ state, companySpaceSelected }: ResourceAccessLevelProps) {
  switch (calculatePrivacyLevel(state.permissions)) {
    case PermissionOptions.PUBLIC:
      return (
        <AccessLevelContainer>
          {!companySpaceSelected && <SpaceAccessLevel state={state} />}
          <CompanyAccessLevel state={state} />
          <PublicAccessLevel state={state} />
        </AccessLevelContainer>
      );
    case PermissionOptions.INTERNAL:
      return (
        <AccessLevelContainer>
          {!companySpaceSelected && <SpaceAccessLevel state={state} />}
          <CompanyAccessLevel state={state} />
        </AccessLevelContainer>
      );
    case PermissionOptions.CONFIDENTIAL:
      return (
        <AccessLevelContainer>
          <SpaceAccessLevel state={state} />
        </AccessLevelContainer>
      );
    case PermissionOptions.SECRET:
      return <></>;
  }
}

function SpaceAccessLevel({ state }: { state: PermissionsState }) {
  const { dispatch, permissions, space } = state;

  const currentPermission = useMemo(() => {
    return PERMISSIONS_LIST.find((option) => option.value === permissions.space);
  }, [permissions.space]);

  const handleChange = (option: DropdownOption) => {
    dispatch({ type: ReducerActions.SET_SPACE_ACCESS, access_level: option.value });
  };

  return (
    <div className="grid grid-cols-[70%_30%] gap-2 w-full">
      <div className="flex items-center gap-2 pl-2 border border-surface-outline rounded-lg">
        {space ? (
          <>
            <span>Everyone in {space.name}</span>
          </>
        ) : (
          <>
            <span>Everyone in the space</span>
          </>
        )}
      </div>
      <SelectBoxNoLabel onChange={handleChange} options={PERMISSIONS_LIST} value={currentPermission} />
    </div>
  );
}

function CompanyAccessLevel({ state }: { state: PermissionsState }) {
  const { company, dispatch, permissions } = state;

  const currentPermission = useMemo(() => {
    return PERMISSIONS_LIST.find((option) => option.value === permissions.company);
  }, [permissions.company]);

  const handleChange = (option: DropdownOption) => {
    dispatch({ type: ReducerActions.SET_COMPANY_ACCESS, access_level: option.value });
  };

  return (
    <div className="grid grid-cols-[70%_30%] gap-2 w-full">
      <div className="flex items-center gap-2 pl-2 border border-surface-outline rounded-lg">
        <IconBuildingCommunity size={25} />
        <span>Everyone at {company.name}</span>
      </div>
      <SelectBoxNoLabel onChange={handleChange} options={PERMISSIONS_LIST} value={currentPermission} />
    </div>
  );
}

function PublicAccessLevel({ state }: { state: PermissionsState }) {
  const { dispatch, permissions } = state;

  const currentPermission = useMemo(() => {
    return PUBLIC_PERMISSIONS_LIST.find((option) => option.value === permissions.public);
  }, [permissions.public]);

  const handleChange = (option: DropdownOption) => {
    dispatch({ type: ReducerActions.SET_PUBLIC_ACCESS, access_level: option.value });
  };

  return (
    <div className="grid grid-cols-[70%_30%] gap-2 w-full">
      <div className="flex items-center gap-2 pl-2 border border-surface-outline rounded-lg">
        <IconNetwork size={25} />
        <span>Anyone on the internet</span>
      </div>
      <SelectBoxNoLabel onChange={handleChange} options={PUBLIC_PERMISSIONS_LIST} value={currentPermission} />
    </div>
  );
}

function AccessLevelContainer({ children }) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="font-bold">Access {children.length > 1 ? "Levels" : "Level"}</h2>
      {children}
    </div>
  );
}
