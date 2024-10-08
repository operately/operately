import React from "react";

import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Spaces from "@/models/spaces";
import * as Companies from "@/models/companies";

import { GhostButton } from "@/components/Buttons";
import { SpaceCardLink, SpaceCardGrid } from "@/features/spaces/SpaceCards";

import { useLoadedData } from "./loader";
import { Paths, compareIds } from "@/routes/paths";
import { HorizontalLine } from "@/components/Line";

export function Page() {
  const { company, spaces } = useLoadedData();

  const companySpace = spaces.find((space) => compareIds(space.id!, company.companySpaceId!));
  const nonCompanySpaces = spaces.filter((space) => !compareIds(space.id!, company.companySpaceId!));

  return (
    <Pages.Page title="Home" testId="company-home">
      <Paper.Root size="large">
        <div className="flex justify-center gap-4 pt-16 flex-wrap">
          <Title company={company} />
          <SpaceCardLink space={companySpace!} />
        </div>

        <AddNew />
        <SpaceGrid spaces={nonCompanySpaces} />
      </Paper.Root>
    </Pages.Page>
  );
}

function AddNew() {
  return (
    <div className="flex items-center justify-center mt-8 mb-8">
      <HorizontalLine className="mx-4" />

      <GhostButton testId="add-space" linkTo={Paths.newSpacePath()}>
        Add a new space
      </GhostButton>

      <HorizontalLine className="mx-4" />
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
