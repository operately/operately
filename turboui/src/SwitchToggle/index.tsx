import React from "react";

import * as Switch from "@radix-ui/react-switch";
import { TestableElement } from "../TestableElement";

export function SwitchToggle({ label, value, setValue, testId }: SwitchToggle.Props) {
  return (
    <div className="flex items-center">
      <Switch.Root
        checked={value}
        onCheckedChange={setValue}
        className={`w-11 h-6 rounded-full relative outline-none cursor-pointer focus:ring-2 focus:ring-primary-base focus:ring-offset-2 transition-all duration-200 ${
          value ? "bg-brand-1" : "bg-content-dimmed"
        }`}
      >
        <Switch.Thumb className="block w-5 h-5 bg-brand-2 border border-stroke-base rounded-full shadow-md transform transition-all duration-200 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[22px]" />
      </Switch.Root>
      <label data-test-id={testId} className="ml-3 text-sm text-content-base cursor-pointer" onClick={() => setValue(!value)}>
        {label}
      </label>
    </div>
  );
}

export namespace SwitchToggle {
  export interface Props extends TestableElement {
    label: string;
    value: boolean;
    setValue: (value: boolean) => void;
  };
}
