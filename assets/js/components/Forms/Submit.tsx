import * as React from "react";

import { getFormContext } from "./FormContext";
import { PrimaryButton } from "@/components/Buttons";
import classNames from "classnames";

interface SubmitProps {
  saveText: string;
  layout?: "left" | "centered";
}

export function Submit({ saveText, layout }: SubmitProps) {
  const form = getFormContext();

  const className = classNames("flex items-center gap-2 mt-8", {
    "justify-start": layout === "left",
    "justify-center": layout === "centered",
  });

  return (
    <div className={className}>
      <PrimaryButton type="primary" submit loading={form.state === "submitting"} testId="submit">
        {saveText}
      </PrimaryButton>
    </div>
  );
}
