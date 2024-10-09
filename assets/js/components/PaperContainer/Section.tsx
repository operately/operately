import React from "react";
import { TestableElement, createTestId } from "@/utils/testid";

interface Props extends TestableElement {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function Section({ title, subtitle, testId, children }: Props) {
  testId = testId ?? createTestId(title, "section");

  return (
    <div className="mt-10" data-test-id={testId}>
      <SectionTitle title={title} subtitle={subtitle} />

      {children}
    </div>
  );
}

interface SectionTitleProps {
  title: string;
  subtitle?: string;
}

function SectionTitle({ title, subtitle }: SectionTitleProps) {
  return (
    <div className="mb-2">
      <h2 className="font-bold text-lg">{title}</h2>
      {subtitle && <p className="text-sm mb-4">{subtitle}</p>}
    </div>
  );
}
