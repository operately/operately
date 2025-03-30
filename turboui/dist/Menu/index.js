import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Icons from "@tabler/icons-react";
import classNames from "classnames";
import { createTestId } from "../TestableElement";
import { DivLink } from "../Link";
export function Menu(props) {
    return (_jsxs(DropdownMenu.Root, { children: [_jsx(Trigger, { ...props }), _jsx(DropdownMenu.Portal, { children: _jsx(DropdownMenu.Content, { className: menuContentClass, style: menuContentStyle(props.size), children: props.children }) })] }));
}
function Trigger(props) {
    if (props.customTrigger) {
        return (_jsx(DropdownMenu.Trigger, { asChild: true, "data-test-id": props.testId, children: props.customTrigger }));
    }
    else {
        return (_jsx(DropdownMenu.Trigger, { className: menuTriggerClass, "data-test-id": props.testId, children: _jsx(Icons.IconDots, { size: 20 }) }));
    }
}
export function SubMenu({ label, icon, children, hidden }) {
    if (hidden)
        return null;
    return (_jsxs(DropdownMenu.Sub, { children: [_jsx(DropdownMenu.SubTrigger, { asChild: true, children: _jsxs("div", { className: menuItemClass, "data-test-id": createTestId(label), children: [_jsx(MenuItemIconAndTitle, { icon: icon, children: label }), _jsx(Icons.IconChevronRight, { size: 16 })] }) }), _jsx(DropdownMenu.Portal, { children: _jsx(DropdownMenu.SubContent, { className: menuContentClass, style: menuContentStyle(), children: children }) })] }));
}
export function MenuLinkItem(props) {
    if (props.hidden)
        return null;
    return (_jsx(DropdownMenu.Item, { children: _jsx(DivLink, { to: props.to, className: menuItemClassNames(props), testId: props.testId, children: _jsx(MenuItemIconAndTitle, { icon: props.icon, children: props.children }) }) }));
}
export function MenuActionItem(props) {
    if (props.hidden)
        return null;
    return (_jsx(DropdownMenu.Item, { asChild: true, children: _jsx("div", { className: menuItemClassNames(props), "data-test-id": props.testId, onClick: props.onClick, children: _jsx(MenuItemIconAndTitle, { icon: props.icon, children: props.children }) }) }));
}
//
// Helpers
//
const SizeToWidth = {
    small: 150,
    medium: 200,
    large: 225,
    xlarge: 250,
    xxlarge: 275,
    xxxlarge: 300,
};
function menuContentStyle(size) {
    const width = size ? SizeToWidth[size] : SizeToWidth.medium;
    return {
        width: `${width}px`,
    };
}
const menuContentClass = classNames("relative rounded-md mt-1 z-10", "py-2 shadow-lg ring-1 transition ring-surface-outline", "focus:outline-none", "bg-surface-base", "animateMenuSlideDown");
const menuTriggerClass = classNames("block p-1.5 text-content-dimmed hover:text-content-base hover:bg-surface-dimmed rounded-full data-[state=open]:bg-surface-dimmed");
const menuItemClass = classNames("cursor-pointer", "flex items-center gap-3", "block px-3 py-1 text-sm leading-6", "text-content-dimmed hover:bg-surface-highlight", "min-w-[150px]", "font-medium");
function MenuItemIconAndTitle({ icon, children }) {
    return (_jsxs(_Fragment, { children: [icon && _jsx("div", { className: "shrink-0", children: React.createElement(icon, { size: 20 }) }), _jsx("div", { className: "break-keep flex-1", children: children })] }));
}
function menuItemClassNames(props) {
    return classNames(menuItemClass, {
        "hover:text-content-base": !props.danger,
        "hover:text-content-error": props.danger,
    });
}
