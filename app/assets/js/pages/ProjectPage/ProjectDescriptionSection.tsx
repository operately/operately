import * as React from "react";
import * as Projects from "@/models/projects";

import { Link } from "@/components/Link";
import { Paths } from "@/routes/paths";
import { SecondaryButton } from "@/components/Buttons";

import RichContent, { countCharacters, shortenContent } from "@/components/RichContent";

export function ProjectDescriptionSection({ project }: { project: Projects.Project }) {
  return (
    <div className="border-t border-stroke-base py-6 mt-4">
      <div className="flex items-start gap-4">
        <div className="w-1/5">
          <div className="font-bold text-sm">Overview</div>
          <EditLink project={project} />
        </div>

        <div className="w-4/5">
          {project.description ? <DescriptionContent project={project} /> : <DescriptionZeroState project={project} />}
        </div>
      </div>
    </div>
  );
}

function EditLink({ project }: { project: Projects.Project }) {
  if (!project.permissions!.canEditDescription) return null;
  if (!project.description) return null;

  const path = Paths.projectEditDescriptionPath(project.id!);

  return (
    <div className="text-sm">
      <Link to={path} testId="edit-project-description-link">
        Edit
      </Link>
    </div>
  );
}

const DESCRIPTION_CHAR_LIMIT = 250;

function DescriptionContent({ project }) {
  const [showMore, setShowMore] = React.useState(false);

  const length = React.useMemo(() => {
    return project.description ? countCharacters(project.description) : 0;
  }, [project?.description]);

  const description = React.useMemo(() => {
    if (length <= DESCRIPTION_CHAR_LIMIT) {
      return project.description;
    } else if (showMore) {
      return project.description;
    } else {
      return shortenContent(project.description, DESCRIPTION_CHAR_LIMIT, { suffix: "..." });
    }
  }, [length, showMore, project?.description]);

  return (
    <div>
      <RichContent jsonContent={description} />
      {length > DESCRIPTION_CHAR_LIMIT && <ExpandCollapseButton showMore={showMore} setShowMore={setShowMore} />}
    </div>
  );
}

function ExpandCollapseButton({ showMore, setShowMore }) {
  return (
    <span
      onClick={() => setShowMore(!showMore)}
      className="text-sm text-link-base underline underline-offset-2 cursor-pointer"
      data-test-id="expand-project-description"
    >
      {showMore ? "Collapse" : "Expand"}
    </span>
  );
}

function DescriptionZeroState({ project }) {
  const writePath = Paths.projectEditDescriptionPath(project.id!);

  const editLink = (
    <SecondaryButton linkTo={writePath} testId="write-project-description-link" size="xs">
      Write project description
    </SecondaryButton>
  );

  return (
    <div className="text-sm">
      Describe your project to provide context and clarity.
      {project.permissions.canEditDescription && <div className="mt-2 flex">{editLink}</div>}
    </div>
  );
}
