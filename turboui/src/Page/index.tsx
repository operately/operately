import * as React from "react";
import classNames from "../utils/classnames";

type SizeType =
  | "tiny"
  | "small"
  | "medium"
  | "large"
  | "xlarge"
  | "xxlarge"
  | "fullwidth";

interface PageOption {
  icon: React.ReactElement;
  title: string;
}

interface PageProps {
  title: string | string[];
  size?: SizeType;
  options?: PageOption[];
  children?: React.ReactNode;
}

const sizeClasses: Record<SizeType, string> = {
  tiny: "max-w-xl",
  small: "max-w-2xl",
  medium: "max-w-4xl",
  large: "sm:max-w-[90%] lg:max-w-5xl ",
  xlarge: "sm:max-w-[90%] lg:max-w-6xl ",
  xxlarge: "sm:max-w-[90%] lg:max-w-7xl",
  fullwidth: "max-w-full mx-8",
};

export function Page({
  title,
  size = "medium",
  options = [],
  children,
}: PageProps) {
  useHtmlTitle(title);

  const containerClass = `${sizeClasses[size]}`;

  return (
    <div className={containerClass}>
      <Paper>
        <PageOptions options={options} />
        {children}
      </Paper>
    </div>
  );
}

function PageOptions({ options }: { options: PageOption[] }) {
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
