import * as React from "react";
import * as Projects from "@/models/projects";

import { ResourceIcon } from "@/components/KeyResourceIcon";
import { GhostButton } from "@/components/Buttons";
import { Link } from "@/components/Link";
import { Paths } from "@/routes/paths";

export function ResourcesSection({ project }: { project: Projects.Project }) {
  return (
    <div className="border-t border-stroke-base py-6">
      <div className="flex items-start gap-4">
        <div className="w-1/5">
          <div className="font-bold text-sm">Resources</div>
          <EditLink project={project} />
        </div>

        <div className="w-4/5">
          <Content project={project} />
        </div>
      </div>
    </div>
  );
}

function EditLink({ project }: { project: Projects.Project }) {
  if (!project.permissions!.canEditResources) return false;
  if (!project.keyResources || project.keyResources.length === 0) return false;

  return (
    <div className="text-sm">
      <Link to={Paths.projectEditResourcesPath(project.id!)} testId="edit-resources-link">
        Edit
      </Link>
    </div>
  );
}

function Content({ project }) {
  if (project.keyResources.length === 0) {
    return <ResourcesZeroState project={project} />;
  } else {
    return <ResourcesList project={project} />;
  }
}

function ResourcesZeroState({ project }) {
  const editPath = Paths.projectEditResourcesPath(project.id!);

  const editLink = (
    <GhostButton linkTo={editPath} testId="add-resources-link" size="xs" type="secondary">
      Add Resources
    </GhostButton>
  );

  return (
    <div className="text-sm">
      Pin links to external resources.
      {project.permissions.canEditResources && <div className="mt-2 flex">{editLink}</div>}
    </div>
  );
}

function ResourcesList({ project }: { project: Projects.Project }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {project.keyResources!.map((resource: any, index: number) => (
        <Resource
          key={index}
          icon={<ResourceIcon resourceType={resource!.resourceType} size={32} />}
          title={resource!.title}
          href={resource!.link}
        />
      ))}
    </div>
  );
}

function Resource({ icon, title, href }) {
  return (
    <a
      href={href}
      target="_blank"
      className="rounded border border-stroke-base hover:border-surface-outline cursor-pointer flex flex-col items-center justify-center text-center"
    >
      <div className="pt-6 pb-3">{icon}</div>
      <div className="pb-6 px-5">
        <div className="text-content-accent text-sm font-semibold leading-snug">{title}</div>
      </div>
    </a>
  );
}
