import React from "react";

import { useNavigate, useParams, Link } from "react-router-dom";
import * as Projects from "@/graphql/Projects";
import * as Me from "@/graphql/Me";

import * as Icons from "@tabler/icons-react";
import * as Paper from "@/components/PaperContainer";
import * as TipTapEditor from "@/components/Editor";

import RichContent from "@/components/RichContent";
import Avatar from "@/components/Avatar";
import Button from "@/components/Button";
import FormattedTime from "@/components/FormattedTime";

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
    case "/pitch":
      return (
        <DocView project={project} doc={project.pitch} title="Project Pitch" />
      );
    case "plan":
      return <ExecutionPlan project={project} />;
    case "execution":
      return <ExecutionReview project={project} />;
    case "control":
      return <ControlReview project={project} />;
    case "retrospective":
      return <Retrospective project={project} />;
    default:
      throw new Error(`Unknown document ${subpath}`);
  }
}

function DocView({ project, doc, title }) {
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
        <DocumentTitle
          title={title}
          time={doc.insertedAt}
          author={doc.author}
        />
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

function NewDocumentTitle({ title, subtitle }) {
  const { data } = Me.useMe();

  return (
    <div className="p-16 pb-0">
      <div className="flex items-center gap-4">
        <div className="text-center">
          <Avatar person={data.me} size="large" />
        </div>

        <div>
          <div className="text-2xl font-extrabold">{title}</div>
          <div>{subtitle}</div>
        </div>
      </div>
    </div>
  );
}

function DocumentTitle({ title, author, time }) {
  return (
    <div className="p-16 pb-0">
      <div className="flex items-center gap-4">
        <div className="text-center">
          <Avatar person={author} size="large" />
        </div>

        <div>
          <div className="text-2xl font-extrabold">{title}</div>
          <div>
            <FormattedTime time={time} format="short-date" />
          </div>
        </div>
      </div>
    </div>
  );
}

function DocumentBody({ content }) {
  return (
    <div className="text-lg p-16 py-8">
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
        content={project.pitch.content}
        linkTo={`/projects/${project.id}/documentation/pitch`}
      />
    );
  } else {
    if (Projects.shouldBeFilledIn(project, "pitch")) {
      return (
        <PendingDoc
          title="Project Pitch"
          message="Present a pitch to your team, outlining the value proposition of undertaking this project, as well as the potential risks and benefits involved."
          fillInLink={`/projects/${project.id}/documentation/pitch/new`}
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
      message="Filled in after the whole project is complete"
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

function PendingDoc({ title, message, fillInLink }) {
  return (
    <div className="border border-shade-1 p-4 rounded-lg">
      <div className="flex justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icons.IconFileDescription size={20} className="text-pink-400" />
          <div className="text-lg font-bold text-white-1">{title}</div>
        </div>
        <div className="flex items-center gap-2">
          <Icons.IconCircleDashed size={20} className="text-yellow-400" />
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
  const [post, { loading }] = Projects.usePostPitchMutation(project.id);

  const editor = TipTapEditor.useEditor({
    placeholder: "Write your pitch here...",
  });

  const handlePost = async () => {
    if (!editor) return;
    if (loading) return;

    await post(editor.getJSON());

    navigate(`/projects/${project.id}/documentation/pitch`);
  };

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
        <NewDocumentTitle
          title={"Project Pitch"}
          subtitle={
            "What is the project about, why is it important, and why should it be persued?"
          }
        />

        <div className="px-16">
          <div className="flex items-center gap-1 border-y border-shade-2 px-2 py-1 mt-8 -mx-2">
            <TipTapEditor.Toolbar editor={editor} />
          </div>

          <div
            className="mb-8 py-4 text-white-1 text-lg"
            style={{ minHeight: "300px" }}
          >
            <TipTapEditor.EditorContent editor={editor} />
          </div>

          <div className="flex items-center gap-2">
            <PostButton onClick={handlePost} />
            <CancelButton linkTo={`/projects/${project.id}/documentation`} />
          </div>
        </div>
      </Paper.Body>
    </Paper.Root>
  );
}

function PostButton({ onClick }) {
  return (
    <Button onClick={onClick} variant="success">
      <Icons.IconMail size={20} />
      Post Pitch
    </Button>
  );
}

function CancelButton({ linkTo }) {
  return (
    <Button variant="secondary" linkTo={linkTo}>
      Cancel
    </Button>
  );
}
