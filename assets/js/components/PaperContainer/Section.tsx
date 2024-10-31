import React from "react";
import { TestableElement, createTestId } from "@/utils/testid";
import classNames from "classnames";

interface Props extends TestableElement {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function Section({ title, subtitle, testId, actions, children }: Props) {
  testId = testId ?? createTestId(title, "section");

  return (
    <div className="mt-10" data-test-id={testId}>
      <SectionTitle title={title} subtitle={subtitle} actions={actions} />

      {children}
    </div>
  );
}

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

function SectionTitle({ title, subtitle, actions }: SectionTitleProps) {
  const className = classNames("flex items-center justify-between", {
    "mb-6": subtitle,
    "mb-2": !subtitle,
  });

  return (
    <div className={className}>
      <div>
        <h2 className="font-bold text-lg">{title}</h2>
        {subtitle && <p className="text-sm max-w-xl">{subtitle}</p>}
      </div>

      {actions && <div>{actions}</div>}
    </div>
  );
}
