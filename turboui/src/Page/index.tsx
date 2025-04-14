import * as React from "react";

type SizeType = "tiny" | "small" | "medium" | "large" | "xlarge" | "xxlarge" | "fullwidth";

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
  tiny: "max-w-sm",
  small: "max-w-xl",
  medium: "max-w-3xl",
  large: "max-w-5xl",
  xlarge: "max-w-7xl",
  xxlarge: "max-w-[100rem]",
  fullwidth: "w-full",
};

export function Page({ title, size = "medium", options = [], children }: PageProps) {
  if (!title) {
    throw new Error("Page title cannot be null");
  }

  const titleArray = Array.isArray(title) ? title : [title];
  const containerClass = `mx-auto ${sizeClasses[size]}`;

  React.useEffect(() => {
    document.title = titleArray.join(" / ");
  }, [titleArray]);

  return (
    <div className={containerClass}>
      {options.length > 0 && (
        <div className="flex items-center justify-end mb-6">
          <div className="flex items-center gap-4">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 cursor-pointer">
                {option.icon}
                <span>{option.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
