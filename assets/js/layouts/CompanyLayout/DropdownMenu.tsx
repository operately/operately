import * as React from "react";
import * as Icons from "@tabler/icons-react";
import * as Popover from "@radix-ui/react-popover";

import { DivLink } from "@/components/Link";

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
}

export function DropdownMenu(props: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false);
  const close = () => setOpen(false);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <div className={triggerClassName} data-test-id={props.testId}>
          {React.createElement(props.icon, { size: 16 })}
          <div className="font-semibold">{props.name}</div>
          {props.showDropdownIcon && <Icons.IconChevronDown size={16} />}
        </div>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content className={contentClassName} align={props.align} sideOffset={12} onClick={close}>
          <div className="bg-surface-base p-2 min-w-[250px]">{props.children}</div>
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
}

export function DropdownLinkItem({ path, icon, title, testId }: DropdownLinkItemProps) {
  return (
    <DivLink className={itemClassName} to={path} testId={testId}>
      {React.createElement(icon, { size: 18, strokeWidth: 2 })}
      <div className="font-medium">{title}</div>
    </DivLink>
  );
}

export function DropdownSeparator() {
  return <div className="border-t border-stroke-base my-2"></div>;
}
