import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";

import { Feed, useItemsQuery } from "@/features/Feed";
import { TargetList } from "./TargetList";
import { Options } from "./Options";
import { CheckIns } from "./CheckIns";
import { Navigation } from "./Navigation";
import { Banner } from "./Banner";
import { Header } from "@/features/goals/GoalPageHeader";

import Avatar from "@/components/Avatar";
import RichContent from "@/components/RichContent";

import { useLoadedData } from "./loader";

export function Page() {
  const { goal } = useLoadedData();

  return (
    <Pages.Page title={[goal.name]}>
      <Paper.Root>
        <Navigation space={goal.space} />

        <Paper.Body minHeight="none">
          <Banner goal={goal} />
          <Options goal={goal} />
          <Header goal={goal} activeTab="about" />

          <div className="flex item-center mt-8 gap-12">
            <div>
              <DimmedLabel>Timeframe</DimmedLabel>
              <div className="font-medium">{goal.timeframe}</div>
            </div>

            <div>
              <DimmedLabel>Champion</DimmedLabel>
              <AvatarAndName person={goal.champion} />
            </div>

            <div>
              <DimmedLabel>Reviewer</DimmedLabel>
              <AvatarAndName person={goal.reviewer} />
            </div>
          </div>

          <Description goal={goal} />

          <div className="mt-8">
            <DimmedLabel>Success Conditions</DimmedLabel>
            <TargetList goal={goal} />
          </div>

          <div className="mt-8">
            <DimmedLabel>Last Check-in</DimmedLabel>
            <CheckIns goal={goal} />
          </div>

          <Paper.DimmedSection>
            <div className="uppercase text-xs text-content-accent font-semibold mb-4">Activity</div>
            <FeedForGoal goal={goal} />
          </Paper.DimmedSection>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function FeedForGoal({ goal }) {
  const { data, loading, error } = useItemsQuery("goal", goal.id);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return null;

  return <Feed items={data.activities} page="goal" />;
}

const DimmedLabel = ({ children }) => (
  <div className="text-xs uppercase font-medium mb-1 tracking-wider">{children}</div>
);

const AvatarAndName = ({ person }) => (
  <div className="flex items-center gap-1.5">
    <Avatar person={person} size="tiny" />
    <div className="font-medium">{person.fullName}</div>
  </div>
);

function Description({ goal }) {
  if (!goal.description) return null;

  return (
    <div className="mt-8">
      <DimmedLabel>Description</DimmedLabel>
      <RichContent jsonContent={goal.description} />
    </div>
  );
}
