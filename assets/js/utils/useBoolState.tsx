import React from "react";

export const useBoolState = (initialState: boolean) => {
  const [state, setState] = React.useState(initialState);
  const toggle = () => setState(!state);
  const setTrue = () => setState(true);
  const setFalse = () => setState(false);
  return [state, toggle, setTrue, setFalse] as const;
};
