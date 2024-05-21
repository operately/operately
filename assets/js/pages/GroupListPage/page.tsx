import React from "react";

import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";

import { GhostButton } from "@/components/Button";
import { SpaceCardLink, SpaceCardGrid } from "@/components/SpaceCards";

import { useLoadedData } from "./loader";


export function Page() {
  const { company, groups } = useLoadedData();

  const sortedAndFilteredGroups = [...groups]
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter((group) => group.id !== company.companySpaceId);

  return (
    <Pages.Page title="Lobby">
      <Paper.Root size="large">
        <div className="flex justify-center gap-4 pt-16 flex-wrap">
          <div className="relative w-64 px-4 py-3">
            <div className="font-bold">Welcome Back!</div>
            <div className="text-sm mt-4">
              You are in the lobby of Operately. This is where you can find all the spaces you are a part of.
            </div>
          </div>

          <SpaceCardLink
            group={{
              name: "Company Space",
              color: "text-cyan-500",
              icon: "IconBuildingEstate",
              id: company.companySpaceId!,
              mission: "Everyone in the company",
              privateSpace: false,
              isCompanySpace: true,
              isMember: true,
            }}
          />
        </div>

        <div className="flex items-center justify-center mt-8 mb-8">
          <div className="flex-1 mx-4 border-t border-surface-outline"></div>

          <GhostButton testId="add-group" linkTo="/spaces/new" type="primary">
            Add a new Space
          </GhostButton>

          <div className="flex-1 mx-4 border-t border-surface-outline"></div>
        </div>

        <SpaceCardGrid>
          {sortedAndFilteredGroups.map((group) => (
            <SpaceCardLink key={group.id} group={group} />
          ))}
        </SpaceCardGrid>
      </Paper.Root>
    </Pages.Page>
  );
}
