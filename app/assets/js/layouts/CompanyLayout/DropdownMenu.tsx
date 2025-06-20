import * as React from "react";
import * as Popover from "@radix-ui/react-popover";

import { DivLink, IconChevronDown } from "turboui";

import classNames from "classnames";

const contentClassName = classNames(
  "rounded-lg",
  "border border-surface-outline",
  "z-[100]",
  "shadow-xl",
  "overflow-hidden",
);

const triggerClassName = classNames(
  "font-semibold",
  "flex items-center gap-1",
  "cursor-pointer",
  "group",
  "hover:bg-surface-bg-highlight",
  "px-1.5 py-0.5",
  "rounded",
);

const itemClassName = classNames(
  "hover:bg-surface-highlight",
  "px-2 py-1.5",
  "rounded",
  "cursor-pointer",
  "flex items-center gap-2",
);

interface DropdownMenuProps {
  children: React.ReactNode;
  name: string;
  icon: React.ElementType;
  testId: string;

  align?: "start" | "center" | "end";
  showDropdownIcon?: boolean;
  minWidth?: number;
}

export function DropdownMenu(props: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false);
  const close = () => setOpen(false);

  const contentStyle = {
    minWidth: props.minWidth ?? 230,
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <div className={triggerClassName} data-test-id={props.testId}>
          {React.createElement(props.icon, { size: 16 })}
          <div className="font-semibold">{props.name}</div>
          {props.showDropdownIcon && <IconChevronDown size={16} />}
        </div>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content className={contentClassName} align={props.align} sideOffset={12} onClick={close}>
          <div className="bg-surface-base p-2" style={contentStyle}>
            {props.children}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

interface DropdownLinkItemProps {
  path: string;
  icon: React.ElementType;
  title: string;
  testId?: string;
  target?: string;
}

export function DropdownLinkItem({ path, icon, title, testId, target }: DropdownLinkItemProps) {
  return (
    <DivLink className={itemClassName} to={path} testId={testId} target={target}>
      {React.createElement(icon, { size: 18, strokeWidth: 2 })}
      <div className="font-medium">{title}</div>
    </DivLink>
  );
}

export function DropdownSeparator() {
  return <div className="border-t border-stroke-base my-2"></div>;
}
