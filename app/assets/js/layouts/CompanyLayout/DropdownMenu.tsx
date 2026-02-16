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
  triggerClassName?: string;
}

export function DropdownMenu(props: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false);
  const close = () => setOpen(false);

  const contentStyle = {
    minWidth: props.minWidth ?? 230,
  };

  const hasVisibleChildren = React.useMemo(() => {
    return React.Children.toArray(props.children).some((child) => {
      if (!React.isValidElement(child)) return false;
      const hidden = (child.props as { hidden?: boolean }).hidden;
      return !hidden;
    });
  }, [props.children]);

  const triggerClassName = classNames(
    "font-semibold whitespace-nowrap",
    "flex items-center gap-1",
    "cursor-pointer",
    "group",
    "hover:bg-surface-bg-highlight",
    "px-1.5 py-0.5",
    "rounded",
    props.triggerClassName,
  );

  if (!hasVisibleChildren) return null;

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
  hidden?: boolean;
}

export function DropdownLinkItem({ path, icon, title, testId, target, hidden }: DropdownLinkItemProps) {
  if (hidden) return null;

  return (
    <DivLink className={itemClassName} to={path} testId={testId} target={target}>
      {React.createElement(icon, { size: 18, strokeWidth: 2 })}
      <div className="font-medium">{title}</div>
    </DivLink>
  );
}

export function DropdownSeparator({ hidden }: { hidden?: boolean }) {
  if (hidden) return null;

  return <div className="border-t border-stroke-base my-2 first:hidden"></div>;
}
