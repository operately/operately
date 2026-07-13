import React from "react";
import { IconChevronDown } from "../icons";
import { Menu, MenuActionItem } from "../Menu";
import classNames from "../utils/classnames";
import { Spinner } from "./Spinner";

export interface OptionsButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  options: { label: string; action: () => void }[];
  loading?: boolean;
  disabled?: boolean;
  testId?: string;
  size?: "sm" | "base";
}

export function OptionsButton({
  children,
  onClick,
  options,
  loading,
  disabled,
  testId,
  size = "base",
}: OptionsButtonProps) {
  const isBase = size === "base";

  const btnClass = classNames(
    "relative inline-flex items-center text-white-1 bg-brand-1 font-semibold",
    "transition-all duration-100",
    "border border-brand-1",
    isBase ? "px-4 py-2 text-base" : "px-3 py-1.5 text-sm",
    "rounded-l-md",
    {
      "hover:bg-blue-600": !loading && !disabled,
      "bg-blue-400 border-blue-400 cursor-default": loading,
      "bg-blue-500 border-blue-500 opacity-50 cursor-not-allowed": disabled,
    }
  );

  const dropdownClass = classNames(
    "relative inline-flex items-center text-white-1 bg-brand-1 font-semibold",
    "transition-all duration-100",
    "border border-brand-1 border-l-brand-2/50", // divider
    isBase ? "px-2 py-2" : "px-1.5 py-1.5",
    "rounded-r-md outline-none",
    {
      "hover:bg-blue-600": !loading && !disabled,
      "bg-blue-400 border-blue-400 cursor-default": loading,
      "bg-blue-500 border-blue-500 opacity-50 cursor-not-allowed": disabled,
    }
  );

  return (
    <div className="inline-flex shadow-sm rounded-md" data-test-id={testId}>
      <button type="button" onClick={onClick} className={btnClass} disabled={loading || disabled}>
        {children}
        {loading && <Spinner loading={true} size={size} color="var(--color-white-1)" />}
      </button>

      <Menu
        customTrigger={
          <button type="button" className={dropdownClass} disabled={loading || disabled}>
            <IconChevronDown size={isBase ? 16 : 14} />
          </button>
        }
      >
        {options.map((option, index) => (
          <MenuActionItem key={index} onClick={option.action}>
            {option.label}
          </MenuActionItem>
        ))}
      </Menu>
    </div>
  );
}
