import React from "react";

import * as ReactTooltip from "@radix-ui/react-tooltip";

interface TextTooltipProps {
  text: string;
  children: React.ReactNode;
}

export function TextTooltip({ text, children }: TextTooltipProps): JSX.Element {
  return (
    <ReactTooltip.Provider>
      <ReactTooltip.Root delayDuration={200}>
        <ReactTooltip.Trigger asChild>{children}</ReactTooltip.Trigger>
        <ReactTooltip.Content
          sideOffset={5}
          className="bg-dark-1 shadow-lg rounded-lg p-4 text-white text-sm font-medium break-normal"
          style={{
            maxWidth: "250px",
          }}
        >
          {text}

          <ReactTooltip.Arrow className="fill-dark-1" />
        </ReactTooltip.Content>
      </ReactTooltip.Root>
    </ReactTooltip.Provider>
  );
}
