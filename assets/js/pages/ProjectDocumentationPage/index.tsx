import React from "react";

import { useParams, Link } from "react-router-dom";
import { useProject } from "@/graphql/Projects";

import * as Icons from "@tabler/icons-react";
import * as Paper from "@/components/PaperContainer";

import RichContent from "@/components/RichContent";
import Avatar from "@/components/Avatar";

export function ProjectDocumentationPage() {
  const params = useParams();
  const projectId = params["project_id"];
  const star = params["*"] || "";

  if (!projectId) return <p className="mt-16">Unable to find project</p>;

  const { loading, error, data, refetch } = useProject(projectId);

  if (loading) return <p className="mt-16">Loading...</p>;
  if (error) return <p className="mt-16">Error : {error.message}</p>;
  if (!data) return <p className="mt-16">Can't find project</p>;

  const project = data.project;

  switch (star) {
    case "":
      return <DocList project={project} />;
    case "pitch":
      return <Pitch project={project} />;
    case "plan":
      return <ExecutionPlan project={project} />;
    case "execution":
      return <ExecutionReview project={project} />;
    case "control":
      return <ControlReview project={project} />;
    case "retrospective":
      return <Retrospective project={project} />;
    default:
      throw new Error(`Unknown document ${star}`);
  }
}

function DocView({ project, doc }) {
  return (
    <Paper.Root>
      <Paper.Navigation>
        <Paper.NavItem linkTo={`/projects/${project.id}`}>
          <Icons.IconClipboardList size={16} />
          {project.name}
        </Paper.NavItem>

        <Icons.IconSlash size={16} />

        <Paper.NavItem linkTo={`/projects/${project.id}/documentation`}>
          Documentation
        </Paper.NavItem>
      </Paper.Navigation>
      <Paper.Body>
        <DocumentTitle title={doc.title} />
        <DocumentBody content={doc.content} />
      </Paper.Body>
    </Paper.Root>
  );
}

function ListTitle() {
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

function DocumentTitle({ title }) {
  return (
    <div className="p-16 pb-8">
      <div className="flex items-center gap-4">
        <div className="text-center">
          <Avatar person={{ fullName: "John Doe" }} size="large" />
        </div>

        <div>
          <div className="text-2xl font-extrabold">{title}</div>
          <div>Jan 17th</div>
        </div>
      </div>
    </div>
  );
}

function DocumentBody({ content }) {
  return (
    <div className="text-lg px-16">
      <RichContent jsonContent={content} />
    </div>
  );
}

function DocList({ project }) {
  return (
    <Paper.Root>
      <Paper.Navigation>
        <Paper.NavItem linkTo={`/projects/${project.id}`}>
          <Icons.IconClipboardList size={16} />
          {project.name}
        </Paper.NavItem>
      </Paper.Navigation>
      <Paper.Body>
        <ListTitle />

        <div className="flex flex-col gap-4 px-8 pb-8">
          <PitchSummary project={project} />
          <ExecutionPlanSummary project={project} />
          <ExecutionReviewSummary project={project} />
          <ControlReviewSummary project={project} />
          <RetrospectiveSummary project={project} />
        </div>
      </Paper.Body>
    </Paper.Root>
  );
}

function PitchSummary({ project }) {
  if (project.pitch) {
    return (
      <DocSummary
        title="Project Pitch"
        content={project.pitch}
        linkTo={`/projects/${project.id}/documentation/pitch`}
      />
    );
  } else {
    return (
      <EmptyDoc
        title="Project Pitch"
        message="Filled in as part of the concept phase"
      />
    );
  }
}

function ExecutionPlanSummary({ project }) {
  if (project.plan) {
    return (
      <DocSummary
        title="Execution Plan"
        content={project.plan}
        linkTo={`/projects/${project.id}/documentation/plan`}
      />
    );
  } else {
    return (
      <EmptyDoc
        title="Execution Plan"
        message="Filled in as part of the planning phase"
      />
    );
  }
}

function ExecutionReviewSummary({ project }) {
  return (
    <EmptyDoc
      project={project}
      title="Execution Review"
      message="Filled in after the execution phase is complete"
    />
  );
}

function ControlReviewSummary({ project }) {
  return (
    <EmptyDoc
      project={project}
      title="Control Review"
      message="Filled in after the control phase is complete"
    />
  );
}

function RetrospectiveSummary({ project }) {
  return (
    <EmptyDoc
      project={project}
      title="Retrospective"
      message="Filled in after the project whole project is complete"
    />
  );
}

function DocSummary({ title, content, linkTo }) {
  return (
    <Link to={linkTo}>
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
          <RichContent jsonContent={content} />
        </div>
      </div>
    </Link>
  );
}

function EmptyDoc({ title, message }) {
  return (
    <div className="border border-shade-1 p-4 rounded-lg">
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
  );
}
