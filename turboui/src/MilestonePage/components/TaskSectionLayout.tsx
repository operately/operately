import React from "react";

import { PieChart } from "../../PieChart";

export function TaskSectionLayout({
  sectionTestId,
  hoverBind,
  taskSlideIn,
  completionPercentage,
  headerActions,
  filterControls,
  children,
}: Props) {
  return (
    <div className="space-y-4 pt-6" data-test-id={sectionTestId} {...hoverBind}>
      {taskSlideIn}

      <div className="rounded-lg border border-surface-outline bg-surface-dimmed">
        <div className="flex items-center justify-between border-b border-surface-outline px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-4 w-6 items-center justify-center">
              <PieChart
                size={24}
                slices={[
                  {
                    percentage: completionPercentage,
                    color: "var(--color-callout-success-content)",
                  },
                ]}
              />
            </div>
            <h2 className="font-bold">Tasks</h2>
          </div>
          <div className="flex items-center gap-4">{headerActions}</div>
        </div>

        {filterControls}
        {children}
      </div>
    </div>
  );
}

type Props = {
  sectionTestId: string;
  hoverBind: React.HTMLAttributes<HTMLDivElement>;
  taskSlideIn: React.ReactNode;
  completionPercentage: number;
  headerActions: React.ReactNode;
  filterControls?: React.ReactNode;
  children: React.ReactNode;
};
