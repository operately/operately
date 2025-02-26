import * as React from "react";
import * as Paper from "@/components/PaperContainer";

import { Feed, useItemsQuery } from "@/features/Feed";

export function GoalFeed({ goal }) {
  return (
    <Paper.DimmedSection>
      <div className="uppercase text-xs text-content-accent font-semibold mb-4">Activity</div>
      <GoalFeedItems goal={goal} />
    </Paper.DimmedSection>
  );
}

function GoalFeedItems({ goal }) {
  const { data, loading, error } = useItemsQuery("goal", goal.id);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return null;

  return <Feed items={data!.activities!} page="goal" testId="goal-feed" />;
}
