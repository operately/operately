import React from "react";

import * as TipTapEditor from "@/components/Editor";
import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";

import { useNavigate } from "react-router-dom";

import client from "@/graphql/client";
import * as Projects from "@/graphql/Projects";

import Button from "@/components/Button";

export async function loader({ params }) {
  let res = await client.query({
    query: Projects.GET_PROJECT,
    variables: { id: params["project_id"] },
    fetchPolicy: "network-only",
  });

  return res.data.project;
}

interface ContextDescriptor {
  project: Projects.Project;
  messageType: "update" | "phase-change" | "health-change";
  currentPhase?: string;
  newPhase?: string | null;
  newHealth?: string | null;
}

const Context = React.createContext<ContextDescriptor | null>(null);

export function Page() {
  const [project] = Paper.useLoadedData() as [Projects.Project];

  const searchParams = new URLSearchParams(window.location.search);
  const newPhase = searchParams.get("phase");
  const newHealth = searchParams.get("health");
  const currentPhase = project.phase;

  let messageType: ContextDescriptor["messageType"];
  if (newPhase) {
    messageType = "phase-change";
  } else if (newHealth) {
    messageType = "health-change";
  } else {
    messageType = "update";
  }

  return (
    <Paper.Root>
      <Paper.Navigation>
        <Paper.NavItem linkTo={`/projects/${project.id}`}>
          <Icons.IconClipboardList size={16} />
          {project.name}
        </Paper.NavItem>

        <Icons.IconSlash size={16} />

        <Paper.NavItem linkTo={`/projects/${project.id}/updates`}>Message Board</Paper.NavItem>
      </Paper.Navigation>

      <Paper.Body>
        <Context.Provider value={{ project, messageType, currentPhase, newPhase, newHealth }}>
          <NewUpdateHeader project={project} />
          <Editor project={project} />
        </Context.Provider>
      </Paper.Body>
    </Paper.Root>
  );
}

function HealthTitle({ health }) {
  switch (health) {
    case "on_track":
      return <>On-Track</>;
    case "at_risk":
      return <>At Risk</>;
    case "off_track":
      return <>Off-Track</>;
    case "unknown":
      return <>Unknown</>;
    default:
      throw new Error(`Unknown health: ${health}`);
  }
}

function NewUpdateHeader({ project }) {
  const { messageType, newPhase, newHealth } = React.useContext(Context) as ContextDescriptor;

  switch (messageType) {
    case "phase-change":
      return (
        <div>
          <div className="uppercase text-white-1 tracking-wide w-full mb-2">PHASE CHANGE</div>
          <div className="text-4xl font-bold mx-auto">
            <span className="capitalize">{project.phase}</span> -&gt;<span className="capitalize">{newPhase}</span>
          </div>
        </div>
      );
    case "health-change":
      return (
        <div>
          <div className="uppercase text-white-1 tracking-wide w-full mb-2">PROJECT HEALTH CHANGE</div>
          <div className="text-4xl font-bold mx-auto">
            <HealthTitle health={project.health} /> -&gt; <HealthTitle health={newHealth} />
          </div>
        </div>
      );
    case "update":
      return (
        <div>
          <div className="uppercase text-white-1 tracking-wide w-full mb-2">STATUS UPDATE</div>
          <div className="text-4xl font-bold mx-auto">What's new since the last update?</div>
        </div>
      );
    default:
      throw new Error(`Unknown message type: ${messageType}`);
  }
}

function Editor({ project }) {
  const navigate = useNavigate();
  const { messageType, newPhase, newHealth } = React.useContext(Context) as ContextDescriptor;

  let placeholder = "";

  switch (messageType) {
    case "phase-change":
      placeholder = `Write a summary of the previous phase and what's coming up in the next phase...`;
      break;
    case "health-change":
      placeholder = `Describe the changes that happened to the project's health...`;
      break;
    case "update":
      placeholder = `Write your update here...`;
      break;
    default:
      throw new Error(`Unknown message type: ${messageType}`);
  }

  const editor = TipTapEditor.useEditor({ placeholder: placeholder });

  const [post] = Projects.usePostUpdate({
    onCompleted: (data) => {
      navigate(`/projects/${project.id}/updates/${data.createUpdate.id}`);
    },
  });

  const submit = () => {
    if (!editor) return;

    post({
      variables: {
        input: {
          updatableType: "project",
          updatableId: project.id,
          content: JSON.stringify(editor.getJSON()),
          phase: newPhase || undefined,
          health: newHealth || undefined,
        },
      },
    });
  };

  return (
    <div>
      <div className="flex items-center gap-1 border-y border-shade-2 px-2 py-1 mt-8 -mx-2">
        <TipTapEditor.Toolbar editor={editor} />
      </div>

      <div className="mb-8 py-4 text-white-1 text-lg" style={{ minHeight: "300px" }}>
        <TipTapEditor.EditorContent editor={editor} />
      </div>

      <div className="flex items-center gap-2">
        <PostButton onClick={submit} />
        <CancelButton linkTo={`/projects/${project.id}/updates`} />
      </div>
    </div>
  );
}

function PostButton({ onClick }) {
  return (
    <Button onClick={onClick} variant="success">
      <Icons.IconMail size={20} />
      Post Update
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
