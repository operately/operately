import { createTestId } from "@/utils/testid";
import classNames from "classnames";
import * as React from "react";
import { BlackLink } from "turboui";

interface Props {
  icon: any;
  title: string;
  linkTo?: string;
  onClick?: () => void;
  danger?: boolean;
  description?: string;
}

export function OptionsMenuItem({ icon, title, linkTo, onClick, danger, description }: Props) {
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

      <div>
        <div
          className={classNames("font-semibold", {
            "group-hover:text-red-900": danger,
            "text-content-accent": !danger,
          })}
        >
          {title}
        </div>
        {description && <div className="text-xs text-content-dimmed font-normal mt-0.5">{description}</div>}
      </div>
    </div>
  );

  if (onClick) {
    return (
      <div className={className} onClick={onClick} data-test-id={testId}>
        {content}
      </div>
    );
  }

  return (
    <div className={className}>
      <BlackLink to={linkTo!} testId={testId} underline="hover" className="w-full">
        {content}
      </BlackLink>
    </div>
  );
}
