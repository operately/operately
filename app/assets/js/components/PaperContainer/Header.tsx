import * as React from "react";

import classNames from "classnames";
import { usePaperSizeHelpers } from "./";

type LayoutType = "title-left-actions-right" | "title-center-actions-left";

interface Props {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  underline?: boolean;
  layout?: LayoutType;
}

const DEFAULT_PROPS = {
  layout: "title-left-actions-right" as LayoutType,
  underline: false,
};

export function Header(props: Props) {
  props = { ...DEFAULT_PROPS, ...props };

  const { negHor, negTop } = usePaperSizeHelpers();

  const className = classNames("flex items-center justify-between", {
    "mb-6": true,
    "pt-5 pb-4": props.underline,
    "border-b border-stroke-base": props.underline,
    [negHor]: props.underline,
    [negTop]: props.underline,
    "px-4 sm:px-8": props.underline,
  });

  if (props.layout === "title-center-actions-left") {
    return <HeaderCentered {...props} className={className} />;
  }

  if (props.layout === "title-left-actions-right") {
    return <HeaderLeft {...props} className={className} />;
  }

  throw new Error(`Unknown layout: ${props.layout}`);
}

function HeaderLeft(props: Props & { className: string }) {
  return (
    <div className={classNames(props.className, "gap-3")}>
      <div className="min-w-0">
        <Title title={props.title} />
        {props.subtitle && <Subtitle message={props.subtitle} />}
      </div>

      <div className="shrink-0">{props.actions}</div>
    </div>
  );
}

function HeaderCentered(props: Props & { className: string }) {
  return (
    <div className={classNames(props.className, "max-sm:gap-3")}>
      <div className="max-sm:shrink-0 max-sm:whitespace-nowrap sm:w-[30%]">{props.actions}</div>

      <div className="min-w-0 flex-1 sm:w-[50%] sm:text-center">
        <Title title={props.title} />
        {props.subtitle && <Subtitle message={props.subtitle} />}
      </div>

      <div className="hidden sm:block sm:w-[30%]" />
    </div>
  );
}

function Title({ title }: { title: string }) {
  return <div className="truncate text-content-accent text-lg md:text-2xl font-extrabold">{title}</div>;
}

function Subtitle({ message }: { message: string }) {
  return <div className="mt-2">{message}</div>;
}
