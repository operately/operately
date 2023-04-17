import React from 'react';

export enum ButtonSize {
  Small = 'small',
  Normal = 'normal',
  Large = 'large',
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size: ButtonSize;
}

function textSize(size : ButtonSize) : string {
  switch (size) {
    case ButtonSize.Small:
      return "text-sm";
    case ButtonSize.Large:
      return "text-lg";
    default:
      return "text-base";
  }
}

export default function Button(props : ButtonProps) {
  return (
    <button {...props} className={"bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded " + textSize(props.size)} />
  );
}

Button.defaultProps = {
  size: ButtonSize.Normal,
};
