import React from "react";

export type State = "idle" | "validating" | "submitting";

export function useFormState() {
  const [state, setState] = React.useState<State>("idle");

  const setIdleState = () => setState("idle");
  const setValidatingState = () => setState("validating");
  const setSubmittingState = () => setState("submitting");

  return { state, setIdleState, setValidatingState, setSubmittingState };
}
