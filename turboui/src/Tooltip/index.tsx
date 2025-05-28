import React from "react";

import * as ReactTooltip from "@radix-ui/react-tooltip";
import classNames from "classnames";
import { TestableElement } from "../TestableElement";

namespace Tooltip {
  export interface Props extends TestableElement {
    content: React.ReactNode | string;
    children: React.ReactNode;
    delayDuration?: number;
    className?: string;
    contentClassName?: string;
  }
}

const DEFAULT_DELAY_DURATION = 200;

export function Tooltip(props: Tooltip.Props) {
  props = { ...props, delayDuration: props.delayDuration || DEFAULT_DELAY_DURATION };

  const tooltipClassName = classNames(
    "bg-surface-base rounded-lg",
    "py-4 px-5",
    "text-content-accent",
    "font-medium",
    "break-normal",
    "select-none",
    "shadow-xl",
    "whitespace-normal",
    "border border-stroke-dimmed",
    props.className || "",
  );

  return (
    <ReactTooltip.Provider>
      <ReactTooltip.Root delayDuration={props.delayDuration}>
        <ReactTooltip.Trigger data-testid={props.testId} className={props.contentClassName}>
          {props.children}
        </ReactTooltip.Trigger>

        <ReactTooltip.Portal>
          <ReactTooltip.Content sideOffset={5} className={tooltipClassName}>
            {props.content}
            <ReactTooltip.Arrow />
          </ReactTooltip.Content>
        </ReactTooltip.Portal>
      </ReactTooltip.Root>
    </ReactTooltip.Provider>
  );
}
