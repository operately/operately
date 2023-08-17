import React from "react";

import * as TipTapEditor from "@/components/Editor";
import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";

import { useNavigate } from "react-router-dom";

import client from "@/graphql/client";
import * as Projects from "@/graphql/Projects";
import * as Updates from "@/graphql/Projects/updates";

import Button from "@/components/Button";
import ProjectHealthSelector from "@/components/ProjectHealthSelector";
import ProjectPhaseSelector from "@/components/ProjectPhaseSelector";

import Review from "./Review";

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
  messageType: Updates.UpdateMessageType;
  currentPhase?: string;
  newPhase?: string | null;
  newHealth?: string | null;
  title: string;
  setTitle: (title: string) => void;
}

const Context = React.createContext<ContextDescriptor | null>(null);

export function Page() {
  const [project] = Paper.useLoadedData() as [Projects.Project];
  const [title, setTitle] = React.useState<string>("");

  const searchParams = new URLSearchParams(window.location.search);
  const newPhase = searchParams.get("phase");
  const newHealth = searchParams.get("health");
  const messageType = (searchParams.get("messageType") || "message") as ContextDescriptor["messageType"];
  const currentPhase = project.phase;

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
        <Context.Provider value={{ project, messageType, currentPhase, newPhase, newHealth, title, setTitle }}>
          <NewUpdateHeader project={project} title={title} setTitle={setTitle} />
          <Content />
        </Context.Provider>
      </Paper.Body>
    </Paper.Root>
  );
}

