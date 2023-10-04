import React from "react";
import { Spacer } from "@/components/Spacer";

export function Separator({ spaceTop, spaceBottom }) {
  const line = <div className="border-t border-dark-5 w-full" />;
  const top = spaceTop ? <Spacer size={spaceTop} /> : null;
  const bottom = spaceBottom ? <Spacer size={spaceBottom} /> : null;

  return (
    <>
      {top}
      {line}
      {bottom}
    </>
  );
}
