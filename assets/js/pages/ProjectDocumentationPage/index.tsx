import React from "react";

import { useParams, Link } from "react-router-dom";
import { useProject } from "@/graphql/Projects";

import * as Icons from "@tabler/icons-react";
import * as Paper from "@/components/PaperContainer";

import RichContent from "@/components/RichContent";

export function ProjectDocumentationPage() {
  const params = useParams();
  const projectId = params["project_id"];

  if (!projectId) return <p className="mt-16">Unable to find project</p>;

  const { loading, error, data, refetch } = useProject(projectId);

  if (loading) return <p className="mt-16">Loading...</p>;
  if (error) return <p className="mt-16">Error : {error.message}</p>;
  if (!data) return <p className="mt-16">Can't find project</p>;

  const project = data.project;

  return (
    <Paper.Root>
      <Paper.Navigation>
        <Paper.NavItem linkTo={`/projects/${projectId}`}>
          <Icons.IconClipboardList size={16} />
          {project.name}
        </Paper.NavItem>
      </Paper.Navigation>

      <Paper.Body>
        <Title />

        <DocList project={project} />
      </Paper.Body>
    </Paper.Root>
  );
}

function Title() {
  return (
    <div className="p-8 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-extrabold ">Documentation</div>
          <div className="text-medium">
            Pitch the project, document the process, and share the results.
          </div>
        </div>
      </div>
    </div>
  );
}

function DocList({ project }) {
  return (
    <div className="flex flex-col gap-4 px-8 pb-8">
      <Pitch project={project} />
      <ExecutionPlan project={project} />
      <ExecutionReview project={project} />
      <ControlReview project={project} />
      <Retrospective project={project} />
    </div>
  );
}

function Pitch({ project }) {
  return <Doc project={project} title="Project Pitch" />;
}

function ExecutionPlan({ project }) {
  return <Doc project={project} title="Execution Plan" />;
}

function ExecutionReview({ project }) {
  return (
    <EmptyDoc
      project={project}
      title="Execution Review"
      message="Filled in after the execution phase is complete"
    />
  );
}

function ControlReview({ project }) {
  return (
    <EmptyDoc
      project={project}
      title="Control Review"
      message="Filled in after the control phase is complete"
    />
  );
}

function Retrospective({ project }) {
  return (
    <EmptyDoc
      project={project}
      title="Retrospective"
      message="Filled in after the project whole project is complete"
    />
  );
}

function Doc({ project, title }) {
  return (
    <Link to={`/projects/${project.id}/documentation/pitch`}>
      <div className="border border-shade-1 p-4 rounded-lg hover:border-shade-3">
        <div className="flex justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icons.IconFileDescription size={20} className="text-pink-400" />
            <div className="text-lg font-bold">{title}</div>
          </div>
          <div className="flex items-center gap-2">
            <Icons.IconCircleCheckFilled size={20} className="text-green-400" />{" "}
          </div>
        </div>

        <div className="line-clamp-4">
          <RichContent jsonContent={project.description} />
        </div>
      </div>
    </Link>
  );
}

function EmptyDoc({ project, title, message }) {
  return (
    <Link to={`/projects/${project.id}/documentation/pitch`}>
      <div className="border border-shade-1 p-4 rounded-lg hover:border-shade-3">
        <div className="flex justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icons.IconFileDescription size={20} className="text-shade-3" />
            <div className="text-lg font-bold text-white-2">{title}</div>
          </div>
          <div className="flex items-center gap-2">
            <Icons.IconCircleCheckFilled size={20} className="text-shade-3" />{" "}
          </div>
        </div>

        <div className="line-clamp-4 text-white-2">{message}</div>
      </div>
    </Link>
  );
}
