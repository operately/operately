import * as React from "react";

import { getFormContext } from "./FormContext";
import { FilledButton } from "@/components/Button";
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
      <FilledButton type="primary" submit loading={form.state === "submitting"} testId="submit">
        {saveText}
      </FilledButton>
    </div>
  );
}
