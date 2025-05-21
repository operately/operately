import * as React from "react";
import classNames from "../utils/classnames";
import { Navigation } from "./Navigation";
import { PageOptions } from "./PageOptions";
import { Paper } from "./Paper";
import { useHtmlTitle } from "./useHtmlTitle";

export namespace Page {
  export type Size = "tiny" | "small" | "medium" | "large" | "xlarge" | "xxlarge" | "fullwidth";

  export interface Option {
    type: "link" | "action";
    icon: React.ElementType;
    label: string;
    link?: string;
    onClick?: () => void;
    hidden?: boolean;
  }

  export interface Props {
    title: string | string[];
    size?: Size;
    options?: Option[];
    children?: React.ReactNode;
    navigation?: Navigation.Item[];
  }
}

const sizeClasses: Record<Page.Size, string> = {
  tiny: "max-w-xl mx-auto",
  small: "max-w-2xl mx-auto",
  medium: "max-w-4xl mx-auto",
  large: "sm:max-w-[90%] lg:max-w-5xl mx-auto",
  xlarge: "sm:max-w-[90%] lg:max-w-6xl mx-auto",
  xxlarge: "sm:max-w-[90%] lg:max-w-7xl mx-auto",
  fullwidth: "max-w-full",
};

// Old style pages
export function Page(props: Page.Props) {
  useHtmlTitle(props.title);
  const containerClass = classNames("sm:my-4", sizeClasses[props.size || "medium"]);

  return (
    <div className={containerClass}>
      {props.navigation && <Navigation items={props.navigation} />}

      <Paper>
        <PageOptions options={props.options} />
        {props.children}
      </Paper>
    </div>
  );
}

// New style pages
export function PageNew(props: Page.Props) {
  useHtmlTitle(props.title);

  const containerClass = classNames("absolute inset-0 sm:p-4 mt-11");

  const innerClass = classNames(
    "absolute",
    "inset-3",
    "bg-surface-base",

    // apply border shadow and rounded corners on larger screens
    "sm:border sm:border-surface-outline",
    "sm:rounded-lg",
    "sm:shadow-xl",
  );

  return (
    <div className={containerClass}>
      {props.navigation && <Navigation items={props.navigation} />}

      <div className={innerClass}>
        <PageOptions options={props.options} />
        {props.children}
      </div>
    </div>
  );
}
