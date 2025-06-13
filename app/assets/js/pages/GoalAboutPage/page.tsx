import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as React from "react";

import { Header } from "@/features/goals/GoalPageHeader";
import { Navigation } from "@/features/goals/GoalPageNavigation";

import RichContent from "@/components/RichContent";
import { Avatar } from "turboui";

import { isContentEmpty } from "@/components/RichContent/isContentEmpty";
import { DeprecatedPaths } from "@/routes/paths";
import { DivLink } from "turboui";
import { useLoadedData } from "./loader";

export function Page() {
  const { goal } = useLoadedData();

  return (
    <Pages.Page title={[goal.name!]}>
      <Paper.Root size="large">
        <Navigation space={goal.space!} />

        <Paper.Body minHeight="none">
          <Header goal={goal} activeTab="about" />

          <ChampionAndReviewer goal={goal} />

          <Description goal={goal} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

const DimmedLabel = ({ children }) => (
  <div className="text-xs uppercase font-medium mb-1 tracking-wider">{children}</div>
);

const AvatarAndName = ({ person }) => {
  const profilePath = DeprecatedPaths.profilePath(person.id);

  return (
    <DivLink to={profilePath}>
      <div className="flex items-center gap-1.5">
        <Avatar person={person} size="tiny" />
        <div className="font-medium">{person.fullName}</div>
      </div>
    </DivLink>
  );
};

function Description({ goal }) {
  return (
    <div className="mt-8">
      <DimmedLabel>Description</DimmedLabel>
      {isContentEmpty(goal.description) ? (
        <div className="text-content-dimmed">No description provided</div>
      ) : (
        <RichContent jsonContent={goal.description} />
      )}
    </div>
  );
}

function ChampionAndReviewer({ goal }) {
  return (
    <div className="flex item-center mt-8 gap-12">
      <div>
        <DimmedLabel>Champion</DimmedLabel>
        <AvatarAndName person={goal.champion} />
      </div>

      <div>
        <DimmedLabel>Reviewer</DimmedLabel>
        <AvatarAndName person={goal.reviewer} />
      </div>
    </div>
  );
}
