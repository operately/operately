import * as React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Icons from "@tabler/icons-react";

import classNames from "classnames";
import { TestableElement } from "@/utils/testid";
import { DivLink } from "../Link";

type Size = "small" | "medium" | "large" | "xlarge" | "xxlarge" | "xxxlarge";

interface MenuProps extends TestableElement {
  children: React.ReactNode;
  size?: Size;
}

interface MenuItemProps extends TestableElement {
  icon: React.ComponentType<{ size: number }>;
  children: React.ReactNode;
  danger?: boolean;
}

interface MenuLinkItemProps extends MenuItemProps {
  to: string;
}

interface MenuActionItemProps extends MenuItemProps {
  onClick: () => void;
}

export function Menu(props: MenuProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className={menuTriggerClass} data-test-id={props.testId}>
        <Icons.IconDots size={20} />
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content className={menuContentClass} style={menuContentStyle(props.size)}>
          {props.children}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export function MenuLinkItem(props: MenuLinkItemProps) {
  return (
    <DropdownMenu.Item asChild>
      <DivLink to={props.to} className={menuItemClassNames(props)} testId={props.testId}>
        <MenuItemIconAndTitle icon={props.icon}>{props.children}</MenuItemIconAndTitle>
      </DivLink>
    </DropdownMenu.Item>
  );
}

export function MenuActionItem(props: MenuActionItemProps) {
  return (
    <DropdownMenu.Item asChild>
      <div className={menuItemClassNames(props)} data-test-id={props.testId} onClick={props.onClick}>
        <MenuItemIconAndTitle icon={props.icon}>{props.children}</MenuItemIconAndTitle>
      </div>
    </DropdownMenu.Item>
  );
}

//
// Helpers
//

const SizeToWidth: Record<Size, number> = {
  small: 150,
  medium: 200,
  large: 225,
  xlarge: 250,
  xxlarge: 275,
  xxxlarge: 300,
};

function menuContentStyle(size?: Size) {
  const width = size ? SizeToWidth[size] : SizeToWidth.medium;

  return {
    width: `${width}px`,
  };
}

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
  "text-content-dimmed hover:bg-surface-highlight",
  "min-w-[150px]",
  "font-medium",
);

function MenuItemIconAndTitle({ icon, children }) {
  return (
    <>
      <div className="shrink-0">{React.createElement(icon, { size: 20 })}</div>
      <div className="break-keep">{children}</div>
    </>
  );
}

function menuItemClassNames(props: MenuItemProps) {
  return classNames(menuItemClass, {
    "hover:text-content-base": !props.danger,
    "hover:text-content-error": props.danger,
  });
}
