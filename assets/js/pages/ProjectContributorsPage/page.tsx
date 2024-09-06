import React from "react";

import * as Projects from "@/models/projects";
import * as ProjectContributors from "@/models/projectContributors";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";

import { ProjectPageNavigation } from "@/components/ProjectPageNavigation";
import {
  ContributorSearch,
  ResponsibilityInput,
  CancelButton,
  AddContribButton,
  PermissionsInput,
} from "./FormElements";
import ContributorItem from "./ContributorItem";
import { FilledButton } from "@/components/Buttons";

import { useLoadedData, useRefresh } from "./loader";
import { useForm, FormState } from "./useForm";

export function Page() {
  const { project } = useLoadedData();
  const refetch = useRefresh();

  const form = useForm(project);

  return (
    <Pages.Page title={["Contributors", project.name!]}>
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

function Title({ form }: { form: FormState }) {
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

function AddContribForm({ form }: { form: FormState }) {
  return (
    <div className="bg-surface-dimmed border-y border-surface-outline -mx-12 px-12 mt-4 py-8">
      <ContributorSearch title="Contributor" projectID={form.project.id} onSelect={form.addContrib.setPersonID} />

      <ResponsibilityInput value={form.addContrib.responsibility} onChange={form.addContrib.setResponsibility} />

      <PermissionsInput value={form.addContrib.permissions} onChange={form.addContrib.setPermissions} />

      <div className="flex mt-8 gap-2">
        <AddContribButton onClick={form.addContrib.submit} loading={form.addContrib.submitting} />
        <CancelButton onClick={form.addContrib.deactivate} />
      </div>
    </div>
  );
}

function AddButton({ onClick }) {
  return (
    <FilledButton onClick={onClick} testId="add-contributor-button" size="sm">
      Add Contributor
    </FilledButton>
  );
}

function ContributorList({ project, refetch }: { project: Projects.Project; refetch: () => void }) {
  const { champion, reviewer, contributors } = ProjectContributors.splitByRole(
    project.contributors! as ProjectContributors.ProjectContributor[],
  );

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
