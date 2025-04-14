import * as React from "react";
import classNames from "../utils/classnames";

export namespace Page {
  export type Size =
    | "tiny"
    | "small"
    | "medium"
    | "large"
    | "xlarge"
    | "xxlarge"
    | "fullwidth";

  export interface Option {
    icon: React.ReactElement;
    title: string;
  }

  export interface Props {
    title: string | string[];
    size?: Size;
    options?: Option[];
    children?: React.ReactNode;
  }
}

const sizeClasses: Record<Page.Size, string> = {
  tiny: "max-w-xl mx-auto",
  small: "max-w-2xl mx-auto",
  medium: "max-w-4xl mx-auto",
  large: "sm:max-w-[90%] lg:max-w-5xl mx-auto",
  xlarge: "sm:max-w-[90%] lg:max-w-6xl mx-auto",
  xxlarge: "sm:max-w-[90%] lg:max-w-7xl mx-auto",
  fullwidth: "max-w-full mx-4",
};

export function Page(props: Page.Props) {
  useHtmlTitle(props.title);
  const containerClass = `${sizeClasses[props.size || "medium"]}`;

  return (
    <div className={containerClass}>
      <Paper>
        <PageOptions options={props.options} />
        {props.children}
      </Paper>
    </div>
  );
}

function PageOptions({ options }: { options?: Page.Option[] }) {
  if (!options) {
    return null;
  }

  if (options.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-end mb-6">
      <div className="flex items-center gap-4">
        {options.map((option, index) => (
          <div
            key={index}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 cursor-pointer"
          >
            {option.icon}
            <span>{option.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Paper({ children }: { children: React.ReactNode }) {
  const classname = classNames(
    "relative",
    "bg-surface-base",

    // full height on mobile, no min height on larger screens
    "min-h-dvh sm:min-h-0",

    // apply border shadow and rounded corners on larger screens
    "sm:border sm:border-surface-outline",

    "sm:rounded-lg",
    "sm:shadow-xl"
  );

  return <div className={classname}>{children}</div>;
}

function useHtmlTitle(title: string | string[]) {
  if (!title) {
    throw new Error("Page title cannot be null");
  }

  const titleArray = Array.isArray(title) ? title : [title];

  if (titleArray.length === 0) {
    throw new Error("Page title cannot be empty");
  }

  if (titleArray.some((t) => t === null || t === undefined)) {
    throw new Error("Page title cannot contain null or undefined");
  }

  React.useEffect(() => {
    document.title = titleArray.join(" / ");
  }, [titleArray]);
}
