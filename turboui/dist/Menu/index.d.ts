import * as React from "react";
import { TestableElement } from "../TestableElement";
type Size = "small" | "medium" | "large" | "xlarge" | "xxlarge" | "xxxlarge";
interface MenuProps extends TestableElement {
    children: React.ReactNode;
    customTrigger?: React.ReactNode;
    size?: Size;
}
interface MenuItemProps extends TestableElement {
    children: React.ReactNode;
    icon?: React.ComponentType<{
        size: any;
    }>;
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
    icon?: React.ComponentType<{
        size: any;
    }>;
    children: React.ReactNode;
    hidden?: boolean;
}
export declare function Menu(props: MenuProps): import("react/jsx-runtime").JSX.Element;
export declare function SubMenu({ label, icon, children, hidden }: SubMenuProps): import("react/jsx-runtime").JSX.Element | null;
export declare function MenuLinkItem(props: MenuLinkItemProps): import("react/jsx-runtime").JSX.Element | null;
export declare function MenuActionItem(props: MenuActionItemProps): import("react/jsx-runtime").JSX.Element | null;
export {};
