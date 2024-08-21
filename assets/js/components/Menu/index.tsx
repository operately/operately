import * as React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Icons from "@tabler/icons-react";

import classNames from "classnames";
import { TestableElement } from "@/utils/testid";
import { DivLink } from "../Link";

const menuContentClass = classNames(
  "absolute z-10 rounded-md mt-1",
  "py-2 shadow-lg ring-1 transition ring-surface-outline",
  "focus:outline-none",
  "bg-surface",
  "animate-menu-slide-down",
);

const menuTriggerClass = classNames(
  "block p-1.5 text-content-dimmed hover:text-content-base hover:bg-surface-dimmed rounded-full data-[state=open]:bg-surface-dimmed",
);

const menuItemClass = classNames(
  "cursor-pointer",
  "flex items-center gap-3",
  "block px-3 py-1 text-sm leading-6",
  "text-content-dimmed hover:text-content-base hover:bg-surface-highlight",
  "min-w-[150px]",
  "font-medium",
);

export function Menu({ children }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className={menuTriggerClass}>
        <Icons.IconDots size={20} />
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content className={menuContentClass}>{children}</DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

interface MenuItemProps extends TestableElement {
  icon: React.ComponentType<{ size: number }>;
  children: React.ReactNode;
  linkTo?: string;
  danger?: boolean;
}

export function MenuItem(props: MenuItemProps) {
  return (
    <DropdownMenu.Item asChild>
      <MenuItemContent {...props} />
    </DropdownMenu.Item>
  );
}

function MenuItemContent(props: MenuItemProps) {
  const className = classNames(menuItemClass, {
    "hover:text-red-500": props.danger,
  });

  if (props.linkTo) {
    return (
      <DivLink to={props.linkTo} className={className} data-test-id={props.testId}>
        {React.createElement(props.icon, { size: 20 })}
        {props.children}
      </DivLink>
    );
  } else {
    return (
      <div className={className} data-test-id={props.testId}>
        {React.createElement(props.icon, { size: 20 })}
        {props.children}
      </div>
    );
  }
}
