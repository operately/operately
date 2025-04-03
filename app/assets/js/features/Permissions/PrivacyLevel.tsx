import React from "react";

import { Spacer } from "@/components/Spacer";
import { Radio, RadioGroup } from "@/components/Form";
import { ReducerActions } from "./usePermissionsState";
import { PermissionOptions } from ".";
import { PermissionsState } from "./usePermissionsState";

interface PrivacyLevelProps {
  description: string;
  options: { label: string; value: PermissionOptions }[];
  defaultValue: PermissionOptions;
  state: PermissionsState;
}

const parseTestId = (name: string) => {
  return "privacy-level-" + name.split(" ")[0]?.toLocaleLowerCase();
};

export default function PrivacyLevel({ state, description, options, defaultValue }: PrivacyLevelProps) {
  const handleChange = (value: PermissionOptions) => {
    switch (value) {
      case PermissionOptions.PUBLIC:
        state.dispatch({ type: ReducerActions.SET_PUBLIC });
        break;
      case PermissionOptions.INTERNAL:
        state.dispatch({ type: ReducerActions.SET_INTERNAL });
        break;
      case PermissionOptions.CONFIDENTIAL:
        state.dispatch({ type: ReducerActions.SET_CONFIDENTIAL });
        break;
      case PermissionOptions.SECRET:
        state.dispatch({ type: ReducerActions.SET_SECRET });
        break;
    }
  };

  return (
    <div>
      <h2 className="font-bold">Privacy</h2>
      <p className="text-sm text-content-dimmed">{description}</p>

      <Spacer />

      <RadioGroup name="privacy-level" onChange={handleChange} defaultValue={defaultValue}>
        {options.map((option, idx) => (
          <Radio {...option} key={idx} testId={parseTestId(option.label)} />
        ))}
      </RadioGroup>
    </div>
  );
}
