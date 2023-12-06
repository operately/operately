import React from "react";

import * as Companies from "@/models/companies";
import * as Pages from "@/components/Pages";

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
      <OptionsMenu group={group} />

      <div className="font-medium flex items-center gap-2 w-full justify-center mt-2" data-test-id="group-members">
        <MemberList group={group} />
      </div>

      <div className="max-w-screen-lg mx-auto w-[90%]">
        <ProjectsSection group={group} />

        {Companies.hasFeature(company, "space-documents") && (
          <div className="flex items-start justify-center mb-8 border-t border-surface-outline pt-4">
            <div className="w-48">
              <div className="text-content-accent font-bold">Documents</div>
              <Link to={`/spaces/${group.id}/projects`}>Manage Documents</Link>
            </div>
            <div className="flex-1"></div>
          </div>
        )}

        {Companies.hasFeature(company, "space-calendar") && (
          <div className="flex items-start justify-center mb-8 border-t border-surface-outline pt-4">
            <div className="w-48">
              <div className="text-content-accent font-bold">Calendar</div>
              <Link to={`/spaces/${group.id}/projects`}>Manage Calendar</Link>
            </div>
            <div className="flex-1"></div>
          </div>
        )}

        {Companies.hasFeature(company, "goals") && <GoalsSection group={group} />}
      </div>
    </Pages.Page>
  );
}
