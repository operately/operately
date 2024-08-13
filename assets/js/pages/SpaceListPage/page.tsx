import React from "react";

import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";

import { GhostButton } from "@/components/Button";
import { SpaceCardLink, SpaceCardGrid } from "@/components/SpaceCards";

import { useLoadedData } from "./loader";
import { Paths, compareIds } from "@/routes/paths";

export function Page() {
  const { company, spaces } = useLoadedData();

  const sortedAndFilteredSpaces = [...spaces]
    .sort((a, b) => a.name!.localeCompare(b.name!))
    .filter((space) => !compareIds(space.id!, company.companySpaceId!));

  return (
    <Pages.Page title="Home">
      <Paper.Root size="large">
        <div className="flex justify-center gap-4 pt-16 flex-wrap">
          <div className="relative w-80 px-4 py-3">
            <div className="font-bold">Your {company.name} spaces</div>
            <div className="text-sm mt-4">
            Manage projects, track goals, and access company-wide information through your team spaces. Each space represents a department or team initiative.
            </div>
          </div>

          <SpaceCardLink
            space={{
              name: "Company Space",
              color: "text-cyan-500",
              icon: "IconBuildingEstate",
              id: company.companySpaceId!,
              mission: "Organization-wide announcements and resources",
              privateSpace: false,
              isCompanySpace: true,
              isMember: true,
            }}
          />
        </div>

        <div className="flex items-center justify-center mt-8 mb-8">
          <div className="flex-1 mx-4 border-t border-surface-outline"></div>

          <GhostButton testId="add-space" linkTo={Paths.newSpacePath()} type="primary">
            Add a new space
          </GhostButton>

          <div className="flex-1 mx-4 border-t border-surface-outline"></div>
        </div>

        <SpaceCardGrid>
          {sortedAndFilteredSpaces.map((space) => (
            <SpaceCardLink key={space.id} space={space} />
          ))}
        </SpaceCardGrid>
      </Paper.Root>
    </Pages.Page>
  );
}
