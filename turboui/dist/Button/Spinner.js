import { jsx as _jsx } from "react/jsx-runtime";
import { PuffLoader } from "react-spinners";
import { match } from "ts-pattern";
export function Spinner({ loading, color, size }) {
    const iconSize = match(size || "base")
        .with("xxs", () => 16)
        .with("xs", () => 18)
        .with("sm", () => 24)
        .with("base", () => 32)
        .with("lg", () => 36)
        .exhaustive();
    return (_jsx("div", { className: "inset-0 flex items-center justify-center absolute", children: loading && _jsx(PuffLoader, { size: iconSize, color: color }) }));
}
