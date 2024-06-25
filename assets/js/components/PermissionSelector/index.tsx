import React, { useState } from "react";

import { Spacer } from "@/components/Spacer";
import { Radio, RadioGroup, SelectBoxNoLabel } from "@/components/Form";
import { IconBuildingCommunity, IconNetwork } from "@tabler/icons-react";


interface PermissionSelectorProps {
  companyName: string;  
}


export default function PermissionSelector({companyName}: PermissionSelectorProps) {
  const [privacy, setPrivacy] = useState(CONFIDENTIAL.value);

  return (
    <>
      <PrivacyLevel setPrivacy={setPrivacy} />
      <AccessLevel privacy={privacy} companyName={companyName} />
    </>
  )
}


const PUBLIC = {label: "Public - Anyone on the internet", value: "public"};
const INTERNAL = {label: "Internal - Only organization members", value:"internal"};
const CONFIDENTIAL = {label: "Confidential - Only people invited to the space", value: "confidential"};

const PRIVACY_OPTIONS = [
  PUBLIC,
  INTERNAL,
  CONFIDENTIAL,
]


function PrivacyLevel({setPrivacy}) {
  return (
    <div>
      <h2 className="font-bold">Privacy</h2>
      <p className="text-sm text-content-dimmed">Who can view information in this space?</p>

      <Spacer />

      <RadioGroup name="privacy-level" onChange={privacy => {setPrivacy(privacy)}} defaultValue="confidential">
        {PRIVACY_OPTIONS.map((option, idx) => (
          <Radio {...option} key={idx} />
        ))}
      </RadioGroup>
    </div>
  );
}


function AccessLevel({privacy, companyName}) {
  if (privacy === PUBLIC.value) {
      return (
        <div className="flex flex-col gap-2">
          <h2 className="font-bold">Access Levels</h2>

          <CompanyAccessLevel companyName={companyName} />
          
          <InternetAccessLevel />
        </div>
      );
  }
  if(privacy === INTERNAL.value) {
    return (
      <div className="flex flex-col gap-2">
        <h2 className="font-bold">Access Level</h2>
      
        <CompanyAccessLevel companyName={companyName} />
      </div>
    );
  }
  return <></>;
}


const COMPANY_PERMISSIONS = [
  {value: 'full-access', label: "Has Full Access"},
  {value: 'edit', label: "Can Edit"},
  {value: 'comment', label: "Can Comment"},
  {value: 'view', label: "Can View"},
]
const COMPANY_DEFAULT_PERMISSION = COMPANY_PERMISSIONS[2];


function CompanyAccessLevel({companyName}) {
  const [currentPermission, setCurrentPermission] = useState(COMPANY_DEFAULT_PERMISSION);

  return (
    <div className="grid grid-cols-[70%_30%] gap-2 w-full">
      <div className="flex items-center gap-2 pl-2 border border-surface-outline rounded-lg">
        <IconBuildingCommunity size={25} />
        <span>Everyone at {companyName}</span>
      </div>
      <SelectBoxNoLabel
        onChange={option => setCurrentPermission(option)}
        options={COMPANY_PERMISSIONS}
        value={currentPermission}
      /> 
    </div>
  );
}


const INTERNET_PERMISSIONS = [
  {value: 'comment', label: "Can Comment"},
  {value: 'view', label: "Can View"},
]
const INTERNET_DEFAULT_PERMISSION = INTERNET_PERMISSIONS[1];


function InternetAccessLevel() {
  const [currentPermission, setCurrentPermission] = useState(INTERNET_DEFAULT_PERMISSION);

  return (
    <div className="grid grid-cols-[70%_30%] gap-2 w-full">
      <div className="flex items-center gap-2 pl-2 border border-surface-outline rounded-lg">
        <IconNetwork size={25} />
        <span>Anyone on the internet</span>
      </div>
      <SelectBoxNoLabel
        onChange={option => setCurrentPermission(option)}
        options={INTERNET_PERMISSIONS}
        value={currentPermission}
      /> 
    </div>
  );
}
