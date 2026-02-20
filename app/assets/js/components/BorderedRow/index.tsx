import React from "react";

interface Props {
  children: React.ReactNode;
  testId?: string;
}

export function BorderedRow({ children, testId }: Props) {
  return (
    <div className="flex items-center justify-between py-2 border-t last:border-b border-stroke-dimmed" data-test-id={testId}>{children}</div>
  );
}
