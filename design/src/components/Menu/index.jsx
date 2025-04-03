import React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import classNames from "classnames";

// Since @tabler/icons-react might not be installed, I'll use a subset of required icons
import { IconDots, IconChevronRight } from "./icons";

// Types
const SizeToWidth = {
  small: 150,
  medium: 200,
  large: 225,
  xlarge: 250,
  xxlarge: 275,
  xxxlarge: 300,
};

// Helper functions
function menuContentStyle(size) {
  const width = size ? SizeToWidth[size] : SizeToWidth.medium;
  return {
    width: `${width}px`,
  };
}

const menuContentClass = classNames(
  "relative rounded-md mt-1 z-10",
  "py-2 shadow-lg ring-1 transition ring-surface-outline",
  "focus:outline-none",
  "bg-surface-base",
  "animateMenuSlideDown"
);

const menuTriggerClass = classNames(
  "block p-1.5 text-content-dimmed hover:text-content-base hover:bg-surface-dimmed rounded-full data-[state=open]:bg-surface-dimmed"
);

const menuItemClass = classNames(
  "cursor-pointer",
  "flex items-center gap-3",
  "block px-3 py-1 text-sm leading-6",
  "text-content-dimmed hover:bg-surface-highlight",
  "min-w-[150px]",
  "font-medium"
);

function menuItemClassNames(props) {
  return classNames(menuItemClass, {
    "hover:text-content-base": !props.danger,
    "hover:text-content-error": props.danger,
  });
}

function MenuItemIconAndTitle({ icon, children }) {
  return (
    <>
      {icon && (
        <div className="shrink-0">
          {React.createElement(icon, { size: 20 })}
        </div>
      )}
      <div className="break-keep flex-1">{children}</div>
    </>
  );
}

// Component functions
function Trigger(props) {
  if (props.customTrigger) {
    return (
      <DropdownMenu.Trigger asChild data-test-id={props.testId}>
        {props.customTrigger}
      </DropdownMenu.Trigger>
    );
  } else {
    return (
      <DropdownMenu.Trigger
        className={menuTriggerClass}
        data-test-id={props.testId}
      >
        <IconDots size={20} />
      </DropdownMenu.Trigger>
    );
  }
}

function Menu(props) {
  return (
    <DropdownMenu.Root>
      <Trigger {...props} />

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className={menuContentClass}
          style={menuContentStyle(props.size)}
        >
          {props.children}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function SubMenu({ label, icon, children, hidden }) {
  if (hidden) return null;

  return (
    <DropdownMenu.Sub>
      <DropdownMenu.SubTrigger asChild>
        <div className={menuItemClass} data-test-id={label}>
          <MenuItemIconAndTitle icon={icon}>{label}</MenuItemIconAndTitle>
          <IconChevronRight size={16} />
        </div>
      </DropdownMenu.SubTrigger>

      <DropdownMenu.Portal>
        <DropdownMenu.SubContent
          className={menuContentClass}
          style={menuContentStyle()}
        >
          {children}
        </DropdownMenu.SubContent>
      </DropdownMenu.Portal>
    </DropdownMenu.Sub>
  );
}

function MenuLinkItem(props) {
  if (props.hidden) return null;

  return (
    <DropdownMenu.Item>
      <a
        href={props.to}
        className={menuItemClassNames(props)}
        data-test-id={props.testId}
      >
        <MenuItemIconAndTitle icon={props.icon}>
          {props.children}
        </MenuItemIconAndTitle>
      </a>
    </DropdownMenu.Item>
  );
}

function MenuActionItem(props) {
  if (props.hidden) return null;

  return (
    <DropdownMenu.Item asChild>
      <div
        className={menuItemClassNames(props)}
        data-test-id={props.testId}
        onClick={props.onClick}
      >
        <MenuItemIconAndTitle icon={props.icon}>
          {props.children}
        </MenuItemIconAndTitle>
      </div>
    </DropdownMenu.Item>
  );
}

// Attach sub-components to Menu
Menu.SubMenu = SubMenu;
Menu.MenuLinkItem = MenuLinkItem;
Menu.MenuActionItem = MenuActionItem;

// Export the Menu component with sub-components
export { Menu };
