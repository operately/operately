import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";

import { useLoadedData } from "./loader";
import { Navigation } from "./Navigation";
import Avatar from "@/components/Avatar";
import { FeedForGoal } from "@/components/Feed";

export function Page() {
  const { goal } = useLoadedData();

  return (
    <Pages.Page title={[goal.name]}>
      <Paper.Root size="small">
        <Navigation space={goal.space} />

        <Paper.Body minHeight="none">
          <div className="text-content-accent text-3xl font-extrabold">{goal.name}</div>

          <div className="flex item-center mt-4 gap-6">
            <div>
              <DimmedLabel>Champion</DimmedLabel>
              <AvatarAndName person={goal.champion} />
            </div>

            <div>
              <DimmedLabel>Reviewer</DimmedLabel>
              <AvatarAndName person={goal.reviewer} />
            </div>

            <div>
              <DimmedLabel>Timeframe</DimmedLabel>
              <div className="font-medium">{goal.timeframe}</div>
            </div>
          </div>

          <Paper.DimmedSection>
            <div className="uppercase text-xs text-content-accent font-semibold mb-4">Goal Activity</div>
            <FeedForGoal goal={goal} />
          </Paper.DimmedSection>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

export const DimmedLabel = ({ children }) => (
  <div className="text-xs uppercase font-medium mb-1 tracking-wider">{children}</div>
);

export const AvatarAndName = ({ person }) => (
  <div className="flex items-center gap-2">
    <Avatar person={person} size="tiny" />
    <div>{person.fullName}</div>
  </div>
);
