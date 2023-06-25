import React from "react";

import { useNavigate, useParams, Link } from "react-router-dom";
import * as Projects from "@/graphql/Projects";

import * as Icons from "@tabler/icons-react";
import * as Paper from "@/components/PaperContainer";

import { NewDocument, DocView, DocSummary } from "./NewDocument";
import * as schemas from "./schemas";

export function ProjectDocumentationPage() {
  const params = useParams();
  const projectId = params["project_id"];
  const subpath = "/" + params["*"] || "";

  if (!projectId) return <p className="mt-16">Unable to find project</p>;

  const { loading, error, data, refetch } = Projects.useProject(projectId);

  if (loading) return <p className="mt-16">Loading...</p>;
  if (error) return <p className="mt-16">Error : {error.message}</p>;
  if (!data) return <p className="mt-16">Can't find project</p>;

  const project = data.project;

  switch (subpath) {
    case "/":
      return <DocList project={project} />;

    case "/pitch/new":
      return <NewDocument project={project} schema={schemas.ProjectPitchSchema} onSubmit={refetch} />;

    case "/plan/new":
      return <NewDocument project={project} schema={schemas.ExecutionPlanSchema} onSubmit={refetch} />;

    case "/execution_review/new":
      return <NewDocument project={project} schema={schemas.ExecutionReviewSchema} onSubmit={refetch} />;

    case "/control_review/new":
      return <NewDocument project={project} schema={schemas.ControlReviewSchema} onSubmit={refetch} />;

    case "/retrospective/new":
      return <NewDocument project={project} schema={schemas.RetrospectiveSchema} onSubmit={refetch} />;

    case "/pitch":
      return <DocView project={project} doc={project.pitch} schema={schemas.ProjectPitchSchema} />;

    case "/plan":
      return <DocView project={project} doc={project.plan} schema={schemas.ExecutionPlanSchema} />;

    case "/execution_review":
      return <DocView project={project} doc={project.execution_review} schema={schemas.ExecutionReviewSchema} />;

    case "/control_review":
      return <DocView project={project} doc={project.control_review} schema={schemas.ExecutionReviewSchema} />;

    case "/retrospective":
      return <DocView project={project} doc={project.retrospective} schema={schemas.RetrospectiveSchema} />;

    default:
      throw new Error(`Unknown document ${subpath}`);
  }
}

function ListTitle() {
  return (
    <div className="p-8 pb-8">
      <div className="text-2xl font-extrabold flex justify-center items-center">Documentation</div>
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

        <div className="flex flex-col gap-4 px-8 pb-8 fadeIn">
          <PitchSummary project={project} />
          {Projects.shouldBeFilledIn(project, "plan") && (
            <div className="mt-12 uppercase tracking-wide font-medium">Upcomming</div>
          )}
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
  return (
    <DocSummary
      project={project}
      doc={project.pitch}
      schema={schemas.ProjectPitchSchema}
      documentType={"pitch"}
      title={"Project Pitch"}
      content={project.pitch?.content}
      viewLink={`/projects/${project.id}/documentation/pitch`}
      fillInLink={`/projects/${project.id}/documentation/pitch/new`}
      futureMessage={`Filled in as part of the concept phase.`}
      pendingMessage={`Present a pitch to your team, outlining the value proposition of undertaking this project, as well as the potential risks and benefits involved.`}
    />
  );
}

function ExecutionPlanSummary({ project }) {
  return (
    <DocSummary
      project={project}
      doc={project.plan}
      schema={schemas.ExecutionPlanSchema}
      documentType={"plan"}
      title={"Execution Plan"}
      content={project.plan?.content}
      viewLink={`/projects/${project.id}/documentation/plan`}
      fillInLink={`/projects/${project.id}/documentation/plan/new`}
      futureMessage={`Filled in as part of the planning phase.`}
      pendingMessage={`Present a plan to your team, outlining the scope of the project, the resources required, and the timeline for completion.`}
    />
  );
}

function ExecutionReviewSummary({ project }) {
  return (
    <DocSummary
      project={project}
      doc={project.execution_review}
      schema={schemas.ExecutionReviewSchema}
      documentType={"execution_review"}
      title={"Execution Review"}
      content={project.execution_review?.content}
      viewLink={`/projects/${project.id}/documentation/execution_review`}
      fillInLink={`/projects/${project.id}/documentation/execution_review/new`}
      futureMessage={`Filled in after the execution phase.`}
      pendingMessage={`Provide a summary of the project's execution, including the resources used, the timeline followed, and the results achieved.`}
    />
  );
}

function ControlReviewSummary({ project }) {
  return (
    <DocSummary
      project={project}
      doc={project.control_review}
      schema={schemas.ControlReviewSchema}
      documentType={"control_review"}
      title={"Control Review"}
      content={project.control_review?.content}
      viewLink={`/projects/${project.id}/documentation/control_review`}
      fillInLink={`/projects/${project.id}/documentation/control_review/new`}
      futureMessage={`Filled in after the control phase.`}
      pendingMessage={`Provide a summary of the outcomes of the project, including the results achieved, the lessons learned, and the next steps.`}
    />
  );
}

function RetrospectiveSummary({ project }) {
  return (
    <DocSummary
      project={project}
      doc={project.retrospective}
      schema={schemas.ExecutionReviewSchema}
      documentType={"retrospective"}
      title={"Retrospective Review"}
      content={project.control_review?.content}
      viewLink={`/projects/${project.id}/documentation/retrospective`}
      fillInLink={`/projects/${project.id}/documentation/retrospective/new`}
      futureMessage={`Filled in after the whole project is completed.`}
      pendingMessage={`What went well? What could have gone better? What would you do differently next time?`}
    />
  );
}
