import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";

import * as Projects from "@/graphql/Projects";
import * as KeyResources from "@/graphql/Projects/key_resources";
import * as Brands from "@/components/Brands";
import * as Icons from "@tabler/icons-react";

import { useLoadedData } from "./loader";
import { ProjectPageNavigation } from "@/components/ProjectPageNavigation";
import { ResourceIcon } from "@/components/KeyResourceIcon";
import { Link } from "@/components/Link";

export function Page() {
  const { project } = useLoadedData();

  return (
    <Pages.Page title={["Edit Project Resources", project.name]}>
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
  if (project.keyResources!.length === 0) {
    return <ResourcesListZeroState />;
  } else {
    return <ResourcesListWithData project={project} />;
  }
}

function ResourcesListZeroState() {
  return (
    <div className="text-content-dimmed font-medium mt-4 tracking-wide">
      There are no key resources for this project yet.
    </div>
  );
}

function ResourcesListWithData({ project }: { project: Projects.Project }) {
  return (
    <div className="grid grid-cols-4 gap-4 mt-8">
      {project.keyResources!.map((resource) => (
        <ResourceListItem key={resource!.id} resource={resource!} />
      ))}
    </div>
  );
}

function ResourceListItem({ resource }: { resource: KeyResources.KeyResource }) {
  const title = resource!.title;
  const icon = <ResourceIcon resource={resource!} />;

  return (
    <div className="rounded border border-stroke-base hover:border-surface-outline cursor-pointer flex flex-col items-center justify-center text-center">
      <div className="pt-6 pb-3">{icon}</div>
      <div className="pb-6 px-5">
        <div className="text-content-accent text-sm font-semibold leading-snug">{title}</div>
        <div className="text-content-accent text-xs text-green-600 font-medium leading-none mt-1">external link</div>
      </div>

      <div className="border-t border-stroke-base w-full text-sm py-1 bg-surface-dimmed font-semibold">
        <Link to="">Edit</Link>
        <span className="mx-1">&middot;</span>
        <Link to="">Remove</Link>
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
      <PotentialResourceListItem title="Slack Channel" icon={<Brands.Slack size={34} />} />
      <PotentialResourceListItem title="Google Document" icon={<Brands.GoogleDoc size={34} />} />
      <PotentialResourceListItem title="Google Sheet" icon={<Brands.GoogleSheets size={34} />} />
      <PotentialResourceListItem title="Github Repository" icon={<Brands.Github size={34} />} />
      <PotentialResourceListItem title="Basecamp Project" icon={<Brands.Basecamp size={34} />} />
      <PotentialResourceListItem title="Link" icon={<Icons.IconLink size={34} />} />
    </div>
  );
}

function PotentialResourceListItem({ title, icon }) {
  return (
    <div className="rounded border border-stroke-base flex flex-col items-center justify-center text-center">
      <div className="pt-6 pb-3">{icon}</div>
      <div className="pb-6 px-5">
        <div className="text-content-accent text-sm font-semibold leading-snug">{title}</div>
        <div className="text-content-accent text-xs text-green-600 font-medium leading-none mt-1">external link</div>
      </div>

      <div className="border-t border-stroke-base w-full text-sm py-1 bg-surface-dimmed font-semibold">
        <Link to="">Add</Link>
      </div>
    </div>
  );
}
