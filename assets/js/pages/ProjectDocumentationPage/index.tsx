import React from "react";

import { useNavigate, useParams, Link } from "react-router-dom";
import * as Projects from "@/graphql/Projects";

import * as Icons from "@tabler/icons-react";
import * as Paper from "@/components/PaperContainer";

import Button from "@/components/Button";

import { NewDocument, DocView } from "./NewDocument";
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
      return <NewPitch project={project} />;

    case "/plan/new":
      return <NewExecutionPlan project={project} />;

    case "/execution_review/new":
      return <NewExecutionReview project={project} />;

    case "/control_review/new":
      return <NewControlReview project={project} />;

    case "/retrospective/new":
      return <NewRetrospective project={project} />;

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

function DocSummary({ project, documentType, title, content, viewLink, fillInLink, futureMessage, pendingMessage }) {
  if (content) {
    return <ExistingDocSummary title={title} content={content} linkTo={viewLink} />;
  }

  if (Projects.shouldBeFilledIn(project, documentType)) {
    return <PendingDoc title={title} message={pendingMessage} fillInLink={fillInLink} />;
  }

  return <EmptyDoc title={title} message={futureMessage} />;
}

function ExecutionReviewSummary({ project }) {
  return (
    <EmptyDoc project={project} title="Execution Review" message="Filled in after the execution phase is complete" />
  );
}

function ControlReviewSummary({ project }) {
  return <EmptyDoc project={project} title="Control Review" message="Filled in after the control phase is complete" />;
}

function RetrospectiveSummary({ project }) {
  return <EmptyDoc project={project} title="Retrospective" message="Filled in after the whole project is complete" />;
}

function ExistingDocSummary({ title, content, linkTo }) {
  return (
    <Link to={linkTo}>
      <div className="border border-shade-1 p-4 rounded-lg hover:border-shade-3 bg-dark-4">
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

function PendingDoc({ title, message, fillInLink }) {
  return (
    <div className="border border-shade-1 p-4 rounded-lg">
      <div className="flex justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icons.IconFileDots size={20} className="text-yellow-400" />
          <div className="text-lg font-bold text-white-1">{title}</div>
        </div>
        <div className="flex items-center gap-2">
          <Icons.IconProgressCheck size={20} className="text-yellow-400" />
        </div>
      </div>

      <div className="line-clamp-4 text-white-1 max-w-xl mb-4">{message}</div>
      <Button variant="success" linkTo={fillInLink}>
        <Icons.IconPencil size={16} />
        Fill In
      </Button>
    </div>
  );
}

function NewPitch({ project }) {
  const navigate = useNavigate();
  const [post, { loading }] = Projects.usePostDocument(project.id, "pitch");

  const onSubmit = (content) => {
    post(content).then(() => {
      navigate(`/projects/${project.id}/documentation/pitch`);
    });
  };

  return <NewDocument project={project} schema={schemas.ProjectPitchSchema} onSubmit={onSubmit} />;
}

function NewExecutionPlan({ project }) {
  const navigate = useNavigate();
  const [post, { loading }] = Projects.usePostDocument(project.id, "plan");

  const onSubmit = (content) => {
    post(content).then(() => {
      navigate(`/projects/${project.id}/documentation/plan`);
    });
  };

  return <NewDocument project={project} schema={schemas.ExecutionPlanSchema} onSubmit={onSubmit} />;
}

function NewExecutionReview({ project }) {
  const navigate = useNavigate();
  const [post, { loading }] = Projects.usePostDocument(project.id, "execution_review");

  const onSubmit = (content) => {
    post(content).then(() => {
      navigate(`/projects/${project.id}/documentation/execution_review`);
    });
  };

  return <NewDocument project={project} schema={schemas.ExecutionReviewSchema} onSubmit={onSubmit} />;
}

function NewControlReview({ project }) {
  const navigate = useNavigate();
  const [post, { loading }] = Projects.usePostDocument(project.id, "control_review");

  const onSubmit = (content) => {
    post(content).then(() => {
      navigate(`/projects/${project.id}/documentation/control_review`);
    });
  };

  return <NewDocument project={project} schema={schemas.ControlReviewSchema} onSubmit={onSubmit} />;
}

function NewRetrospective({ project }) {
  const navigate = useNavigate();
  const [post, { loading }] = Projects.usePostDocument(project.id, "retrospective");

  const onSubmit = (content) => {
    post(content).then(() => {
      navigate(`/projects/${project.id}/documentation/retrospective`);
    });
  };

  return <NewDocument project={project} schema={schemas.RetrospectiveSchema} onSubmit={onSubmit} />;
}
