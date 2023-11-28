import React from "react";

import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";
import * as Pages from "@/components/Pages";

import { GhostButton } from "@/components/Button";
import { JumpToSpaceHint } from "./JumpToSpaceHint";

import { SpaceCardLink, SpaceCardGrid } from "@/components/SpaceCards";

import { useLoadedData } from "./loader";

export function Page() {
  const { groups } = useLoadedData();

  return (
    <Pages.Page title="Lobby">
      <div className="font-medium flex items-center gap-2 w-full justify-center mt-3">
        <Icons.IconPlant2 size={20} className="text-accent-1" strokeWidth={2} />
        Lobby &middot; Choose a Space to get started
      </div>

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
              id: "company",
              mission: "Everyone in the company",
              privateSpace: false,
            }}
            commingSoon={true}
          />

          <SpaceCardLink
            group={{
              name: "Personal Space",
              color: "text-green-500",
              icon: "IconTrees",
              id: "personal",
              mission: "Your own private space in Operately",
              privateSpace: true,
            }}
            commingSoon={true}
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
          {groups.map((group) => (
            <SpaceCardLink key={group.id} group={group} />
          ))}
        </SpaceCardGrid>
      </Paper.Root>

      <JumpToSpaceHint />
    </Pages.Page>
  );
}
