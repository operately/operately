import { jsx as _jsx } from "react/jsx-runtime";
import { UnstyledButton } from "./UnstalyedButton";
import { Spinner } from "./Spinner";
import { calcClassName } from "./calcClassNames";
export function PrimaryButton(props) {
    const className = calcClassName(props, {
        always: "border border-accent-1",
        normal: "text-white-1 bg-green-500 hover:bg-accent-1-light",
        loading: "text-content-subtle bg-accent-1-light",
    });
    return (_jsx(UnstyledButton, { ...props, className: className, spinner: _jsx(Spinner, { loading: props.loading, size: props.size, color: "var(--color-white-1)" }) }));
}
export function GhostButton(props) {
    const className = calcClassName(props, {
        always: "border border-accent-1",
        loading: "text-content-subtle bg-accent-1-light",
        normal: "text-accent-1 hover:text-white-1 hover:bg-accent-1",
    });
    return (_jsx(UnstyledButton, { ...props, className: className, spinner: _jsx(Spinner, { loading: props.loading, color: "var(--color-white-1)", size: props.size }) }));
}
export function SecondaryButton(props) {
    const className = calcClassName(props, {
        always: "border border-surface-outline bg-surface-base",
        normal: "text-content-dimmed hover:text-content-base hover:bg-surface-accent",
        loading: "text-content-subtle",
    });
    return (_jsx(UnstyledButton, { ...props, className: className, spinner: _jsx(Spinner, { loading: props.loading, size: props.size, color: "var(--color-accent-1)" }) }));
}
