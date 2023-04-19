import React from 'react';

interface IconsProps {
  name: string;
  size: "small" | "base" | "medium" | "large";
  color: "light" | "dark" | "dark-2" | "brand";
  hoverColor: "light" | "dark" | "dark-2" | "brand";
}

export function Sprite() {
  return <div>
    <object type="image/svg+xml" data="/assets/images/icons.svg" />
  </div>;
}

function SizeToNumber(size: "small" | "base" | "medium" | "large") {
  switch (size) {
    case "small":
      return 18;
    case "base":
      return 24;
    case "medium":
      return 30;
    case "large":
      return 40;
  }
}

function TextColor(color: "light" | "dark" | "dark-2" | "brand") : string {
  switch (color) {
    case "light":
      return "text-light-1";
    case "dark":
      return "text-dark-1";
    case "dark-2":
      return "text-dark-2";
    case "brand":
      return "text-brand-base";
  }
}

function HoverTextColor(color: "light" | "dark" | "dark-2" | "brand") : string {
  switch (color) {
    case "light":
      return "hover:text-light-1";
    case "dark":
      return "hover:text-dark-1";
    case "dark-2":
      return "hover:text-dark-2";
    case "brand":
      return "hover:text-brand-base";
  }
}

export default function Icon({name, size, color, hoverColor} : IconsProps) : JSX.Element {
  var idColor = color;
  if(color === "dark-2") {
    idColor = "dark";
  }

  const id = `icon name=${name}, size=${size}, color=${idColor}`;
  const s = SizeToNumber(size);

  return <svg
    viewBox={`0 0 ${s} ${s}`}
    width={`${s}px`}
    height={`${s}px`}
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    className={`${TextColor(color)} ${HoverTextColor(hoverColor)}`}
  >
    <use xlinkHref={"/assets/images/icons.svg#" + id} />
  </svg>;
}

Icon.defaultProps = {
  size: "base",
  color: "dark",
  hoverColor: "dark-2",
};
