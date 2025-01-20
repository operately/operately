import React from "react";

export type State = "idle" | "uploading" | "validating" | "submitting" | "secondary-submitting";

export function useFormState() {
  const [state, setState] = React.useState<State>("idle");
  return { state, setState };
}
