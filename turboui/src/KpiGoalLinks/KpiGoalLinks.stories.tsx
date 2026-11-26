import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { KpiGoalLinks } from ".";
import { useDemoKpiGoalLinks } from "../demos/kpis/useDemoKpiGoalLinks";

function Example() {
  const data = useDemoKpiGoalLinks();
  return (
    <div className="max-w-xl p-6">
      <KpiGoalLinks data={data} />
    </div>
  );
}

export default { title: "Components/KPI goal links", component: Example } satisfies Meta<typeof Example>;

export const GoalOverview: StoryObj<typeof Example> = {};
