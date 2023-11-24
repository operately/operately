import React from "react";

import * as Projects from "@/graphql/Projects";
import * as Contributors from "@/graphql/Projects/contributors";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";

import { ProjectPageNavigation } from "@/components/ProjectPageNavigation";
import { ContributorSearch, ResponsibilityInput, CancelButton, AddContribButton } from "./FormElements";
import ContributorItem from "./ContributorItem";
import { GhostButton } from "@/components/Button";

import { useLoadedData, useRefresh } from "./loader";
import { useForm } from "./useForm";

export function Page() {
  const { project } = useLoadedData();
  const refetch = useRefresh();

  const form = useForm(project);

  return (
    <Pages.Page title={["Contributors", project.name]}>
      <Paper.Root>
        <ProjectPageNavigation project={project} />

        <Paper.Body>
          <Title form={form} />
          <ContributorList project={project} refetch={refetch} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Title({ form }) {
  return (
    <div className="rounded-t-[20px] pb-12">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-extrabold ">Contributors</div>
          <div className="text-medium">People who are contributing to this project and their responsibilities.</div>
        </div>

        {form.addContrib.hasPermission && <AddButton onClick={form.addContrib.activate} />}
      </div>

      {form.addContrib.active && <AddContribForm form={form} />}
    </div>
  );
}

function AddContribForm({ form }) {
  return (
    <div className="bg-shade-1 border-y border-shade-1 -mx-12 px-12 mt-4 py-8">
      <ContributorSearch title="Contributor" projectID={form.project.id} onSelect={form.addContrib.setPersonID} />

      <ResponsibilityInput value={form.addContrib.responsibility} onChange={form.addContrib.setResponsibility} />

      <div className="flex mt-8 gap-2">
        <AddContribButton onClick={form.addContrib.submit} disabled={!form.addContrib.submittable} />
        <CancelButton onClick={close} />
      </div>
    </div>
  );
}

function AddButton({ onClick }) {
  return (
    <GhostButton onClick={onClick} testId="add-contributor-button">
      Add Contributor
    </GhostButton>
  );
}

function ContributorList({ project, refetch }: { project: Projects.Project; refetch: () => void }) {
  const { champion, reviewer, contributors } = Contributors.splitByRole(project.contributors);

  return (
    <div className="flex flex-col">
      <ContributorItem contributor={champion} role="champion" project={project} refetch={refetch} />
      <ContributorItem contributor={reviewer} role="reviewer" project={project} refetch={refetch} />

      {contributors.map((c) => (
        <ContributorItem key={c.id} contributor={c} role="contributor" project={project} refetch={refetch} />
      ))}
    </div>
  );
}
