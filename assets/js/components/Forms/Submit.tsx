import * as React from "react";

import { getFormContext } from "./FormContext";
import { FilledButton } from "@/components/Button";

export function Submit({ saveText }: { saveText: string }) {
  const form = getFormContext();

  return (
    <div className="flex items-center gap-2 mt-8">
      <FilledButton type="primary" submit loading={form.state === "submitting"}>
        {saveText}
      </FilledButton>
    </div>
  );
}
