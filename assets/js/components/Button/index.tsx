import React from 'react';

export enum ButtonSize {
  Small = 'small',
  Normal = 'normal',
  Large = 'large',
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size: ButtonSize;
  ghost?: boolean;
  disabled: boolean;
}

function textSize({size} : ButtonProps) : string {
  switch (size) {
    case ButtonSize.Small:
      return "text-sm";
    case ButtonSize.Large:
      return "text-lg";
    default:
      return "text-base";
  }
}

function textColor({ghost, disabled} : ButtonProps) : string {
  if(ghost && disabled) return "text-dark-2";
  if(ghost) return "text-brand-base";
  if(disabled) return "text-white";
  return "text-white";
}

function backgroundColor({ghost, disabled} : ButtonProps) : string {
  if(ghost) return "bg-transparent";
  if(disabled) return "bg-dark-8%";

  return "bg-brand-base";
}

function border({ghost, disabled} : ButtonProps) : string {
  if(ghost) {
    if(disabled) return "border border-dark-2";
    if(!disabled) return "border border-brand-base";
  }

  return "";
}

export default function Button(props : ButtonProps) : JSX.Element {
  const {size, ghost, disabled, ...rest} = props;

  const style = [
    "whitespace-nowrap break-keep font-bold py-1.5 px-3 rounded",
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
};
