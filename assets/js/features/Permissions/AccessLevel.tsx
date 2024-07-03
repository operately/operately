import React, { useState, useEffect } from "react";

import { SelectBoxNoLabel } from "@/components/Form";
import { IconBuildingCommunity, IconNetwork } from "@tabler/icons-react";
import { usePermissionsContext, ReducerActions } from "./PermissionsContext";
import { PermissionLevels, PERMISSIONS_LIST } from ".";


interface DropdownOption {
  value: PermissionLevels;
  label: string;
}

export default function AccessLevel() {
  const { permissions } = usePermissionsContext();

  if (permissions.public !== PermissionLevels.NO_ACCESS) {
      return (
        <div className="flex flex-col gap-2">
          <h2 className="font-bold">Access Levels</h2>
          <CompanyAccessLevel />
          <PublicAccessLevel />
        </div>
      );
  }

  if(permissions.company !== PermissionLevels.NO_ACCESS) {
    return (
      <div className="flex flex-col gap-2">
        <h2 className="font-bold">Access Level</h2>
        <CompanyAccessLevel />
      </div>
    );
  }

  return <></>;
}


function CompanyAccessLevel() {
  const [currentPermission, setCurrentPermission] = useState<DropdownOption>();
  const { companyName, dispatch, permissions } = usePermissionsContext();

  useEffect(() => {
    if(!currentPermission) {
      setCurrentPermission(PERMISSIONS_LIST.find(option => option.value === permissions.company));
    }
  }, [currentPermission, setCurrentPermission])

  const handleChange = (option: DropdownOption) => {
    setCurrentPermission(option);
    dispatch({ type: ReducerActions.SET_COMPANY_ACCESS, access_level: option.value });
  }

  return (
    <div className="grid grid-cols-[70%_30%] gap-2 w-full">
      <div className="flex items-center gap-2 pl-2 border border-surface-outline rounded-lg">
        <IconBuildingCommunity size={25} />
        <span>Everyone at {companyName}</span>
      </div>
      <SelectBoxNoLabel
        onChange={handleChange}
        options={PERMISSIONS_LIST}
        value={currentPermission}
      /> 
    </div>
  );
}


const PUBLIC_PERMISSIONS = [
  {value: PermissionLevels.VIEW_ACCESS, label: "Can View"},
]


function PublicAccessLevel() {
  const [currentPermission, setCurrentPermission] = useState<DropdownOption>();
  const { dispatch, permissions } = usePermissionsContext();

  useEffect(() => {
    if(!currentPermission) {
      setCurrentPermission(PUBLIC_PERMISSIONS.find(option => option.value === permissions.public));
    }
  }, [currentPermission, setCurrentPermission])

  const handleChange = (option: DropdownOption) => {
    setCurrentPermission(option);
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
        options={PUBLIC_PERMISSIONS}
        value={currentPermission}
      /> 
    </div>
  );
}