function Content() {
  const { title, project, messageType, newPhase } = React.useContext(Context) as ContextDescriptor;

  if (messageType === "phase_change") {
    return <Review project={project} newPhase={newPhase} />;
  } else {
    return <Editor project={project} title={title} />;
  }
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

function ReviewHeader({ prevPhase, newPhase }) {
  return (
    <div>
      <div className="uppercase text-white-1 tracking-wide w-full mb-2">CHECK-IN: PHASE CHANGE</div>
      <div className="text-4xl font-bold mx-auto">
        <span className="capitalize">{prevPhase}</span> -&gt; <span className="capitalize">{newPhase}</span>
      </div>
    </div>
  );
}

function CompletedHeader() {
  return (
    <div>
      <div className="uppercase text-white-1 tracking-wide w-full mb-2">CHECK-IN: COMPLETING THE PROJECT</div>
      <div className="text-4xl font-bold mx-auto">Project Retrospective</div>
    </div>
  );
}

function CanceledHeader() {
  return (
    <div>
      <div className="uppercase text-white-1 tracking-wide w-full mb-2">CHECK-IN: CANCELING THE PROJECT</div>
      <div className="text-4xl font-bold mx-auto">Project Retrospective</div>
    </div>
  );
}

function PausedHeader() {
  return (
    <div>
      <div className="uppercase text-white-1 tracking-wide w-full mb-2">CHECK-IN: PAUSING THE PROJECT</div>
      <div className="text-4xl font-bold mx-auto">Project Pause</div>
    </div>
  );
}

function GoingBackToPreviousPhaseHeader() {
  return (
    <div>
      <div className="uppercase text-white-1 tracking-wide w-full mb-2">CHECK-IN: REVERTING PROJECT PHASE</div>
      <div className="text-4xl font-bold mx-auto">Going back to previous phase</div>
    </div>
  );
}

function NewUpdateHeader({ project, title, setTitle }) {
  const { messageType, newPhase, newHealth } = React.useContext(Context) as ContextDescriptor;

  const terminalPhases = ["completed", "canceled"];
  const nonTerminalPhases = ["planning", "execution", "control"] as Projects.ProjectPhase[];

  switch (messageType) {
    case "phase_change":
      if (!newPhase) throw new Error("New phase is not defined");

      if (newPhase === "paused") {
        if (terminalPhases.includes(project.phase)) {
          throw new Error(`Cannot change phase from ${project.phase} to ${newPhase}`);
        }

        if (nonTerminalPhases.includes(project.phase)) {
          return <PausedHeader />;
        }

        throw new Error(`Unknown phase change: ${project.phase} -> ${newPhase}`);
      }

      if (nonTerminalPhases.includes(project.phase) && terminalPhases.includes(newPhase)) {
        if (newPhase === "completed") {
          return <CompletedHeader />;
        }

        if (newPhase === "canceled") {
          return <CanceledHeader />;
        }

        throw new Error(`Unknown phase change: ${project.phase} -> ${newPhase}`);
      }

      if (nonTerminalPhases.includes(project.phase) && nonTerminalPhases.includes(newPhase)) {
        let oldIndex = nonTerminalPhases.indexOf(project.phase);
        let newIndex = nonTerminalPhases.indexOf(newPhase);

        if (oldIndex > newIndex) {
          return <GoingBackToPreviousPhaseHeader />;
        }

        if (oldIndex < newIndex) {
          return <ReviewHeader prevPhase={project.phase} newPhase={newPhase} />;
        }

        throw new Error(`Unknown phase change: ${project.phase} -> ${newPhase}`);
      }

      throw new Error(`Unknown phase change: ${project.phase} -> ${newPhase}`);
    case "health_change":
      return (
        <div>
          <div className="uppercase text-white-1 tracking-wide w-full mb-2">PROJECT HEALTH CHANGE</div>
          <div className="text-4xl font-bold mx-auto">
            <HealthTitle health={project.health} /> -&gt; <HealthTitle health={newHealth} />
          </div>
        </div>
      );
    case "status_update":
      return (
        <div>
          <div className="uppercase text-white-1 tracking-wide w-full mb-2">STATUS UPDATE</div>
          <div className="text-4xl font-bold mx-auto">What's new since the last update?</div>
        </div>
      );
    case "message":
      return (
        <div>
          <input
            type="text"
            className="w-full text-4xl font-bold mx-auto bg-transparent text-white-1 placeholder:text-white-2 p-0 border-transparent focus:border-transparent focus:ring-transparent"
            placeholder="Write a title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
      );
    default:
      throw new Error(`Unknown message type: ${messageType}`);
  }
}

function Editor({ project, title }) {
  const navigate = useNavigate();
  const { messageType, newPhase, newHealth } = React.useContext(Context) as ContextDescriptor;

  let placeholder = "";

  switch (messageType) {
    case "phase_change":
      placeholder = `Write a summary of the previous phase and what's coming up in the next phase...`;
      break;
    case "health_change":
      placeholder = `Describe the changes that happened to the project's health...`;
      break;
    case "status_update":
      placeholder = `Write your update here...`;
      break;
    case "message":
      placeholder = `Write your message here...`;
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

  const [health, setHealth] = React.useState<string>(newHealth || project.health);
  const [phase, setPhase] = React.useState<string>(newPhase || project.phase);

  const submit = () => {
    if (!editor) return;

    post({
      variables: {
        input: {
          updatableType: "project",
          updatableId: project.id,
          content: JSON.stringify(editor.getJSON()),
          phase: phase,
          health: health,
          title: title || undefined,
          messageType: messageType,
        },
      },
    });
  };

  return (
    <div>
      <div className="flex items-center gap-1 border-y border-shade-2 px-2 py-1 mt-4 -mx-2">
        <TipTapEditor.Toolbar editor={editor} />
      </div>

      <div className="mb-8 py-4 text-white-1 text-lg" style={{ minHeight: "300px" }}>
        <TipTapEditor.EditorContent editor={editor} />
      </div>

      {messageType === "status_update" && (
        <FieldUpdates phase={phase} health={health} setPhase={setPhase} setHealth={setHealth} />
      )}

      <div className="flex items-center gap-2">
        <PostButton onClick={submit} />
        <CancelButton linkTo={`/projects/${project.id}/updates`} />
      </div>
    </div>
  );
}

function FieldUpdates({ phase, health, setPhase, setHealth }) {
  return (
    <div className="mb-8 pt-8 border-t border-shade-2">
      <p className="font-bold text-lg">Is there a change in the project's health or phase?</p>
      <p className="text-white-1/70">Please adjust the values below.</p>

      <div className="py-4 flex items-start gap-4">
        <div>
          <p className="font-bold ml-1">Phase</p>
          <div className="flex items-center gap-2">
            <ProjectPhaseSelector activePhase={phase} editable={true} onSelected={setPhase} />
          </div>
        </div>

        <div>
          <p className="font-bold ml-1">Health</p>
          <div className="flex items-center gap-2">
            <ProjectHealthSelector active={health} editable={true} onSelected={setHealth} />
          </div>
        </div>
      </div>
    </div>
  );
}

function PostButton({ onClick }) {
  return (
    <Button onClick={onClick} variant="success">
      <Icons.IconMail size={20} />
      Post
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
