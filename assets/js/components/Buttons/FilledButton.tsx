import React from "react";
import { PuffLoader } from "react-spinners";
import { DivLink } from "@/components/Link";

interface FilledButtonProps {
  children: any;
  linkTo?: string;
  linkTarget?: "_blank" | "_self" | "_parent" | "_top";
  onClick?: ((e: any) => Promise<boolean>) | ((e: any) => void);
  testId?: string;
  size?: "xxxs" | "xxs" | "xs" | "sm" | "base" | "lg";
  type?: "primary" | "secondary";
  loading?: boolean;
  bzzzOnClickFailure?: boolean;
  submit?: boolean;
}

export function FilledButton(props: FilledButtonProps) {
  const [shake, setShake] = React.useState(false);

  const handleClick = async (e: any) => {
    if (!props.onClick) return;

    const res = await props.onClick(e);

    if (res === false && props.bzzzOnClickFailure) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  const klass = className(props.size, props.type, props.loading, shake);

  if (props.linkTo) {
    return (
      <DivLink className={klass} to={props.linkTo} target={props.linkTarget} testId={props.testId}>
        {props.children}
        <Spinner active={props.loading} />
      </DivLink>
    );
  }

  if (props.submit) {
    return (
      <button type="submit" className={klass} onClick={handleClick} data-test-id={props.testId}>
        {props.children}
        <Spinner active={props.loading} />
      </button>
    );
  }

  return (
    <div className={klass} onClick={handleClick} data-test-id={props.testId}>
      {props.children}
      <Spinner active={props.loading} />
    </div>
  );
}

function Spinner({ active }: { active?: boolean }) {
  return (
    <div className="inset-0 flex items-center justify-center absolute">
      {active && <PuffLoader size={24} color="var(--color-white-1)" />}
    </div>
  );
}

function className(
  size?: "xxxs" | "xxs" | "xs" | "sm" | "base" | "lg",
  type?: "primary" | "secondary",
  loading?: boolean,
  shake?: boolean,
) {
  size = size || "base";
  type = type || "primary";

  let result = "relative font-medium transition-all duration-100 text-center inline-block";

  if (loading) {
    result += " cursor-default";
  } else {
    result += " cursor-pointer";
  }

  if (size === "xxxs") {
    result += " px-1.5 py-[1px] text-xs rounded-2xl";
  }

  if (size === "xxs") {
    result += " px-2.5 py-1 text-xs rounded-2xl";
  }

  if (size === "xs") {
    result += " px-2.5 py-1 text-sm rounded-full";
  }

  if (size === "sm") {
    result += " px-3 py-1.5 text-sm rounded-full";
  }

  if (size === "base") {
    result += " px-3.5 py-2 rounded-full";
  }

  if (size === "lg") {
    result += " px-4 py-2.5 rounded-full";
  }

  if (type === "primary") {
    result += " bg-accent-1 hover:bg-accent-1-light";
    if (loading) {
      result += " text-content-subtle";
    } else {
      result += " text-white-1";
    }
  }

  if (type === "secondary") {
    result += " border border-surface-outline hover:border-surface-outline ";
    if (loading) {
      result += " text-content-subtle";
    } else {
      result += " text-content-dimmed hover:text-content-accent";
    }
  }

  if (shake) {
    result += " animate-bzzz-wrong";
  }

  return result;
}