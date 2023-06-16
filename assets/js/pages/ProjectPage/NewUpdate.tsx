import React from "react";

import * as Icons from "@tabler/icons-react";
import * as TipTapEditor from "@/components/Editor";
import * as Paper from "@/components/PaperContainer";

import { Link, useNavigate } from "react-router-dom";

import { usePostUpdateMutation } from "@/graphql/Projects";

import Button from "@/components/Button";

function NewUpdateHeader() {
  return (
    <div>
      <div className="uppercase text-white-1 tracking-wide w-full mb-2">
        STATUS UPDATE
      </div>

      <div className="text-4xl font-bold mx-auto">
        What's new since the last update?
      </div>
    </div>
  );
}

function Editor({ project }) {
  const navigate = useNavigate();
  const [postUpdate, { loading }] = usePostUpdateMutation(project.id);

  const editor = TipTapEditor.useEditor({
    placeholder: "Write your update here...",
  });

  const handlePost = async () => {
    if (!editor) return;
    if (loading) return;

    await postUpdate(editor.getJSON());

    navigate(`/projects/${project.id}`);
  };

  return (
    <div>
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
        <CancelButton linkTo={`/projects/${project.id}`} />
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

export default function NewUpdate({ project }) {
  return (
    <Paper.Root>
      <Paper.Navigation>
        <Paper.NavItem linkTo={`/projects/${project.id}`}>
          <Icons.IconClipboardList size={16} />
          {project.name}
        </Paper.NavItem>
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
