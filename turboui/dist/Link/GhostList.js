import { jsx as _jsx } from "react/jsx-runtime";
import { DivLink } from ".";
import classNames from "classnames";
export function GhostLink(props) {
    const classname = classNames("font-medium", "hover:underline", {
        "text-content-dimmed": props.dimmed,
        "text-sm": props.size === "sm",
        "text-xs": props.size === "xs",
    }, props.className);
    return _jsx(DivLink, { to: props.to, className: classname, testId: props.testId, children: props.text });
}
