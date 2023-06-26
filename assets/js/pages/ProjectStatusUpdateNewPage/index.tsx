import React from "react";

import * as Icons from "@tabler/icons-react";
import * as TipTapEditor from "@/components/Editor";
import * as Paper from "@/components/PaperContainer";

import { useNavigate, useParams } from "react-router-dom";

import * as Projects from "@/graphql/Projects";

import Button from "@/components/Button";

export function ProjectStatusUpdateNewPage() {
  const params = useParams();
  const id = params["project_id"];

  if (!id) return <p className="mt-16">Unable to find project</p>;

  const { loading, error, data } = Projects.useProject(id);

  if (loading) return <p className="mt-16">Loading...</p>;
  if (error) return <p className="mt-16">Error : {error.message}</p>;
  if (!data) return <p className="mt-16">Can't find project</p>;

  let project = data.project;

  return (
    <Paper.Root>
      <Paper.Navigation>
        <Paper.NavItem linkTo={`/projects/${project.id}`}>
          <Icons.IconClipboardList size={16} />
          {project.name}
        </Paper.NavItem>

        <Icons.IconSlash size={16} />

        <Paper.NavItem linkTo={`/projects/${project.id}/updates`}>Status Updates</Paper.NavItem>
      </Paper.Navigation>

      <Paper.Body>
        <div className="px-16 py-16">
          <NewUpdateHeader />
          <Editor project={project} />
        </div>
      </Paper.Body>
    </Paper.Root>
  );
}

function NewUpdateHeader() {
  return (
    <div>
      <div className="uppercase text-white-1 tracking-wide w-full mb-2">STATUS UPDATE</div>

      <div className="text-4xl font-bold mx-auto">What's new since the last update?</div>
    </div>
  );
}

function Editor({ project }) {
  const navigate = useNavigate();

  const editor = TipTapEditor.useEditor({
    placeholder: "Write your update here...",
  });

  const [post] = Projects.usePostUpdate(project.id, {
    onCompleted: (data) => {
      navigate(`/projects/${project.id}/updates/${data.createUpdate.id}`);
    },
  });

  return (
    <div>
      <div className="flex items-center gap-1 border-y border-shade-2 px-2 py-1 mt-8 -mx-2">
        <TipTapEditor.Toolbar editor={editor} />
      </div>

      <div className="mb-8 py-4 text-white-1 text-lg" style={{ minHeight: "300px" }}>
        <TipTapEditor.EditorContent editor={editor} />
      </div>

      <div className="flex items-center gap-2">
        <PostButton onClick={() => post(editor.getJSON())} />
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
