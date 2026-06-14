import * as React from "react";

import { PrimaryButton, SecondaryButton } from "../Button";
import { useFormContext } from "./context";
import type { SubmitProps } from "./types";

export function Submit({ saveText = "Save", cancelText = "Cancel" }: SubmitProps) {
  const form = useFormContext();
  const isLoading = form.state === "submitting" || form.state === "uploading";
  const label = form.state === "uploading" ? "Uploading..." : saveText;

  const handleSubmit = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    await form.actions.submit();
  };

  return (
    <div className="mt-8 flex items-center gap-2">
      <PrimaryButton type="button" size="sm" loading={isLoading} testId="submit" onClick={handleSubmit}>
        {label}
      </PrimaryButton>

      {form.hasCancel ? (
        <SecondaryButton type="button" size="sm" testId="cancel" onClick={() => void form.actions.cancel()}>
          {cancelText}
        </SecondaryButton>
      ) : null}
    </div>
  );
}
