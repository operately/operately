import React from "react";

import * as Projects from "@/models/projects";
import * as ProjectContributors from "@/models/projectContributors";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";

import { useLoadedData, useRefresh } from "./loader";
import { usePageState, PageState } from "./usePageState";
import { AddContributorForm } from "./AddContributorForm";
import { PrimaryButton } from "@/components/Buttons";
import { ProjectPageNavigation } from "@/components/ProjectPageNavigation";

import ContributorItem from "./ContributorItem";

export function Page() {
  const { project } = useLoadedData();
  const pageState = usePageState(project);
  const refetch = useRefresh();

  return (
    <Pages.Page title={["Team & Access", project.name!]}>
      <Paper.Root>
        <ProjectPageNavigation project={project} />

        <Paper.Body>
          <Title state={pageState} />
          <AddContributorForm state={pageState} />
          <ContributorList project={project} refetch={refetch} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Title({ state }: { state: PageState }) {
  return (
    <div className="rounded-t-[20px] pb-12">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-extrabold ">Team &amp; Access</div>
          <div className="text-medium">Manage the team and access to this project</div>
        </div>

        <AddContribButton state={state} />
      </div>
    </div>
  );
}

function AddContribButton({ state }: { state: PageState }) {
  return (
    <PrimaryButton onClick={state.showAddContribForm} testId="add-contributor-button" size="sm">
      Add Contributor
    </PrimaryButton>
  );
}

function ContributorList({ project, refetch }: { project: Projects.Project; refetch: () => void }) {
  const { champion, reviewer, contributors } = ProjectContributors.splitByRole(project.contributors!);

  return (
    <div className="flex flex-col border-t border-stroke-base">
      {champion && <ContributorItem contributor={champion} project={project} refetch={refetch} />}
      {reviewer && <ContributorItem contributor={reviewer} project={project} refetch={refetch} />}

      {contributors.map((c) => (
        <ContributorItem key={c.id} contributor={c} project={project} refetch={refetch} />
      ))}
    </div>
  );
}
