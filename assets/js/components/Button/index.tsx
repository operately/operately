import React from "react";
import { Link } from "react-router-dom";
import { PuffLoader } from "react-spinners";

export * from "./GhostButton";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "attention" | "success" | "secondary" | "danger";
  size?: "small" | "base" | "tiny" | "lg";
  linkTo?: string;
  disabled?: boolean;
  submit?: boolean;
  loading?: boolean;
}

const sizes = {
  tiny: "px-2.5 py-1 text-xs gap-1",
  small: "px-3 py-1.5 text-xs gap-1",
  base: "px-3 py-1.5 text-sm gap-2",
  lg: "px-6 py-2 text gap-2",
};

const variants = {
  default: {
    base: "flex items-center transition-all duration-100",
    color: "text-white-1 bg-dark-5",
    text: "font-medium",
    border: "border rounded border-indigo-400",
    hover: "hover:text-white-1 hover:bg-indigo-500/30",
    disabled: "opacity-50 cursor-not-allowed",
  },

  success: {
    base: "flex items-center transition-all duration-100",
    color: "border-2 border-accent-1 text-content-accent text-accent-1",
    text: "font-semibold",
    border: "rounded",
    hover: "",
    disabled: "cursor-not-allowed",
  },

  secondary: {
    base: "flex items-center transition-all duration-100",
    color: "border-2 border-content-subtle text-content-dimmed",
    text: "font-semibold",
    border: "rounded",
    hover: "",
    disabled: "cursor-not-allowed",
  },

  attention: {
    base: "flex items-center",
    color: "text-yellow-400",
    text: "font-bold",
    border: "border border-yellow-400 rounded",
    hover: "hover:bg-yellow-400/10",
    disabled: "opacity-50 cursor-not-allowed",
  },

  danger: {
    base: "flex items-center",
    color: "text-red-400",
    text: "font-bold",
    border: "border border-red-400 rounded",
    hover: "hover:bg-red-400/10",
    disabled: "opacity-50 cursor-not-allowed",
  },
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
  const { variant, size, linkTo, children, loading, submit, ...rest } = props;

  const sizeValue = sizes[size || "base"];
  const variantValue = variants[variant || "default"];

  const className = [
    "relative",
    sizeValue,
    variantValue.base,
    variantValue.color,
    variantValue.text,
    variantValue.border,
    variantValue.hover,
    props.disabled ? variantValue.disabled : "",
  ].join(" ");

  const type = submit ? "submit" : "button";

  const button = (
    <button type={type} ref={ref} className={className} {...rest}>
      <div className={props.loading ? "flex items-center gap-2 opacity-50" : "flex items-center gap-2 opacity-100"}>
        {children}
      </div>

      <div className="inset-0 flex items-center justify-center absolute">
        {props.loading && <PuffLoader size={24} color="#fff" />}
      </div>
    </button>
  );

  if (props.linkTo) {
    return <Link to={props.linkTo}>{button}</Link>;
  } else {
    return button;
  }
});

export default Button;
