import React from "react";

import * as TipTapEditor from "@/components/Editor";
import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";
import * as People from "@/graphql/People";

import { useNavigate } from "react-router-dom";

import client from "@/graphql/client";
import * as Projects from "@/graphql/Projects";
import * as Updates from "@/graphql/Projects/updates";

import Button from "@/components/Button";
import ProjectHealthSelector from "@/components/ProjectHealthSelector";
import ProjectPhaseSelector from "@/components/ProjectPhaseSelector";
import * as PhaseChange from "@/features/phase_change";

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
  newPhase?: Projects.ProjectPhase | null;
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
    if (!newPhase) throw new Error("New phase is not defined");

    const handler = PhaseChange.handler(project, project.phase, newPhase);
    const Form = handler.form();

    return <Form />;
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

function NewUpdateHeader({ project, title, setTitle }) {
  const { messageType, newPhase, newHealth } = React.useContext(Context) as ContextDescriptor;

  switch (messageType) {
    case "phase_change":
      if (!newPhase) throw new Error("New phase is not defined");

      const handler = PhaseChange.handler(project, project.phase, newPhase);
      const Header = handler.formHeader();

      return <Header />;

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

  const peopleSearch = People.usePeopleSearch();

  const editor = TipTapEditor.useEditor({
    placeholder: placeholder,
    peopleSearch: peopleSearch,
  });

  const [post] = Projects.usePostUpdate({ onCompleted: () => navigate(`/projects/${project.id}`) });

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
    <TipTapEditor.Root>
      <TipTapEditor.Toolbar editor={editor} variant="large" />

      <div
        className="mb-8 py-4 text-white-1 text-lg relative pb-8 border-b border-shade-3"
        style={{ minHeight: "300px" }}
      >
        <TipTapEditor.EditorContent editor={editor} />
        <TipTapEditor.LinkEditForm editor={editor} />
      </div>

      {messageType === "status_update" && (
        <FieldUpdates phase={phase} health={health} setPhase={setPhase} setHealth={setHealth} />
      )}

      <div className="flex items-center gap-2">
        <PostButton onClick={submit} />
        <CancelButton linkTo={`/projects/${project.id}`} />
      </div>
    </TipTapEditor.Root>
  );
}

function FieldUpdates({ phase, health, setPhase, setHealth }) {
  return (
    <div className="mb-8">
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
    <Button onClick={onClick} variant="success" data-test-id="post-status-update">
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
