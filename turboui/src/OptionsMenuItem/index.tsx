import { createTestId } from "../TestableElement";
import classNames from "classnames";
import * as React from "react";
import { BlackLink } from "../Link";

interface Props {
  icon: any;
  title: string;
  linkTo?: string;
  linkTarget?: string;
  onClick?: () => void;
  danger?: boolean;
  description?: string;
  /** Keeps the description on a single line, ending in an ellipsis when it does not fit. */
  truncateDescription?: boolean;
  hidden?: boolean;
}

export function OptionsMenuItem({
  icon,
  title,
  linkTo,
  linkTarget,
  onClick,
  danger,
  description,
  truncateDescription,
  hidden,
}: Props) {
  const testId = createTestId(title);

  const className = classNames(
    "flex items-center gap-4 group py-3 font-medium",
    "border-t border-stroke-base",
    "last:border-b",
    {
      "cursor-pointer": !!onClick,
      "text-red-600": danger,
    },
  );

  const content = (
    <div className="flex items-center gap-4 w-full">
      <div className={classNames({ "text-red-500 group-hover:text-red-700": danger })}>
        {React.createElement(icon, { size: 18 })}
      </div>

      <div className="flex-1 min-w-0">
        <div
          className={classNames("font-semibold", {
            "group-hover:text-red-900": danger,
            "text-content-accent": !danger,
          })}
        >
          {title}
        </div>
        {description && (
          <div
            className={classNames("text-xs text-content-dimmed font-normal mt-0.5", { truncate: truncateDescription })}
            title={truncateDescription ? description : undefined}
          >
            {description}
          </div>
        )}
      </div>
    </div>
  );

  if (hidden) {
    return null;
  }

  if (onClick) {
    return (
      <div className={className} onClick={onClick} data-test-id={testId}>
        {content}
      </div>
    );
  }

  return (
    <div className={className}>
      <BlackLink to={linkTo!} target={linkTarget} testId={testId} underline="hover" className="w-full">
        {content}
      </BlackLink>
    </div>
  );
}
