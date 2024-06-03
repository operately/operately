import React, { useState } from "react";
import { IconCopy, IconCheck, TablerIconsProps } from "@tabler/icons-react";


interface CopyToClipboardProps {
  text: string;
  size: number;
  padding?: number;
  containerClass?: string;
  iconProps?: TablerIconsProps;
}


export function CopyToClipboard({ text, size, padding=2, containerClass, iconProps }: CopyToClipboardProps) {
  const [copied, setCopied] = useState(false);
  
  const handleClick = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);

    // hides "Copied" after 2 seconds
    setTimeout(() => setCopied(false), 2000);
  }

  // containerSize is necessary to make sure that the icon's bg is always a square
  const containerSize = `calc(${size}px + ${padding * .5}rem)`;
  const containerPadding = `p-${padding}`;

  return (
    <div
      onClick={handleClick}
      className={`relative cursor-pointer hover:bg-stroke-base transition-colors duration-300 ease-in-out rounded ${containerPadding} ${containerClass}`}
      style={{
        width: containerSize,
        height: containerSize,
      }}
    >
      {copied ?
        <IconCheck size={size} color="green" { ...iconProps } />
      :
        <IconCopy size={size} { ...iconProps } />
      }

      <div
        className={`absolute bg-stroke-base rounded py-1 px-2 text-xs transition-opacity duration-300 ease-in-out ${copied ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{
          top: "50%",
          right: `calc(${containerSize} + .5rem)`,
          transform: "translateY(-50%)",
        }}
      >
        Copied
      </div>
    </div>
  );
}