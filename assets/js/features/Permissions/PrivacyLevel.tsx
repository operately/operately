import React from "react";

import { Spacer } from "@/components/Spacer";
import { Radio, RadioGroup } from "@/components/Form";
import { usePermissionsContext, ReducerActions } from "./PermissionsContext";


enum PermissionOptions {
  PUBLIC="public",
  INTERNAL="internal",
  CONFIDENTIAL="confidential",
}


export default function PrivacyLevel() {
  const { dispatch } = usePermissionsContext();

  const handleChange = (value: PermissionOptions) => {
    switch(value) {
      case PermissionOptions.PUBLIC:
        dispatch({ type: ReducerActions.SET_PUBLIC });
        break;
      case PermissionOptions.INTERNAL:
        dispatch({ type: ReducerActions.SET_INTERNAL });
        break;
      case PermissionOptions.CONFIDENTIAL:
        dispatch({ type: ReducerActions.SET_CONFIDENTIAL });
        break;
    }
  }

  const PRIVACY_OPTIONS = [
    {label: "Public - Anyone on the internet", value: PermissionOptions.PUBLIC},
    {label: "Internal - All organization members", value: PermissionOptions.INTERNAL},
    {label: "Confidential - Only people invited to the space", value: PermissionOptions.CONFIDENTIAL},
  ]

  return (
    <div>
      <h2 className="font-bold">Privacy</h2>
      <p className="text-sm text-content-dimmed">Who can view information in this space?</p>

      <Spacer />

      <RadioGroup name="privacy-level" onChange={handleChange} defaultValue="confidential">
        {PRIVACY_OPTIONS.map((option, idx) => (
          <Radio {...option} key={idx} />
        ))}
      </RadioGroup>
    </div>
  );
}