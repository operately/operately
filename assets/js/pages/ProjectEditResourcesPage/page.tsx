import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";

import * as Projects from "@/models/projects";
import * as KeyResources from "@/models/keyResources";

import { ProjectPageNavigation } from "@/components/ProjectPageNavigation";
import { ResourceIcon } from "@/components/KeyResourceIcon";
import { Link, ButtonLink, DivLink } from "@/components/Link";

import { createTestId } from "@/utils/testid";
import { useLoadedData } from "./loader";
import { useRemoveAction } from "./useRemoveAction";
import { Paths } from "@/routes/paths";
import { createPath } from "react-router-dom";

export function Page() {
  const { project } = useLoadedData();

  return (
    <Pages.Page title={["Edit Project Resources", project.name!]}>
      <Paper.Root>
        <ProjectPageNavigation project={project} />

        <Paper.Body>
          <div className="text-content-accent text-2xl font-extrabold">Key Resources</div>

          <ResourceList project={project} />

          <Section title="Add a new resource" />

          <PotentialResourceList />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function ResourceList({ project }: { project: Projects.Project }) {
  if (project.keyResources!.length > 0) {
    return <ResourcesListWithData project={project} />;
  } else {
    return null;
  }
}

function ResourcesListWithData({ project }: { project: Projects.Project }) {
  return (
    <div className="grid grid-cols-4 gap-4 mt-8">
      {project.keyResources!.map((resource: any) => (
        <ResourceListItem key={resource!.id} resource={resource!} />
      ))}
    </div>
  );
}

function ResourceListItem({ resource }: { resource: KeyResources.KeyResource }) {
  const { project } = useLoadedData();

  const remove = useRemoveAction(resource!);

  const title = resource!.title;
  const icon = <ResourceIcon resourceType={resource!.resourceType} size={32} />;
  const removeId = createTestId("remove-resource", title);

  const editPath = Paths.projectEditResourcePath(project.id!, resource!.id);
  const editId = createTestId("edit-resource", title);

  return (
    <div className="rounded border border-stroke-base text-center flex flex-col">
      <DivLink
        to={resource!.link}
        className="flex flex-col items-center justify-center text-center border border-transparent hover:border-surface-outline flex-1"
        target="_blank"
      >
        <div className="pt-6 pb-3">{icon}</div>
        <div className="pb-6 px-5">
          <div className="text-content-accent text-sm font-semibold leading-snug">{title}</div>
        </div>
      </DivLink>

      <div className="border-t border-stroke-base w-full text-sm py-1 bg-surface-dimmed font-semibold">
        <Link to={editPath} testId={editId}>
          Edit
        </Link>
        <span className="mx-1">&middot;</span>
        <ButtonLink onClick={remove} testId={removeId}>
          Remove
        </ButtonLink>
      </div>
    </div>
  );
}

function Section({ title }) {
  return (
    <div className="mt-8 flex items-center gap-2">
      <div className="flex-1 border-b border-surface-outline"></div>
      <h1 className="uppercase font-semibold text-content-accent py-1 px-2 text-xs">{title}</h1>
      <div className="flex-1 border-b border-surface-outline"></div>
    </div>
  );
}

function PotentialResourceList() {
  return (
    <div className="grid grid-cols-4 gap-4 mt-8">
      {KeyResources.SupportedTypes.map((t) => (
        <PotentialResourceListItem key={t} resourceType={t} />
      ))}
    </div>
  );
}

function PotentialResourceListItem({ resourceType }: { resourceType: string }) {
  const { project } = useLoadedData();

  const title = KeyResources.humanTitle(resourceType);
  const icon = <ResourceIcon resourceType={resourceType} size={32} />;

  const id = createTestId("add-resource", title);
  const path = Paths.projectNewResourcePath(project.id!, { resourceType });

  return (
    <div className="rounded border border-stroke-base flex flex-col items-center justify-center text-center">
      <div className="pt-8 pb-3">{icon}</div>
      <div className="pb-7 px-5">
        <div className="text-content-accent text-sm font-semibold leading-snug">{title}</div>
      </div>

      <div className="border-t border-stroke-base w-full text-sm py-1 bg-surface-dimmed font-semibold">
        <Link to={path} testId={id}>
          Add
        </Link>
      </div>
    </div>
  );
}
