import React from 'react';

export enum ButtonSize {
  Tiny = 'tiny',
  Small = 'small',
  Normal = 'normal',
  Large = 'large',
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size: ButtonSize;
  ghost?: boolean;
  disabled: boolean;
  type?: "primary" | "secondary" | "abort" | "destructive";
}

function textSize({size} : ButtonProps) : string {
  switch (size) {
    case ButtonSize.Tiny:
      return "text-xs";
    case ButtonSize.Small:
      return "text-sm";
    case ButtonSize.Large:
      return "text-lg";
    default:
      return "text-base";
  }
}

function textColor({ghost, disabled, type} : ButtonProps) : string {
  if(ghost && disabled) return "text-dark-2";
  if(ghost) {
    if(type === "primary") return "text-brand-base";
    if(type === "secondary") return "text-dark-2";
    if(type === "abort") return "text-dark-2";
    if(type === "destructive") return "text-red-500";
  }
  if(disabled) return "text-white";
  return "text-white";
}

function backgroundColor({ghost, disabled} : ButtonProps) : string {
  if(ghost) return "bg-transparent";
  if(disabled) return "bg-dark-8%";

  return "bg-brand-base";
}

function border({ghost, disabled, type} : ButtonProps) : string {
  if(ghost) {
    if(disabled) return "border border-dark-2";
    if(!disabled) {
      if(type === "primary") return "border border-brand-base";
      if(type === "secondary") return "border border-dark-2";
      if(type === "abort") return "";
      if(type === "destructive") return "border border-red-500";
    }
  }

  return "";
}

export default function Button(props : ButtonProps) : JSX.Element {
  const {size, ghost, disabled, type, ...rest} = props;

  const style = [
    "whitespace-nowrap break-keep py-1.5 px-3 rounded",
    textSize(props),
    textColor(props),
    backgroundColor(props),
    border(props)
  ].join(" ");

  return <button {...rest} className={style} />
}

Button.defaultProps = {
  size: ButtonSize.Normal,
  ghost: false,
  disabled: false,
  type: "primary"
};
