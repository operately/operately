import React from "react";

import * as People from "@/graphql/People";
import * as Updates from "@/graphql/Projects/updates";
import * as Icons from "@tabler/icons-react";

import { useAddReaction } from "./useAddReaction";

import Avatar from "@/components/Avatar";
import FormattedTime from "@/components/FormattedTime";
import RichContent from "@/components/RichContent";
import * as Feed from "@/features/feed";
import * as TipTapEditor from "@/components/Editor";
import Button from "@/components/Button";

import { useBoolState } from "@/utils/useBoolState";
import { useLoadedData, useRefresh } from "./loader";

export function CommentSection() {
  const { update } = useLoadedData();
  const { beforeAck, afterAck } = Updates.splitCommentsBeforeAndAfterAck(update);

  return (
    <>
      <div className="text-content-accent font-extrabold border-b border-stroke-base pb-4">Comments</div>
      <div className="flex flex-col">
        {beforeAck.map((c) => (
          <Comment key={c.id} comment={c} />
        ))}

        <AckComment update={update} />

        {afterAck.map((c) => (
          <Comment key={c.id} comment={c} />
        ))}

        <CommentBox />
      </div>
    </>
  );
}

function Comment({ comment }) {
  const [editing, _, startEditing, stopEditing] = useBoolState(false);

  if (editing) {
    return <EditComment comment={comment} onCancel={stopEditing} />;
  } else {
    return <ViewComment comment={comment} onEdit={startEditing} />;
  }
}

function EditComment({ comment, onCancel }) {
  const { me } = useLoadedData();
  const refresh = useRefresh();

  const { editor, uploading } = TipTapEditor.useEditor({
    placeholder: "Write a comment here...",
    peopleSearch: People.usePeopleSearch(),
    className: "min-h-[200px] p-4",
    content: JSON.parse(JSON.parse(comment.message)),
  });

  const [edit, { loading }] = Updates.useEditComment();

  const handlePost = async () => {
    if (!editor) return;
    if (uploading) return;
    if (loading) return;

    await edit({
      variables: {
        input: {
          commentId: comment.id,
          content: JSON.stringify(editor.getJSON()),
        },
      },
    });

    refresh();
    await onCancel();
  };

  return (
    <div className="py-6 not-first:border-t border-surface-outline flex items-start gap-3">
      <Avatar person={me} size="normal" />
      <div className="flex-1">
        <TipTapEditor.Root editor={editor}>
          <div className="border border-surface-outline">
            <TipTapEditor.Toolbar editor={editor} />
            <TipTapEditor.EditorContent editor={editor} />

            <div className="flex justify-between items-center m-4">
              <div className="flex items-center gap-2">
                <Button
                  onClick={handlePost}
                  loading={loading}
                  variant="success"
                  data-test-id="post-comment"
                  size="small"
                  disabled={uploading}
                >
                  {uploading ? "Uploading..." : "Save Changes"}
                </Button>

                <Button variant="secondary" onClick={onCancel} size="small">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </TipTapEditor.Root>
      </div>
    </div>
  );
}

function ViewComment({ comment, onEdit }) {
  const refresh = useRefresh();
  const addReactionForm = useAddReaction(comment.id, "comment", refresh);
  const testId = "comment-" + comment.id;

  return (
    <div
      className="flex items-start justify-between gap-3 py-3 not-first:border-t border-stroke-base text-content-accent"
      data-test-id={testId}
    >
      <div onClick={onEdit} className="flex-1">
        Edit
      </div>

      <div className="shrink-0">
        <Avatar person={comment.author} size="normal" />
      </div>

      <div className="flex-1">
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="font-bold -mt-0.5">{comment.author.fullName}</div>
            <span className="text-content-dimmed text-sm">
              <FormattedTime time={comment.insertedAt} format="relative" />
            </span>
          </div>
        </div>

        <div className="mb-1">
          <RichContent jsonContent={JSON.parse(comment.message)} />
        </div>

        <Feed.Reactions reactions={comment.reactions} size={20} form={addReactionForm} />
      </div>
    </div>
  );
}

function AckComment({ update }) {
  if (!update.acknowledged) return null;

  const person = update.acknowledgingPerson;

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
            <FormattedTime time={update.acknowledgedAt} format="relative" />
          </span>
        </div>
      </div>
    </div>
  );
}

function CommentBox() {
  const refetch = useRefresh();

  const [active, _, activate, deactivate] = useBoolState(false);

  const onPost = () => {
    deactivate();
    refetch();
  };

  if (active) {
    return <AddCommentActive onBlur={deactivate} onPost={onPost} />;
  } else {
    return <AddCommentNonActive onClick={activate} />;
  }
}

function AddCommentNonActive({ onClick }) {
  const { me } = useLoadedData();

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

function AddCommentActive({ onBlur, onPost }) {
  const { update, me } = useLoadedData();
  const peopleSearch = People.usePeopleSearch();

  const { editor, uploading } = TipTapEditor.useEditor({
    placeholder: "Write a comment here...",
    peopleSearch: peopleSearch,
    className: "min-h-[200px] p-4",
  });

  const [post, { loading }] = Updates.usePostComment();

  const handlePost = async () => {
    if (!editor) return;
    if (uploading) return;
    if (loading) return;

    await post({
      variables: {
        input: {
          updateId: update.id,
          content: JSON.stringify(editor.getJSON()),
        },
      },
    });

    await onPost();
  };

  return (
    <div className="py-6 not-first:border-t border-surface-outline flex items-start gap-3">
      <Avatar person={me} size="normal" />
      <div className="flex-1">
        <TipTapEditor.Root editor={editor}>
          <div className="border border-surface-outline">
            <TipTapEditor.Toolbar editor={editor} />
            <TipTapEditor.EditorContent editor={editor} />

            <div className="flex justify-between items-center m-4">
              <div className="flex items-center gap-2">
                <Button
                  onClick={handlePost}
                  loading={loading}
                  variant="success"
                  data-test-id="post-comment"
                  size="small"
                  disabled={uploading}
                >
                  {uploading ? "Uploading..." : "Post"}
                </Button>

                <Button variant="secondary" onClick={onBlur} size="small">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </TipTapEditor.Root>
      </div>
    </div>
  );
}
