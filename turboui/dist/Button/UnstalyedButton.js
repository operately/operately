import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Menu } from "../Menu";
import { DivLink } from "../Link";
import { IconChevronDown } from "@tabler/icons-react";
export function UnstyledButton(props) {
    if (props.linkTo && props.onClick) {
        throw new Error("Button cannot have both linkTo and onClick props");
    }
    if (props.linkTo && props.type === "submit") {
        throw new Error("Button cannot have both linkTo and type='submit' props");
    }
    if (props.linkTarget && !props.linkTo) {
        throw new Error("Button cannot have linkTarget without linkTo prop");
    }
    if (props.linkTo) {
        return UnstyledLinkButton(props);
    }
    else if (props.spanButton) {
        return UnstyledSpanButton(props);
    }
    else if (props.options) {
        return UnstyledMenuButton(props);
    }
    else {
        return UnstyledActionButton(props);
    }
}
function UnstyledLinkButton(props) {
    return (_jsxs(DivLink, { className: props.className, to: props.linkTo, target: props.linkTarget, testId: props.testId, children: [props.children, props.spinner] }));
}
function UnstyledActionButton(props) {
    const handleClick = (e) => {
        if (props.loading)
            return;
        if (props.onClick)
            props.onClick(e);
    };
    const type = props.type || "button";
    return (_jsxs("button", { type: type, className: props.className, onClick: handleClick, "data-test-id": props.testId, children: [props.children, props.spinner] }));
}
function UnstyledMenuButton(props) {
    if (props.options === undefined) {
        throw "Menu button must have options";
    }
    const triggerClass = props.className + " " + "inline-flex items-center gap-2";
    const trigger = (_jsxs("div", { className: triggerClass, "data-test-id": props.testId, children: [props.children, _jsx(IconChevronDown, { size: 16 })] }));
    return _jsx(Menu, { customTrigger: trigger, children: props.options });
}
function UnstyledSpanButton(props) {
    const handleClick = (e) => {
        if (props.loading)
            return;
        if (props.onClick)
            props.onClick(e);
    };
    return (_jsxs("span", { className: props.className, onClick: handleClick, "data-test-id": props.testId, children: [props.children, props.spinner] }));
}
