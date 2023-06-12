import React from "react";

import * as Icons from "tabler-icons-react";
import * as TipTapEditor from "@/components/Editor";

import { Link } from "react-router-dom";

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
  const editor = TipTapEditor.useEditor({
    placeholder: "Write your update here...",
  });

  return (
    <div>
      <div className="flex items-center gap-1 border-y border-shade-2 px-2 py-1 mt-8 -mx-2">
        <TipTapEditor.Toolbar editor={editor} />
      </div>

      <div className="mb-8 py-4 text-white-1 text-lg">
        <TipTapEditor.EditorContent editor={editor} />
      </div>

      <div className="flex items-center gap-2">
        <PostButton project={project} />
        <CancelButton linkTo={`/projects/${project.id}`} />
      </div>
    </div>
  );
}

function PostButton({ project }) {
  return (
    <button className="text-pink-400 font-bold uppercase border border-pink-400 rounded-full hover:bg-pink-400/10 text-white-1 px-3 py-1.5 text-sm flex items-center gap-2 mt-4">
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
