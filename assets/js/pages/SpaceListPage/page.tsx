import React from "react";

import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Spaces from "@/models/spaces";
import * as Companies from "@/models/companies";
import * as People from "@/models/people";
import * as Icons from "@tabler/icons-react";

import { GhostButton, SecondaryButton } from "@/components/Buttons";
import { SpaceCardLink, SpaceCardGrid } from "@/features/spaces/SpaceCards";

import { useLoadedData } from "./loader";
import { Paths, compareIds } from "@/routes/paths";
import { HorizontalLine } from "@/components/Line";
import { Feed, useItemsQuery } from "@/features/Feed";
import { useMe } from "@/contexts/CurrentUserContext";
import { BlackLink } from "@/components/Link";

export function Page() {
  const me = useMe();
  const { company, spaces } = useLoadedData();

  return (
    <Pages.Page title="Home" testId="company-home">
      <Paper.Root size="large">
        <p className=" text-center font-bold text-4xl mt-20">Good afternoon, {People.firstName(me!)}!</p>

        <div className="border border-surface-outline bg-surface-base rounded-2xl p-3 w-[70%] m-auto mt-6 mb-4 flex items-center gap-4">
          <Icons.IconSearch size={20} />
          Search or jump to spaces, projects, goals...
        </div>

        <div className="flex items-center gap-4 justify-center mb-12 mt-2">
          Quick links:
          <BlackLink to="/new">New Project</BlackLink>
          <BlackLink to="/new">New Goal</BlackLink>
          <BlackLink to="/new">New Space</BlackLink>
        </div>

        <div className="p-12">
          <div className="font-extrabold text-2xl">Your Spaces</div>
          <p className="mb-8 w-96 text-sm mt-1">
            Manage projects, track goals, and access company-wide information through your team spaces.
          </p>

          <SpaceGrid spaces={spaces} />
        </div>

        <div className="p-12">
          <div className="font-extrabold text-2xl">What's new?</div>
          <p className="mb-8 w-96 text-sm mt-1">
            Showing the latest activity in {company.name}. Stay up to date with your team's progress.
          </p>

          <div className="bg-surface-base p-12 border border-surface-outline rounded-2xl">
            <div className="flex items-center gap-4 mb-8">
              View:
              <BlackLink to="/new">All activity</BlackLink>
              <BlackLink to="/new">My manager</BlackLink>
              <BlackLink to="/new">My reports</BlackLink>
            </div>

            <ActivityFeed />
          </div>
        </div>
      </Paper.Root>
    </Pages.Page>
  );
}

function ActivityFeed() {
  const { company } = useLoadedData();
  const { data, loading, error } = useItemsQuery("company", company.id!);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error</div>;

  return <Feed items={data!.activities!} testId="company-feed" page="company" />;
}

function AddNew() {
  return (
    <div className="flex items-center mt-8 mb-8 gap-2">
      <SecondaryButton testId="add-space" linkTo={Paths.newSpacePath()} size="sm">
        Set a new goal
      </SecondaryButton>

      <SecondaryButton testId="add-space" linkTo={Paths.newSpacePath()} size="sm">
        Start a new project
      </SecondaryButton>

      <SecondaryButton testId="add-space" linkTo={Paths.newSpacePath()} size="sm">
        Add a new space
      </SecondaryButton>
    </div>
  );
}

function SpaceGrid({ spaces }: { spaces: Spaces.Space[] }) {
  const sorted = [...spaces].sort((a, b) => a.name!.localeCompare(b.name!));

  return (
    <SpaceCardGrid>
      {sorted.map((space) => (
        <SpaceCardLink key={space.id} space={space} />
      ))}
    </SpaceCardGrid>
  );
}

function Title({ company }: { company: Companies.Company }) {
  return (
    <div className="relative w-80 px-4 py-3">
      <div className="font-bold">Your {company.name} spaces</div>
      <div className="text-sm mt-4">
        Manage projects, track goals, and access company-wide information through your team spaces. Each space
        represents a department or team initiative.
      </div>
    </div>
  );
}
