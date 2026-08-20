import React from "react";

import { TestableElement, createTestId } from "../TestableElement";
import classNames from "../utils/classnames";

export namespace PageSection {
  export interface Props extends TestableElement {
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
    children: React.ReactNode;
  }
}

export function PageSection({ title, subtitle, testId, actions, children }: PageSection.Props) {
  const resolvedTestId = testId ?? createTestId(title, "section");

  return (
    <div className="mt-10" data-test-id={resolvedTestId}>
      <SectionTitle title={title} subtitle={subtitle} actions={actions} />
      {children}
    </div>
  );
}

function SectionTitle({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  const className = classNames("flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-0", {
    "mb-6": subtitle,
    "mb-2": !subtitle,
  });

  return (
    <div className={className}>
      <div>
        <h2 className="font-bold">{title}</h2>
        {subtitle && <p className="text-sm max-w-xl">{subtitle}</p>}
      </div>

      {actions && <div className="w-full sm:w-auto">{actions}</div>}
    </div>
  );
}
