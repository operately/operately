import { jsx as _jsx } from "react/jsx-runtime";
import classnames from "classnames";
import * as Router from "react-router-dom";
import classNames from "classnames";
const baseLinkClass = classnames("cursor-pointer", "transition-colors");
function UnstyledLink(props) {
    return (_jsx(Router.Link, { to: props.to, className: props.className, "data-test-id": props.testId, target: props.target, children: props.children }));
}
export function Link(props) {
    const className = classNames(baseLinkClass, underlineClass(props.underline), "text-link-base", props.className, {
        "hover:text-link-hover": !props.disableColorHoverEffect,
    });
    return _jsx(UnstyledLink, { ...props, className: className });
}
export function BlackLink(props) {
    const className = classNames(baseLinkClass, underlineClass(props.underline), "text-content-base", props.className, {
        "hover:text-content-dimmed": !props.disableColorHoverEffect,
    });
    return _jsx(UnstyledLink, { ...props, className: className });
}
export function ButtonLink({ onClick, children, testId }) {
    return (_jsx("span", { onClick: onClick, className: baseLinkClass, "data-test-id": testId, children: children }));
}
export function ActionLink(props) {
    const className = classNames(baseLinkClass, underlineClass(props.underline), "text-link-base", props.className, {
        "hover:text-link-hover": !props.disableColorHoverEffect,
    });
    return (_jsx("span", { "data-test-id": props.testId, className: className, onClick: props.onClick, children: props.children }));
}
export function DimmedLink(props) {
    const className = classnames(baseLinkClass, underlineClass(props.underline), "text-content-dimmed", props.className, {
        "hover:text-content-base": !props.disableColorHoverEffect,
    });
    return _jsx(UnstyledLink, { ...props, className: className });
}
export function DivLink({ to, children, testId, target, external, ...props }) {
    if (external) {
        return (_jsx("a", { href: to, "data-test-id": testId, ...props, target: target, children: children }));
    }
    else {
        return (_jsx(Router.Link, { to: to, "data-test-id": testId, ...props, target: target, children: children }));
    }
}
function underlineClass(underline) {
    if (!underline || underline === "always")
        return "underline underline-offset-2";
    if (underline === "hover")
        return "hover:underline underline-offset-2";
    if (underline === "never")
        return "";
    throw new Error("Invalid underline prop");
}
