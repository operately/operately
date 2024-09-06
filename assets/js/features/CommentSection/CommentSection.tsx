import React from "react";

import * as Icons from "@tabler/icons-react";
import * as PageOptions from "@/components/PaperContainer/PageOptions";
import * as TipTapEditor from "@/components/Editor";

import Avatar from "@/components/Avatar";
import FormattedTime from "@/components/FormattedTime";
import RichContent from "@/components/RichContent";
import { FilledButton } from "@/components/Buttons";

import { FormState } from "./form";
import { useBoolState } from "@/utils/useBoolState";
import { ReactionList, useReactionsForm } from "@/features/Reactions";
import { useMe } from "@/contexts/CurrentUserContext";
import { compareIds } from "@/routes/paths";

interface CommentSectionProps {
  form: FormState;
  refresh: () => void;
  commentParentType: "project_check_in" | "comment_thread" | "goal_update" | "discussion" | "milestone";
}

export function CommentSection(props: CommentSectionProps) {
  return (
    <>
      <div className="flex flex-col">
        {props.form.items.map((item, index) => {
          if (item.type === "comment") {
            return (
              <Comment
                key={index}
                comment={item.value}
                form={props.form}
                refresh={props.refresh}
                commentParentType={props.commentParentType}
              />
            );
          } else if (item.type === "milestone-completed") {
            return <MilestoneCompleted key={index} comment={item.value} />;
          } else if (item.type === "milestone-reopened") {
            return <MilestoneReopened key={index} comment={item.value} />;
          } else {
            return <AckComment key={index} person={item.value} ackAt={item.insertedAt} />;
          }
        })}

        <CommentBox refresh={props.refresh} form={props.form} />
      </div>
    </>
  );
}

function Comment({ comment, form, refresh, commentParentType }) {
  const [editing, _, startEditing, stopEditing] = useBoolState(false);

  if (editing) {
    return <EditComment comment={comment} onCancel={stopEditing} form={form} refresh={refresh} />;
  } else {
    return <ViewComment comment={comment} onEdit={startEditing} commentParentType={commentParentType} />;
  }
}

function EditComment({ comment, onCancel, form, refresh }) {
  const me = useMe()!;

  const { editor, uploading } = TipTapEditor.useEditor({
    placeholder: "Write a comment here...",
    className: "min-h-[200px] p-4",
    content: JSON.parse(comment.content)["message"],
  });

  const handlePost = async () => {
    if (!editor) return;
    if (uploading) return;

    await form.editComment(comment.id, editor.getJSON());
    await refresh();
    await onCancel();
  };

  return (
    <div className="py-6 not-first:border-t border-surface-outline flex items-start gap-3">
      <Avatar person={me} size="normal" />
      <div className="flex-1">
        <TipTapEditor.Root editor={editor}>
          <div className="border border-surface-outline rounded-lg overflow-hidden">
            <TipTapEditor.Toolbar editor={editor} noTopBorder />
            <TipTapEditor.EditorContent editor={editor} />

            <div className="flex justify-between items-center m-4">
              <div className="flex items-center gap-2">
                <FilledButton
                  onClick={handlePost}
                  type="primary"
                  testId="post-comment"
                  size="xs"
                  loading={form.submitting}
                >
                  {uploading ? "Uploading..." : "Save Changes"}
                </FilledButton>

                <FilledButton type="secondary" onClick={onCancel} size="xs">
                  Cancel
                </FilledButton>
              </div>
            </div>
          </div>
        </TipTapEditor.Root>
      </div>
    </div>
  );
}

