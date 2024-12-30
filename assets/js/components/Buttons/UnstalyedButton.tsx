import * as React from "react";
import * as Popover from "@radix-ui/react-popover";

import { DivLink } from "@/components/Link";
import { TestableElement } from "@/utils/testid";
import { IconChevronDown, IconProps } from "@tabler/icons-react";

interface Linkable {
  linkTo?: string;
  linkTarget?: "_blank" | "_self" | "_parent" | "_top";
}

interface Clickable {
  onClick?: ((e: any) => Promise<boolean>) | ((e: any) => void);
}

interface MenuActionOption {
  label: string;
  action: () => void;
  hidden?: boolean;
  icon?: React.ComponentType<IconProps>;
  testId?: string;
}

interface MenuElementOption {
  element: React.ReactNode;
  hidden?: boolean;
}

interface MenuOptions {
  options?: (MenuActionOption | MenuElementOption)[];
  optionsAlign?: "center" | "start" | "end";
}

export interface BaseButtonProps extends MenuOptions, Linkable, Clickable, TestableElement {
  children: React.ReactNode;
  loading?: boolean;
  type?: "button" | "submit";
  size?: "xxs" | "xs" | "sm" | "base" | "lg";
}

interface UnstyledButtonProps extends BaseButtonProps {
  className?: string;
  spinner?: React.ReactNode;
}

export function UnstyledButton(props: UnstyledButtonProps) {
  if (props.linkTo && props.onClick) {
    throw new Error("Button cannot have both linkTo and onClick props");
  }

  if (props.linkTo && props.type === "submit") {
    throw new Error("Button cannot have both linkTo and type='submit' props");
  }

  if (props.linkTarget && !props.linkTo) {
    throw new Error("Button cannot have linkTarget without linkTo prop");
  }

  if (props.linkTo) {
    return UnstyledLinkButton(props);
  } else if (props.options) {
    return UnstyledMenuButton(props);
  } else {
    return UnstyledActionButton(props);
  }
}

function UnstyledLinkButton(props: UnstyledButtonProps) {
  return (
    <DivLink className={props.className} to={props.linkTo!} target={props.linkTarget} testId={props.testId}>
      {props.children}
      {props.spinner}
    </DivLink>
  );
}

function UnstyledActionButton(props: UnstyledButtonProps) {
  const handleClick = (e: any) => {
    if (props.loading) return;
    if (props.onClick) props.onClick(e);
  };

  const type = props.type || "button";

  return (
    <button type={type} className={props.className} onClick={handleClick} data-test-id={props.testId}>
      {props.children}
      {props.spinner}
    </button>
  );
}

function UnstyledMenuButton(props: UnstyledButtonProps) {
  const [open, setOpen] = React.useState(false);
  const availableOptions = props.options!.filter((option) => !option.hidden);

  if (availableOptions.length < 1) return <></>;

  const triggerClass = props.className + " " + "inline-flex items-center gap-2";

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <div className={triggerClass} data-test-id={props.testId}>
          {props.children}
          <IconChevronDown size={16} />
        </div>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="flex flex-col bg-surface-base rounded-lg border border-surface-outline z-[100] shadow-xl overflow-hidden"
          align={props.optionsAlign}
          sideOffset={5}
        >
          <Popover.Arrow className="fill-surface-outline scale-150" />
          {availableOptions.map((option, idx) => (
            <Option option={option} key={idx} />
          ))}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function Option({ option }: { option: MenuActionOption | MenuElementOption }) {
  if ("label" in option && "action" in option)
    return (
      <Border>
        <div
          className="cursor-pointer px-4 py-2 flex items-center gap-1 hover:bg-surface-accent"
          onClick={option.action}
          data-test-id={option.testId}
        >
          {option.icon && <option.icon size={20} />}
          {option.label}
        </div>
      </Border>
    );

  return (
    <Border>
      <div className="px-4 py-2">{option.element}</div>
    </Border>
  );
}

function Border({ children }: { children: React.ReactNode }) {
  return <div className="border-b border-surface-outline last:border-b-0">{children}</div>;
}
