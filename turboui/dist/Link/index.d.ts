import React from "react";
interface Props {
    children: React.ReactNode;
    target?: string;
    testId?: string;
    className?: string;
}
interface LinkProps extends Props {
    to: string;
    underline?: "always" | "hover" | "never";
    disableColorHoverEffect?: boolean;
}
interface ButtonLinkProps extends Props {
    onClick: () => void;
}
interface ActionLinkProps extends Props {
    onClick: () => void;
    underline?: "always" | "hover" | "never";
    disableColorHoverEffect?: boolean;
}
interface DivLinkProps extends Props {
    to: string;
    className?: string;
    style?: React.CSSProperties;
    external?: boolean;
}
export declare function Link(props: LinkProps): import("react/jsx-runtime").JSX.Element;
export declare function BlackLink(props: LinkProps): import("react/jsx-runtime").JSX.Element;
export declare function ButtonLink({ onClick, children, testId }: ButtonLinkProps): import("react/jsx-runtime").JSX.Element;
export declare function ActionLink(props: ActionLinkProps): import("react/jsx-runtime").JSX.Element;
export declare function DimmedLink(props: LinkProps): import("react/jsx-runtime").JSX.Element;
export declare function DivLink({ to, children, testId, target, external, ...props }: DivLinkProps): import("react/jsx-runtime").JSX.Element;
export {};
