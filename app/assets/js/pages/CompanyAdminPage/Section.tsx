import classNames from "classnames";
import React from "react";
import { createTestId } from "@/utils/testid";

interface Props {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function Section({ title, subtitle, actions, children }: Props) {
  const className = classNames("flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-0", {
    "mb-6": subtitle,
    "mb-2": !subtitle,
  });

  return (
    <div className="mt-10" data-test-id={createTestId(title, "section")}>
      <div className={className}>
        <div>
          <h2 className="font-bold">{title}</h2>
          {subtitle && <p className="text-sm max-w-xl">{subtitle}</p>}
        </div>

        {actions && <div className="w-full sm:w-auto">{actions}</div>}
      </div>

      {children}
    </div>
  );
}
