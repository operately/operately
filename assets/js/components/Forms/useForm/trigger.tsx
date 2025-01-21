import React from "react";

export function useSubmitTrigger() {
  const [trigger, setTrigger] = React.useState<string>();
  return { trigger, setTrigger };
}
