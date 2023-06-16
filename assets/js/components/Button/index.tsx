import React from "react";
import { Link } from "react-router-dom";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "attention" | "success" | "secondary" | "danger";
  size?: "base";
  linkTo?: string;
  disabled?: boolean;
}

const sizes = {
  base: "px-3 py-1.5 text-sm gap-2",
};

const variants = {
  default: {
    base: "flex items-center",
    color: "text-pink-400",
    text: "font-bold uppercase",
    border: "border border-pink-400 rounded-full",
    hover: "hover:bg-pink-400/10",
    disabled: "opacity-50 cursor-not-allowed",
  },

  success: {
    base: "flex items-center",
    color: "text-green-400",
    text: "font-bold uppercase",
    border: "border border-green-400 rounded-full",
    hover: "hover:bg-green-400/10",
    disabled: "opacity-50 cursor-not-allowed",
  },

  secondary: {
    base: "flex items-center",
    color: "text-white-2",
    text: "font-bold uppercase",
    border: "border border-white-2 rounded-full",
    hover: "hover:border-white-2 hover:text-white-1 ",
    disabled: "opacity-50 cursor-not-allowed",
  },

  attention: {
    base: "flex items-center",
    color: "text-yellow-400",
    text: "font-bold uppercase",
    border: "border border-yellow-400 rounded-full",
    hover: "hover:bg-yellow-400/10",
    disabled: "opacity-50 cursor-not-allowed",
  },

  danger: {
    base: "flex items-center",
    color: "text-red-400",
    text: "font-bold uppercase",
    border: "border border-red-400 rounded-full",
    hover: "hover:bg-red-400/10",
    disabled: "opacity-50 cursor-not-allowed",
  },
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => {
    const { variant, size, linkTo, ...rest } = props;

    const sizeValue = sizes[size || "base"];
    const variantValue = variants[variant || "default"];

    const className = [
      sizeValue,
      variantValue.base,
      variantValue.color,
      variantValue.text,
      variantValue.border,
      variantValue.hover,
      props.disabled ? variantValue.disabled : "",
    ].join(" ");

    const button = <button ref={ref} className={className} {...rest} />;

    if (props.linkTo) {
      return <Link to={props.linkTo}>{button}</Link>;
    } else {
      return button;
    }
  }
);

export default Button;
