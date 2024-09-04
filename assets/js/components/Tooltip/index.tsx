import React from "react";

import * as ReactTooltip from "@radix-ui/react-tooltip";
import classNames from "classnames";
import { useColorMode } from "@/contexts/ThemeContext";
import { TestableElement } from "@/utils/testid";

interface TextTooltipProps extends TestableElement {
  content: React.ReactNode | string;
  children: React.ReactNode;
  delayDuration?: number;
}

export function Tooltip({ content, delayDuration, children, testId }: TextTooltipProps): JSX.Element {
  const mode = useColorMode();

  const className = classNames(
    "bg-surface rounded-lg",
    "py-4 px-5",
    "text-content-accent",
    "font-medium",
    "break-normal",
    "select-none",
    "shadow-xl",
    "whitespace-normal",
    {
      "border border-stroke-dimmed": mode === "dark",
    },
  );

  const arrowStyle = {
    fill: mode === "light" ? "var(--color-surface)" : "var(--color-stroke-base)",
  };

  return (
    <ReactTooltip.Provider>
      <ReactTooltip.Root delayDuration={delayDuration || 200}>
        <ReactTooltip.Trigger asChild data-test-id={testId}>
          {children}
        </ReactTooltip.Trigger>
        <ReactTooltip.Content sideOffset={10} className={className}>
          {content}
          <ReactTooltip.Arrow style={arrowStyle} />
        </ReactTooltip.Content>
      </ReactTooltip.Root>
    </ReactTooltip.Provider>
  );
}
