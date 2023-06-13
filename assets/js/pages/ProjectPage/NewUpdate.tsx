import React from "react";

import * as Icons from "tabler-icons-react";
import * as TipTapEditor from "@/components/Editor";

import { Link, useNavigate } from "react-router-dom";

import { usePostUpdateMutation } from "@/graphql/Projects";

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

      <div className="mb-8 py-4 text-white-1 text-lg">
        <TipTapEditor.EditorContent editor={editor} />
      </div>

      <div className="flex items-center gap-2">
        <PostButton onClick={handlePost} active={!loading} />
        <CancelButton linkTo={`/projects/${project.id}`} />
      </div>
    </div>
  );
}

function PostButton({ onClick, active }) {
  const activeClass =
    "text-pink-400 font-bold uppercase border border-pink-400 rounded-full hover:bg-pink-400/10 px-3 py-1.5 text-sm flex items-center gap-2 mt-4";
  const className = active
    ? activeClass
    : activeClass + " opacity-50 cursor-not-allowed";

  return (
    <button onClick={onClick} className={className}>
      <Icons.Mail size={20} />
      Post Update
    </button>
  );
}

function CancelButton({ linkTo }) {
  return (
    <Link
      to={linkTo}
      className="font-bold uppercase border border-white-2 rounded-full hover:border-white-2 text-white-2 hover:text-white-1 px-3 py-1.5 text-sm flex items-center gap-2 mt-4"
    >
      Cancel
    </Link>
  );
}

export default function NewUpdate({ project }) {
  return (
    <div className="mt-24">
      <div className="mx-auto max-w-5xl relative bg-dark-2 rounded-[20px] px-32 py-16">
        <NewUpdateHeader />
        <Editor project={project} />
      </div>
    </div>
  );
}
