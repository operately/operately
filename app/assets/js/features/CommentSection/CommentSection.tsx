import React from "react";

import * as People from "@/models/people";
import * as Reactions from "@/models/reactions";

import { Avatar } from "turboui";
import FormattedTime from "@/components/FormattedTime";
import { PrimaryButton, SecondaryButton } from "turboui";
import { useClearNotificationOnIntersection } from "@/features/notifications";

import { FormState } from "./form";
import { useBoolState } from "@/hooks/useBoolState";
import { ReactionList, useReactionsForm } from "@/features/Reactions";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { compareIds } from "@/routes/paths";
import { CommentParentType } from "@/models/comments";
import { useScrollIntoViewOnLoad } from "./useScrollIntoViewOnLoad";
import {
  Menu,
  MenuActionItem,
  RichContent,
  IconSquare,
  IconSquareCheckFilled,
  IconSquareChevronsLeftFilled,
  IconEdit,
  IconTrash,
  useEditor,
  Editor,
} from "turboui";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";

interface CommentSectionProps {
  form: FormState;
  commentParentType: CommentParentType;
  canComment: boolean;
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
                commentParentType={props.commentParentType}
                canComment={props.canComment}
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

        {props.canComment && <CommentBox form={props.form} />}
      </div>
    </>
  );
}

function Comment({ comment, form, commentParentType, canComment }) {
  const [editing, _, startEditing, stopEditing] = useBoolState(false);
  const isSolution = Boolean(comment.isSolution);
  const markSolution = form.markCommentAsSolution
    ? () => form.markCommentAsSolution?.(comment.id)
    : undefined;
  const unmarkSolution = form.unmarkCommentAsSolution
    ? () => form.unmarkCommentAsSolution?.(comment.id)
    : undefined;
  const canMarkSolution = Boolean(markSolution && comment.canMarkAsSolution && !isSolution);
  const canUnmarkSolution = Boolean(unmarkSolution && comment.canUnmarkSolution && isSolution);

  if (editing) {
    return <EditComment comment={comment} onCancel={stopEditing} form={form} />;
  } else {
    return (
      <ViewComment
        comment={comment}
        onEdit={startEditing}
        onDelete={() => void form.deleteComment(comment.id)}
        onMarkSolution={markSolution}
        onUnmarkSolution={unmarkSolution}
        isSolution={isSolution}
        canMarkSolution={canMarkSolution}
        canUnmarkSolution={canUnmarkSolution}
        commentParentType={commentParentType}
        canComment={canComment}
      />
    );
  }
}

