import React from "react";

import * as ReactTooltip from "@radix-ui/react-tooltip";
import classNames from "classnames";

interface TextTooltipProps {
  content: React.ReactNode | string;
  children: React.ReactNode;
  delayDuration?: number;
}

export function Tooltip({ content, delayDuration, children }: TextTooltipProps): JSX.Element {
  const className = classNames(
    "bg-surface rounded-lg",
    "py-4 px-5",
    "text-content-accent",
    "font-medium",
    "break-normal",
    "select-none",
  );

  const shadow = {
    boxShadow: "2px 2px 8px var(--color-stroke-base)",
  };

  return (
    <ReactTooltip.Provider>
      <ReactTooltip.Root delayDuration={delayDuration || 200}>
        <ReactTooltip.Trigger asChild>{children}</ReactTooltip.Trigger>
        <ReactTooltip.Content sideOffset={10} className={className} style={shadow}>
          {content}
          <ReactTooltip.Arrow style={{ fill: "var(--color-surface)" }} />
        </ReactTooltip.Content>
      </ReactTooltip.Root>
    </ReactTooltip.Provider>
  );
}
