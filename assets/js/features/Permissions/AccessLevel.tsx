import React, { createElement, useMemo } from "react";

import { SelectBoxNoLabel } from "@/components/Form";
import { IconBuildingCommunity, IconNetwork } from "@tabler/icons-react";
import { usePermissionsContext, ReducerActions } from "./PermissionsContext";
import { PermissionLevels, PERMISSIONS_LIST, PUBLIC_PERMISSIONS_LIST } from ".";
import { Space } from "@/models/spaces";

import { IconRocket } from "@tabler/icons-react";
import * as Icons from "@tabler/icons-react";


interface DropdownOption {
  value: PermissionLevels;
  label: string;
}

interface ResourceAccessLevelProps {
  companySpaceSelected: boolean;
  space: Space | null;
}


export function AccessLevel() {
  const { permissions } = usePermissionsContext();

  if (permissions.public !== PermissionLevels.NO_ACCESS) {
    return (
      <AccessLevelContainer>
        <CompanyAccessLevel />
        <PublicAccessLevel />
      </AccessLevelContainer>
    );
  }

  if(permissions.company !== PermissionLevels.NO_ACCESS) {
    return (
      <AccessLevelContainer>
        <CompanyAccessLevel />
      </AccessLevelContainer>
    );
  }

  return <></>;
}


export function ResourceAccessLevel({ companySpaceSelected, space }: ResourceAccessLevelProps) {
  const { permissions } = usePermissionsContext();

  if (permissions.public !== PermissionLevels.NO_ACCESS) {
      return (
        <AccessLevelContainer>
          {!companySpaceSelected && <SpaceAccessLevel space={space} />}
          <CompanyAccessLevel />
          <PublicAccessLevel />
        </AccessLevelContainer>
      );
  }

  if(permissions.company !== PermissionLevels.NO_ACCESS) {
    return (
      <AccessLevelContainer>
        {!companySpaceSelected && <SpaceAccessLevel space={space} />}
        <CompanyAccessLevel />
      </AccessLevelContainer>
    );
  }

  if(permissions.space !== PermissionLevels.NO_ACCESS && !companySpaceSelected) {
    return (
      <AccessLevelContainer>
        <SpaceAccessLevel space={space} />
      </AccessLevelContainer>
    );
  }

  return <></>;
}


function SpaceAccessLevel({space}: {space: Space | null}) {
  const { dispatch, permissions } = usePermissionsContext();

  const currentPermission = useMemo(() => {
    return PERMISSIONS_LIST.find(option => option.value === permissions.space);
  }, [permissions.space]);

  const handleChange = (option: DropdownOption) => {
    dispatch({ type: ReducerActions.SET_SPACE_ACCESS, access_level: option.value });
  }

  return (
    <div className="grid grid-cols-[70%_30%] gap-2 w-full">
      <div className="flex items-center gap-2 pl-2 border border-surface-outline rounded-lg">
        {space ?
          <>
            {createElement(Icons[space.icon!], {size: 25})}
            <span>Everyone in {space.name}</span>
          </>
        :
          <>
            <IconRocket size={25} />
            <span>Everyone in the space</span>
          </>
        }
      </div>
      <SelectBoxNoLabel
        onChange={handleChange}
        options={PERMISSIONS_LIST}
        value={currentPermission}
      />
    </div>
  );
}


function CompanyAccessLevel() {
  const { company, dispatch, permissions } = usePermissionsContext();

  const currentPermission = useMemo(() => {
    return PERMISSIONS_LIST.find(option => option.value === permissions.company);
  }, [permissions.company]);

  const handleChange = (option: DropdownOption) => {
    dispatch({ type: ReducerActions.SET_COMPANY_ACCESS, access_level: option.value });
  }

  return (
    <div className="grid grid-cols-[70%_30%] gap-2 w-full">
      <div className="flex items-center gap-2 pl-2 border border-surface-outline rounded-lg">
        <IconBuildingCommunity size={25} />
        <span>Everyone at {company.name}</span>
      </div>
      <SelectBoxNoLabel
        onChange={handleChange}
        options={PERMISSIONS_LIST}
        value={currentPermission}
      /> 
    </div>
  );
}


function PublicAccessLevel() {
  const { dispatch, permissions } = usePermissionsContext();

  const currentPermission = useMemo(() => {
    return PUBLIC_PERMISSIONS_LIST.find(option => option.value === permissions.public);
  }, [permissions.public]);

  const handleChange = (option: DropdownOption) => {
    dispatch({ type: ReducerActions.SET_PUBLIC_ACCESS, access_level: option.value });
  }

  return (
    <div className="grid grid-cols-[70%_30%] gap-2 w-full">
      <div className="flex items-center gap-2 pl-2 border border-surface-outline rounded-lg">
        <IconNetwork size={25} />
        <span>Anyone on the internet</span>
      </div>
      <SelectBoxNoLabel
        onChange={handleChange}
        options={PUBLIC_PERMISSIONS_LIST}
        value={currentPermission}
      /> 
    </div>
  );
}


function AccessLevelContainer({children}) {
  return (
    <div className="flex flex-col gap-2">
        <h2 className="font-bold">Access {children.length > 1 ? "Levels" : "Level"}</h2>
        {children}
      </div>
  );
}
