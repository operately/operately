import * as React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Icons from "@tabler/icons-react";

import { TestableElement, createTestId } from "../TestableElement";
import { DivLink } from "../Link";
import classNames from "../utils/classnames";

type Size = "small" | "medium" | "large" | "xlarge" | "xxlarge" | "xxxlarge";

interface MenuProps extends TestableElement {
  children: React.ReactNode;
  customTrigger?: React.ReactNode;
  headerContent?: React.ReactNode;
  size?: Size;
  onOpenChange?: (open: boolean) => void;
}

interface MenuItemProps extends TestableElement {
  children: React.ReactNode;
  icon?: React.ComponentType<{ size: any }>;
  danger?: boolean;
  hidden?: boolean;
}

interface MenuLinkItemProps extends MenuItemProps {
  to: string;
}

interface MenuActionItemProps extends MenuItemProps {
  onClick: () => void;
}

interface SubMenuProps {
  label: string;
  icon?: React.ComponentType<{ size: any }>;
  children: React.ReactNode;
  hidden?: boolean;
}

export function Menu(props: MenuProps) {
  return (
    <DropdownMenu.Root onOpenChange={props.onOpenChange} modal={false}>
      <Trigger {...props} />

      <DropdownMenu.Portal>
        <DropdownMenu.Content className={menuContentClass} style={menuContentStyle(props.size)}>
          {props.headerContent && (
            <div className="px-3 py-2 border-b border-surface-outline">
              {props.headerContent}
            </div>
          )}
          {props.children}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function Trigger(props: MenuProps) {
  if (props.customTrigger) {
    return (
      <DropdownMenu.Trigger asChild data-test-id={props.testId}>
        {props.customTrigger}
      </DropdownMenu.Trigger>
    );
  } else {
    return (
      <DropdownMenu.Trigger className={menuTriggerClass} data-test-id={props.testId}>
        <Icons.IconDots size={20} />
      </DropdownMenu.Trigger>
    );
  }
}

export function SubMenu({ label, icon, children, hidden }: SubMenuProps) {
  if (hidden) return null;

  return (
    <DropdownMenu.Sub>
      <DropdownMenu.SubTrigger asChild>
        <div className={menuItemClass} data-test-id={createTestId(label)}>
          <MenuItemIconAndTitle icon={icon}>{label}</MenuItemIconAndTitle>
          <Icons.IconChevronRight size={16} />
        </div>
      </DropdownMenu.SubTrigger>

      <DropdownMenu.Portal>
        <DropdownMenu.SubContent className={menuContentClass} style={menuContentStyle()}>
          {children}
        </DropdownMenu.SubContent>
      </DropdownMenu.Portal>
    </DropdownMenu.Sub>
  );
}

export function MenuLinkItem(props: MenuLinkItemProps) {
  if (props.hidden) return null;

  return (
    <DropdownMenu.Item>
      <DivLink to={props.to} className={menuItemClassNames(props)} testId={props.testId}>
        <MenuItemIconAndTitle icon={props.icon}>{props.children}</MenuItemIconAndTitle>
      </DivLink>
    </DropdownMenu.Item>
  );
}

export function MenuActionItem(props: MenuActionItemProps) {
  if (props.hidden) return null;

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

function menuContentStyle(size?: Size) {
  let width = "16rem";

  if (size === "small") width = "16rem";
  if (size === "medium") width = "20rem";
  if (size === "large") width = "24rem";
  if (size === "xlarge") width = "28rem";
  if (size === "xxlarge") width = "32rem";
  if (size === "xxxlarge") width = "40rem";

  return { minWidth: width };
}

const menuContentClass = classNames(
  "relative rounded-md mt-1 z-10",
  "py-2 shadow-lg ring-1 transition ring-surface-outline",
  "focus:outline-none",
  "bg-surface-base",
  "animateMenuSlideDown",
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

function MenuItemIconAndTitle({ icon, children }: any) {
  return (
    <>
      {icon && <div className="shrink-0">{React.createElement(icon, { size: 20 })}</div>}
      <div className="break-keep flex-1">{children}</div>
    </>
  );
}

function menuItemClassNames(props: MenuItemProps) {
  return classNames(menuItemClass, {
    "hover:text-content-base": !props.danger,
    "hover:text-content-error": props.danger,
  });
}