function MilestoneCompleted({ comment }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 not-first:border-t border-stroke-base text-content-accent relative">
      <div className="shrink-0">
        <Avatar person={comment.author} size="normal" />
      </div>

      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 mt-1.5">
            <Icons.IconSquareCheckFilled size={20} className="text-accent-1" />
            <div className="flex-1 pr-2 font-semibold text-content-accent">Completed the Milestone</div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-content-dimmed text-sm">
              <FormattedTime time={comment.insertedAt} format="relative" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MilestoneReopened({ comment }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 not-first:border-t border-stroke-base text-content-accent relative">
      <div className="shrink-0">
        <Avatar person={comment.author} size="normal" />
      </div>

      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Icons.IconSquareChevronsLeftFilled size={20} className="text-yellow-500" />
            <div className="flex-1 pr-2 font-semibold text-content-accent">Re-Opened the Milestone</div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-content-dimmed text-sm">
              <FormattedTime time={comment.insertedAt} format="relative" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ViewComment({ comment, onEdit, commentParentType }) {
  const me = useMe()!;
  const entity = { id: comment.id, type: "comment", parentType: commentParentType };
  const addReactionForm = useReactionsForm(entity, comment.reactions);
  const testId = "comment-" + comment.id;
  const content = JSON.parse(comment.content)["message"];

  return (
    <div
      className="flex items-start justify-between gap-3 py-3 not-first:border-t border-stroke-base text-content-accent relative"
      data-test-id={testId}
    >
      <div className="shrink-0">
        <Avatar person={comment.author} size="normal" />
      </div>

      <div className="flex-1">
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="font-bold -mt-0.5">{comment.author.fullName}</div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-content-dimmed text-sm">
                <FormattedTime time={comment.insertedAt} format="relative" />
              </span>

              {compareIds(me.id, comment.author.id) && (
                <PageOptions.Root testId="comment-options" noBorder>
                  <PageOptions.Action
                    onClick={onEdit}
                    icon={Icons.IconEdit}
                    title="Edit Comment"
                    testId="edit-comment"
                  />
                </PageOptions.Root>
              )}
            </div>
          </div>
        </div>

        <div className="mb-2">
          <RichContent jsonContent={content} skipParse />
        </div>

        <ReactionList form={addReactionForm} size={20} />
      </div>
    </div>
  );
}

function AckComment({ person, ackAt }) {
  return (
    <div className="flex items-center justify-between gap-3 py-6 not-first:border-t border-stroke-base text-content-accent">
      <div className="shrink-0">
        <Avatar person={person} size="normal" />
      </div>

      <div className="flex items-center justify-between flex-1">
        <div className="flex items-center gap-2 font-bold flex-1">
          {person.fullName} acknowledged this Check-In
          <Icons.IconSquareCheckFilled size={24} className="text-accent-1" />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-content-dimmed text-sm">
            <FormattedTime time={ackAt} format="relative" />
          </span>
        </div>
      </div>
    </div>
  );
}

function CommentBox({ refresh, form }) {
  const [active, _, activate, deactivate] = useBoolState(false);

  const onPost = () => {
    refresh();
    setTimeout(() => deactivate(), 300);
  };

  if (active) {
    return <AddCommentActive onBlur={deactivate} onPost={onPost} form={form} />;
  } else {
    return <AddCommentNonActive onClick={activate} />;
  }
}

function AddCommentNonActive({ onClick }) {
  const me = useMe()!;

  return (
    <div
      className="py-6 not-first:border-t border-stroke-base cursor-pointer flex items-center gap-3"
      data-test-id="add-comment"
      onClick={onClick}
    >
      <Avatar person={me} size="normal" />
      Write a comment here...
    </div>
  );
}

function AddCommentActive({ onBlur, onPost, form }) {
  const me = useMe()!;

  const { editor, uploading } = TipTapEditor.useEditor({
    placeholder: "Write a comment here...",
    className: "min-h-[200px] px-4 py-3",
    autoFocus: true,
  });

  const handlePost = async () => {
    if (!editor) return;
    if (uploading) return;

    await form.postComment(editor.getJSON());
    await onPost();
  };

  React.useEffect(() => {
    if (editor) {
      editor.commands.focus();
    }
  }, [editor]);

  return (
    <div className="py-6 not-first:border-t border-surface-outline flex items-start gap-3">
      <Avatar person={me} size="normal" />
      <div className="flex-1">
        <TipTapEditor.Root editor={editor}>
          <div className="border border-surface-outline rounded-lg overflow-hidden">
            <TipTapEditor.Toolbar editor={editor} noTopBorder />
            <TipTapEditor.EditorContent editor={editor} />

            <div className="flex justify-between items-center m-4">
              <div className="flex items-center gap-2">
                <FilledButton
                  onClick={handlePost}
                  loading={form.submitting}
                  type="primary"
                  testId="post-comment"
                  size="xs"
                >
                  {uploading ? "Uploading..." : "Post"}
                </FilledButton>

                <FilledButton type="secondary" onClick={onBlur} size="xs">
                  Cancel
                </FilledButton>
              </div>
            </div>
          </div>
        </TipTapEditor.Root>
      </div>
    </div>
  );
}