function EditComment({ comment, onCancel, form }) {
  const me = useMe()!;

  const handlers = useRichEditorHandlers({ scope: form.mentionSearchScope });
  const editor = useEditor({
    placeholder: "Write a comment here...",
    className: "min-h-[200px] p-4",
    content: JSON.parse(comment.content)["message"],
    handlers,
  });

  const handlePost = async () => {
    if (!editor) return;
    if (editor.uploading) return;

    form.editComment(comment.id, editor.editor.getJSON());
    onCancel();
  };

  return (
    <div className="py-6 not-first:border-t border-surface-outline flex items-start gap-3">
      <Avatar person={me} size="normal" />
      <div className="flex-1">
        <div className="border border-surface-outline rounded-lg overflow-hidden">
          <Editor editor={editor} hideBorder padding="p-0" />

          <div className="flex justify-between items-center m-4">
            <div className="flex items-center gap-2">
              <PrimaryButton onClick={handlePost} testId="post-comment" size="xs" loading={form.submitting}>
                {editor.uploading ? "Uploading..." : "Save Changes"}
              </PrimaryButton>

              <SecondaryButton onClick={onCancel} size="xs">
                Cancel
              </SecondaryButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MilestoneCompleted({ comment }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 not-first:border-t border-stroke-base text-content-accent relative">
      <div className="shrink-0 mt-1">
        <Avatar person={comment.author} size="normal" />
      </div>

      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <IconSquareCheckFilled size={20} className="text-accent-1" />
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
      <div className="shrink-0 mt-1">
        <Avatar person={comment.author} size="normal" />
      </div>

      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <IconSquareChevronsLeftFilled size={20} className="text-yellow-500" />
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

function ViewComment({
  comment,
  onEdit,
  onDelete,
  onMarkSolution,
  onUnmarkSolution,
  isSolution,
  canMarkSolution,
  canUnmarkSolution,
  commentParentType,
  canComment,
}) {
  const commentRef = useClearNotificationOnIntersection(comment.notification);
  useScrollIntoViewOnLoad(comment.id);

  const { mentionedPersonLookup } = useRichEditorHandlers({ scope: People.NoneSearchScope });
  const entity = Reactions.entity(comment.id, "comment", commentParentType);
  const addReactionForm = useReactionsForm(entity, comment.reactions);

  const testId = "comment-" + comment.id;
  const content = JSON.parse(comment.content)["message"];

  return (
    <div
      className="flex items-start justify-between gap-3 py-3 not-first:border-t border-stroke-base text-content-accent relative"
      data-test-id={testId}
      id={comment.id}
      ref={commentRef}
    >
      <div className="shrink-0">
        <Avatar person={comment.author} size="normal" />
      </div>

      <div className="flex-1">
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold -mt-0.5">
              {comment.author.fullName}
              {isSolution && <SolutionBadge />}
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-content-dimmed text-sm">
                <FormattedTime time={comment.insertedAt} format="relative" />
              </span>

              <CommentDropdownMenu
                comment={comment}
                onEdit={onEdit}
                onDelete={onDelete}
                onMarkSolution={onMarkSolution}
                onUnmarkSolution={onUnmarkSolution}
                canMarkSolution={canMarkSolution}
                canUnmarkSolution={canUnmarkSolution}
              />
            </div>
          </div>
        </div>

        <div className="mb-2">
          <RichContent content={content} mentionedPersonLookup={mentionedPersonLookup} />
        </div>

        <ReactionList form={addReactionForm} size={20} canAddReaction={canComment} />
      </div>
    </div>
  );
}

function CommentDropdownMenu({
  comment,
  onEdit,
  onDelete,
  onMarkSolution,
  onUnmarkSolution,
  canMarkSolution,
  canUnmarkSolution,
}) {
  const me = useMe()!;
  const isAuthor = compareIds(me.id, comment.author.id);

  const showEdit = isAuthor && Boolean(onEdit);
  const showDelete = isAuthor && Boolean(onDelete);
  const showMarkSolution = Boolean(canMarkSolution && onMarkSolution);
  const showUnmarkSolution = Boolean(canUnmarkSolution && onUnmarkSolution);

  if (!showEdit && !showDelete && !showMarkSolution && !showUnmarkSolution) return null;

  return (
    <Menu size="small" testId="comment-options">
      {showEdit && (
        <MenuActionItem onClick={onEdit} testId="edit-comment" icon={IconEdit}>
          Edit
        </MenuActionItem>
      )}
      {showMarkSolution && (
        <MenuActionItem onClick={onMarkSolution!} testId="mark-solution" icon={IconSquareCheckFilled}>
          Mark as solution
        </MenuActionItem>
      )}
      {showUnmarkSolution && (
        <MenuActionItem onClick={onUnmarkSolution!} testId="remove-solution" icon={IconSquare}>
          Remove solution
        </MenuActionItem>
      )}
      {showDelete && (
        <MenuActionItem onClick={onDelete} testId="delete-comment" icon={IconTrash} danger>
          Delete
        </MenuActionItem>
      )}
    </Menu>
  );
}

function SolutionBadge() {
  return (
    <span className="flex items-center gap-1 rounded-full bg-accent-1/10 px-2 py-0.5 text-xs font-semibold text-accent-1">
      <IconSquareCheckFilled size={14} />
      Solution
    </span>
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
          <IconSquareCheckFilled size={24} className="text-accent-1" />
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

function CommentBox({ form }) {
  const [active, _, activate, deactivate] = useBoolState(false);

  if (active) {
    return <AddCommentActive onBlur={deactivate} onPost={deactivate} form={form} />;
  } else {
    return <AddCommentNonActive onClick={activate} />;
  }
}

function AddCommentNonActive({ onClick }) {
  const me = useMe()!;

  return (
    <div
      className="py-4 sm:py-6 not-first:border-t border-stroke-base cursor-pointer flex items-center gap-3"
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

  const handlers = useRichEditorHandlers({ scope: form.mentionSearchScope });
  const editor = useEditor({
    placeholder: "Write a comment here...",
    className: "min-h-[200px] px-4 py-3",
    autoFocus: true,
    handlers,
  });

  const handlePost = async () => {
    if (!editor) return;
    if (editor.uploading) return;

    form.postComment(editor.editor.getJSON());
    onPost();
  };

  React.useEffect(() => {
    if (editor) {
      editor.editor.commands.focus();
    }
  }, [editor.editor]);

  return (
    <div className="py-6 not-first:border-t border-surface-outline flex items-start gap-3">
      <Avatar person={me} size="normal" />
      <div className="flex-1">
        <div className="border border-surface-outline rounded-lg overflow-hidden">
          <Editor editor={editor} hideBorder padding="p-0" />

          <div className="flex justify-between items-center m-4">
            <div className="flex items-center gap-2">
              <PrimaryButton onClick={handlePost} loading={form.submitting} testId="post-comment" size="xs">
                {editor.uploading ? "Uploading..." : "Post"}
              </PrimaryButton>

              <SecondaryButton onClick={onBlur} size="xs">
                Cancel
              </SecondaryButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
