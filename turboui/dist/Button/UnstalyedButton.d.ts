import React from "react";
import { TestableElement } from "../TestableElement";
interface Linkable {
    linkTo?: string;
    linkTarget?: "_blank" | "_self" | "_parent" | "_top";
}
interface Clickable {
    onClick?: ((e: any) => Promise<boolean>) | ((e: any) => void);
}
interface MenuOptions {
    options?: React.ReactNode[];
    optionsAlign?: "center" | "start" | "end";
}
export interface BaseButtonProps extends MenuOptions, Linkable, Clickable, TestableElement {
    children: React.ReactNode;
    loading?: boolean;
    type?: "button" | "submit";
    size?: "xxs" | "xs" | "sm" | "base" | "lg";
    spanButton?: boolean;
}
interface UnstyledButtonProps extends BaseButtonProps {
    className?: string;
    spinner?: React.ReactNode;
}
export declare function UnstyledButton(props: UnstyledButtonProps): import("react/jsx-runtime").JSX.Element;
export {};
