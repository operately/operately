import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";

import classnames from "classnames";
import Avatar from "@/components/Avatar";

import { Feed, useItemsQuery } from "@/features/Feed";
import { TargetList } from "./TargetList";
import { Options } from "./Options";
import { CheckIns } from "./CheckIns";
import { Navigation } from "./Navigation";
import { Banner } from "./Banner";
import { ProjectListItem } from "@/features/ProjectListItem";
import { useLoadedData } from "./loader";
import RichContent from "@/components/RichContent";
import { Link } from "@/components/Link";
import { Paths } from "@/routes/paths";

export function Page() {
  const { goal } = useLoadedData();

  return (
    <Pages.Page title={[goal.name]}>
      <Paper.Root size="medium">
        <Navigation space={goal.space} />

        <Paper.Body minHeight="none">
          <Banner goal={goal} />

          <div className="flex items-center justify-between">
            <div
              className={classnames(
                "flex gap-2 items-center",
                "font-bold",
                "break-word",
                "text-3xl",
                "text-content-accent",
              )}
            >
              {goal.name}
            </div>

            <div className="flex gap-4 items-center">
              <Options goal={goal} />
            </div>
          </div>

          <div className="flex item-center mt-4 gap-12">
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
            <DimmedLabel>Parent Goal</DimmedLabel>
            <ParentGoal goal={goal} />
          </div>

          <div className="mt-8">
            <DimmedLabel>Projects</DimmedLabel>
            <ProjectList goal={goal} />
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

export function ProjectList({ goal }: { goal: Goals.Goal }) {
  if (goal.projects?.length === 0) {
    return <div className="text-sm">No projects yet</div>;
  }

  return (
    <>
      {goal.projects!.map((project) => (
        <div key={project!.id} className="py-2 bg-surface flex flex-col border-t last:border-b border-stroke-base">
          <ProjectListItem key={project!.id} project={project!} avatarPosition="right" />
        </div>
      ))}
    </>
  );
}

function Description({ goal }) {
  if (!goal.description) return null;

  return (
    <div className="mt-8">
      <DimmedLabel>Description</DimmedLabel>
      <RichContent jsonContent={goal.description} />
    </div>
  );
}

function ParentGoal({ goal }) {
  if (!goal.parentGoal) {
    return <div className="text-sm">No parent goal</div>;
  }

  const path = Paths.goalPath(goal.parentGoal.id);

  return (
    <div className="flex items-center gap-2">
      <div className="font-medium">
        <Link to={path}>{goal.parentGoal.name}</Link>
      </div>
    </div>
  );
}
