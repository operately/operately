import React from "react";

import { IconCheck, IconCopy, TablerIconProps } from "../icons";
import { showErrorToast } from "../Toasts";
import classNames from "../utils/classnames";

interface CopyToClipboardProps {
  text: string;
  size: number;
  padding?: number;
  className?: string;
  iconProps?: TablerIconProps;
  testId?: string;
}

export function CopyToClipboard({ text, size, padding = 1, className, iconProps, testId }: CopyToClipboardProps) {
  const [copied, setCopied] = React.useState(false);

  const handleClick = async () => {
    try {
      await copyToClipboard(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      showErrorToast("Copy failed", "Unable to copy to clipboard");
    }
  };

  // containerSize is necessary to make sure that the icon's bg is always a square
  const containerSize = `calc(${size}px + ${padding * 0.5}rem)`;
  const containerClassName = classNames(
    "relative cursor-pointer border-0 bg-transparent hover:bg-surface-dimmed transition-colors duration-300 ease-in-out rounded",
    className,
  );

  return (
    <button
      type="button"
      onClick={handleClick}
      className={containerClassName}
      style={{
        width: containerSize,
        height: containerSize,
        padding: `${padding * 0.25}rem`,
      }}
      data-test-id={testId}
    >
      {copied ? <IconCheck size={size} color="green" {...iconProps} /> : <IconCopy size={size} {...iconProps} />}

      <span
        className={classNames(
          "absolute bg-surface-dimmed rounded py-1 px-2 text-xs transition-opacity duration-300 ease-in-out",
          copied ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        style={{
          top: "50%",
          right: `calc(${containerSize} + .5rem)`,
          transform: "translateY(-50%)",
        }}
      >
        Copied
      </span>
    </button>
  );
}

async function copyToClipboard(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  if (typeof document === "undefined") {
    throw new Error("Clipboard API unavailable");
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.setAttribute("readonly", "true");

  document.body.appendChild(textarea);
  textarea.select();

  const successful = document.execCommand("copy");
  document.body.removeChild(textarea);

  if (!successful) {
    throw new Error("Copy command failed");
  }
}
