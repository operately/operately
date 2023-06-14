import React from "react";
import { Link } from "react-router-dom";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "attention" | "success" | "secondary";
  size?: "base";
  linkTo?: string;
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
  },

  success: {
    base: "flex items-center",
    color: "text-green-400",
    text: "font-bold uppercase",
    border: "border border-green-400 rounded-full",
    hover: "hover:bg-green-400/10",
  },

  secondary: {
    base: "flex items-center",
    color: "text-white-2",
    text: "font-bold uppercase",
    border: "border border-white-2 rounded-full",
    hover: "hover:border-white-2 hover:text-white-1 ",
  },

  attention: {
    base: "flex items-center",
    color: "text-yellow-400",
    text: "font-bold uppercase",
    border: "border border-yellow-400 rounded-full",
    hover: "hover:bg-yellow-400/10",
  },
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => {
    const size = sizes[props.size || "base"];
    const variant = variants[props.variant || "default"];

    const className = [
      size,
      variant.base,
      variant.color,
      variant.text,
      variant.border,
      variant.hover,
    ].join(" ");

    const button = <button ref={ref} className={className} {...props} />;

    if (props.linkTo) {
      return <Link to={props.linkTo}>{button}</Link>;
    } else {
      return button;
    }
  }
);

export default Button;
