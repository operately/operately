import React from "react";

import * as Companies from "@/models/companies";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import MemberList from "./MemberList";
import { Link } from "@/components/Link";

import OptionsMenu from "./OptionsMenu";

import { ProjectsSection } from "./Projects";
import { GoalsSection } from "./Goals";

import { useLoadedData } from "./loader";

export function Page() {
  const { company, group } = useLoadedData();

  return (
    <Pages.Page title={group.name}>
      <Paper.Root size="large">
        <Paper.Body>
          <div className="-mt-4">
            <OptionsMenu group={group} />
          </div>

          <div className="font-medium flex items-center gap-2 w-full justify-center mt-2" data-test-id="group-members">
            <MemberList group={group} />
          </div>

          <div className="flex items-center gap-4 -mb-[24px] mt-5 font-medium">
            <div className={"border-b-4 border-surface-outline p-2 "}>Overview</div>
            <div className="border-b-4 border-transparent p-2 text-content-dimmed">Goals</div>
            <div className="border-b-4 border-transparent p-2 text-content-dimmed">Projects</div>
          </div>

          <Paper.DimmedSection>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded bg-surface p-4 border border-stroke-base shadow">
                <div className="flex justify-between">
                  <div className="uppercase text-xs text-center mb-4">Projects</div>
                </div>

                <div className="text-center">3 ongoing projects</div>
              </div>
            </div>
          </Paper.DimmedSection>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
