import React from "react";

import * as Icons from "@tabler/icons-react";
import * as People from "@/graphql/People";
import * as Milestones from "@/graphql/Projects/milestones";
import * as TipTapEditor from "@/components/Editor";

import FormattedTime from "@/components/FormattedTime";
import RichContent from "@/components/RichContent";
import Button from "@/components/Button";
import Avatar from "@/components/Avatar";

import { useBoolState } from "@/utils/useBoolState";
import { useRefresh } from "./loader";

export function Comments({ milestone, me }) {
  return (
    <div className="-mx-12 px-12 -mb-10 pb-10 rounded-b bg-surface-dimmed border-t border-surface-outline">
      <h1 className="uppercase text-xs font-semibold text-content-accent pb-4 mt-8">Comments</h1>

      {milestone.comments.map((comment) => (
        <React.Fragment key={comment.id}>
          {comment.comment.message !== "null" && <Comment key={comment.id} comment={comment.comment} />}
          {comment.action === "complete" && <CompletedComment comment={comment.comment} />}
          {comment.action === "reopen" && <ReopenedComment comment={comment.comment} />}
        </React.Fragment>
      ))}

      <AddComment milestone={milestone} me={me} />
    </div>
  );
}

function CommentShell({ author, time, children }) {
  return (
    <div className="flex items-start justify-between gap-3 py-3 not-first:border-t border-stroke-base text-content-accent">
      <div className="text-sm w-1/5">
        <div className="font-medium text-content-accent">
          <FormattedTime time={time} format="short-date" />
        </div>
        <div className="text-content-dimmed">
          <FormattedTime time={time} format="time-only" />
        </div>
      </div>

      <div className="shrink-0">
        <Avatar person={author} size="normal" />
      </div>

      <div className="flex-1">{children}</div>
    </div>
  );
}

function Comment({ comment }) {
  return (
    <CommentShell author={comment.author} time={comment.insertedAt}>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="font-bold -mt-0.5">{comment.author.fullName}</div>
        </div>
      </div>

      <RichContent jsonContent={content} />
    </CommentShell>
  );
}

function CompletedComment({ comment }) {
  return (
    <CommentShell author={comment.author} time={comment.insertedAt}>
      <div className="flex items-center gap-1 mt-1.5">
        <Icons.IconSquareCheckFilled size={20} className="text-accent-1" />
        <div className="flex-1 pr-2 font-semibold text-content-accent">Completed the Milestone</div>
      </div>
    </CommentShell>
  );
}

function ReopenedComment({ comment }) {
  return (
    <CommentShell author={comment.author} time={comment.insertedAt}>
      <div className="flex items-center gap-1 mt-1.5">
        <Icons.IconSquareChevronsLeftFilled size={20} className="text-yellow-500" />
        <div className="flex-1 pr-2 font-semibold text-content-accent">Re-Opened the Milestone</div>
      </div>
    </CommentShell>
  );
}

function CommentMilestoneCreated({ author, milestone }) {
  return (
    <CommentShell author={author} time={milestone.insertedAt}>
      <div className="flex items-center gap-1 mt-1.5">
        <div className="flex-1 pr-2 font-semibold text-content-accent">Added this Milestone to the Project</div>
      </div>
    </CommentShell>
  );
}

function AddComment({ milestone, me }) {
  const [active, _, activate, deactivate] = useBoolState(false);

  if (active) {
    return <AddCommentActive milestone={milestone} me={me} deactivate={deactivate} />;
  } else {
    return <AddCommentInactive activate={activate} me={me} />;
  }
}

function AddCommentInactive({ me, activate }) {
  return (
    <div className="flex items-start justify-between gap-3 py-3 not-first:border-t border-stroke-base text-content-accent">
      <div className="w-1/5"></div>
      <div className="flex-1 flex items-center gap-3">
        <div className="shrink-0">
          <Avatar person={me} size="normal" />
        </div>

        <div className="flex-1 text-content-dimmed mt-1 cursor-pointer" onClick={activate}>
          Add a comment...
        </div>
      </div>
    </div>
  );
}

function AddCommentActive({ milestone, me, deactivate }) {
  const refetch = useRefresh();

  const { editor, submittable, focused, empty } = TipTapEditor.useEditor({
    peopleSearch: People.usePeopleSearch(),
    placeholder: "Leave a comment...",
    className: "px-2 py-1.5 min-h-[150px]",
  });

  const [post, { loading }] = Milestones.usePostComment();

  const submit = async (action: "none" | "complete" | "reopen") => {
    if (!editor) return;
    if (!submittable) return;
    if (loading) return;

    const content = empty ? null : JSON.stringify(editor.getJSON());

    await post({
      variables: {
        input: {
          milestoneID: milestone.id,
          content: content,
          action: action,
        },
      },
    });

    editor.commands.clearContent(true);
    deactivate();
    refetch();
  };

  const avatar = <Avatar person={me} size="small" />;
  const commentBox = (
    <div data-test-id="milestone-comment-editor">
      <TipTapEditor.Root editor={editor}>
        <div className="rounded border-x border-b border-stroke-base bg-surface">
          <TipTapEditor.Toolbar editor={editor} />
          <TipTapEditor.EditorContent editor={editor} />
          <div className={"p-2 flex flex-row-reverse" + " " + (focused ? "opacity-100" : "opacity-0")}></div>
        </div>
      </TipTapEditor.Root>

      <div className="flex flex-row-reverse gap-2 mt-3">
        <Button variant="success" disabled={!submittable} onClick={() => submit("none")} data-test-id="post-comment">
          {submittable ? "Comment" : "Uploading..."}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex items-start justify-between gap-3 py-3 not-first:border-t border-stroke-base text-content-accent">
      <div className="w-1/5"></div>
      <div className="flex-1 flex items-start gap-3">
        <div className="shrink-0">{avatar}</div>
        <div className="flex-1">{commentBox}</div>
      </div>
    </div>
  );
}
