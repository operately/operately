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
  messageType: "update" | "phase-change";
  currentPhase?: string;
  newPhase?: string | null;
}

const Context = React.createContext<ContextDescriptor | null>(null);

export function Page() {
  const [project] = Paper.useLoadedData() as [Projects.Project];

  const searchParams = new URLSearchParams(window.location.search);
  const newPhase = searchParams.get("phase");
  const messageType = newPhase ? "phase-change" : "update";
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
        <Context.Provider value={{ project, messageType, currentPhase, newPhase }}>
          <NewUpdateHeader project={project} />
          <Editor project={project} />
        </Context.Provider>
      </Paper.Body>
    </Paper.Root>
  );
}

function NewUpdateHeader({ project }) {
  const { messageType, newPhase } = React.useContext(Context) as ContextDescriptor;

  switch (messageType) {
    case "phase-change":
      return (
        <div>
          <div className="uppercase text-white-1 tracking-wide w-full mb-2">PHASE CHANGE</div>
          <div className="text-4xl font-bold mx-auto">
            <span className="capitalize">{project.phase}</span> -&gt; <span className="capitalize">{newPhase}</span>
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
  const { messageType, newPhase } = React.useContext(Context) as ContextDescriptor;

  const editor = TipTapEditor.useEditor({
    placeholder: "Write your update here...",
  });

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
