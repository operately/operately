import React from "react";
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
    "border-b border-surface-outline": props.underline,
    [negHor]: props.underline,
    [negTop]: props.underline,
    "px-8": props.underline,
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
    <div className={props.className}>
      <div>
        <Title title={props.title} />
        {props.subtitle && <Subtitle message={props.subtitle} />}
      </div>

      <div>{props.actions}</div>
    </div>
  );
}

function HeaderCentered(props: Props & { className: string }) {
  return (
    <div className={props.className}>
      <div className="w-1/3">{props.actions}</div>

      <div className="w-1/3 text-center flex-1">
        <Title title={props.title} />
        {props.subtitle && <Subtitle message={props.subtitle} />}
      </div>

      <div className="w-1/3" />
    </div>
  );
}

function Title({ title }) {
  return <div className="text-content-accent text-2xl font-extrabold">{title}</div>;
}

function Subtitle({ message }) {
  return <div className="mt-2">{message}</div>;
}
