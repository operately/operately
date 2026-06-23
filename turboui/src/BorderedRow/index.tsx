import React from "react";

import { TestableElement } from "../TestableElement";

export interface Props extends TestableElement {
  children: React.ReactNode;
}

export function BorderedRow({ children, testId }: Props) {
  return (
    <div className="flex items-center justify-between py-2 border-t last:border-b border-stroke-dimmed" data-test-id={testId}>
      {children}
    </div>
  );
}
