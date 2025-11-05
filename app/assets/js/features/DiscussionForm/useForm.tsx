import * as TipTapEditor from "@/components/Editor";
import * as Discussions from "@/models/discussions";
import * as Spaces from "@/models/spaces";
import * as React from "react";

import { SubscriptionsState, useSubscriptionsAdapter } from "@/models/subscriptions";
import { Subscriber } from "@/models/notifications";
import { usePaths } from "@/routes/paths";
import { useNavigate } from "react-router-dom";
import { useEditor } from "turboui";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";

interface UseFormOptions {
  mode: "create" | "edit";
  space: Spaces.Space;
  discussion?: Discussions.Discussion;
  potentialSubscribers?: Subscriber[];
}

export interface FormState {
  title: string;
  setTitle: (title: string) => void;
  editor: TipTapEditor.EditorState;

  mode: "create" | "edit";
  space: Spaces.Space;

  postMessage: () => Promise<boolean>;
  postAsDraft: () => Promise<boolean>;
  saveChanges: () => Promise<boolean>;
  publishDraft: () => Promise<boolean>;

  postMessageSubmitting: boolean;
  postAsDraftSubmitting: boolean;
  saveChangesSubmitting: boolean;
  publishDraftSubmitting: boolean;

  errors: Error[];

  cancelPath: string;
  subscriptionsState: SubscriptionsState;
}

interface Error {
  field: string;
  message: string;
}

export function useForm({ space, mode, discussion, potentialSubscribers = [] }: UseFormOptions): FormState {
  const paths = usePaths();
  const subscriptionsState = useSubscriptionsAdapter(potentialSubscribers, { ignoreMe: true, spaceName: space.name });

  const [errors, setErrors] = React.useState<Error[]>([]);
  const [title, setTitle] = React.useState(() => discussion?.title || "");

  const handlers = useRichEditorHandlers({ scope: { type: "space", id: space ? space.id : discussion?.space?.id! } });
  const editor = useEditor({
    placeholder: "Write here...",
    className: "min-h-[350px] py-2 px-1",
    content: discussion?.body && JSON.parse(discussion.body),
    handlers,
  });

  const validate = () => {
    if (!editor.editor) return false;
    if (editor.uploading) return false;

    const foundErrors: Error[] = [];
    if (title.trim() === "") foundErrors.push({ field: "title", message: "Title is required" });

    if (foundErrors.length) {
      setErrors(foundErrors);
      return false;
    }

    return true;
  };

  const [postMessage, postMessageSubmitting] = usePostMessage({ space, title, editor, subscriptionsState, validate });
  const [postAsDraft, postAsDraftSubmitting] = usePostAsDraft({ space, title, editor, subscriptionsState, validate });
  const [saveChanges, saveChangesSubmitting] = useSaveChanges({ discussion, title, editor, validate });
  const [publishDraft, publishDraftSubmitting] = usePublishDraft({ discussion, title, editor, validate });

  const cancelPath = mode === "edit" ? paths.discussionPath(discussion?.id!) : paths.spaceDiscussionsPath(space.id!);

  return {
    title,
    setTitle,
    editor,

    space,
    mode,
    subscriptionsState,

    postMessage,
    postAsDraft,
    saveChanges,
    publishDraft,

    postMessageSubmitting,
    postAsDraftSubmitting,
    saveChangesSubmitting,
    publishDraftSubmitting,

    cancelPath,
    errors,
  };
}

interface UsePostMessageOptions {
  space: Spaces.Space;
  title: string;
  editor: TipTapEditor.EditorState;
  subscriptionsState: SubscriptionsState;
  validate: () => boolean;
}

function usePostMessage({ space, title, editor, subscriptionsState, validate }: UsePostMessageOptions): [() => Promise<boolean>, boolean] {
  const paths = usePaths();
  const navigate = useNavigate();
  const [post] = Discussions.usePostDiscussion();

  const [submitting, setSubmitting] = React.useState(false);

  const postMessage = async (): Promise<boolean> => {
    if (!validate()) return false;

    setSubmitting(true);

    const res = await post({
      spaceId: space.id,
      title: title,
      postAsDraft: false,
      body: JSON.stringify(editor.editor.getJSON()),
      sendNotificationsToEveryone: subscriptionsState.notifyEveryone,
      subscriberIds: subscriptionsState.currentSubscribersList,
    });

    setSubmitting(false);

    navigate(paths.discussionPath(res.discussion.id));

    return true;
  };

  return [postMessage, submitting];
}

function usePostAsDraft({ space, title, editor, subscriptionsState, validate }: UsePostMessageOptions): [() => Promise<boolean>, boolean] {
  const paths = usePaths();
  const navigate = useNavigate();
  const [post] = Discussions.usePostDiscussion();

  const [submitting, setSubmitting] = React.useState(false);

  const postMessage = async (): Promise<boolean> => {
    if (!validate()) return false;

    setSubmitting(true);

    const res = await post({
      spaceId: space.id,
      title: title,
      postAsDraft: true,
      body: JSON.stringify(editor.editor.getJSON()),
      sendNotificationsToEveryone: subscriptionsState.notifyEveryone,
      subscriberIds: subscriptionsState.currentSubscribersList,
    });

    setSubmitting(false);

    navigate(paths.discussionPath(res.discussion.id));

    return true;
  };

  return [postMessage, submitting];
}

function useSaveChanges({ discussion, title, editor, validate }): [() => Promise<boolean>, boolean] {
  const paths = usePaths();
  const navigate = useNavigate();
  const [edit] = Discussions.useEditDiscussion();
  const [submitting, setSubmitting] = React.useState(false);

  const saveChanges = async () => {
    if (!validate()) return false;

    setSubmitting(true);

    const res = await edit({
      id: discussion!.id,
      title: title,
      body: JSON.stringify(editor.editor.getJSON()),
    });

    setSubmitting(false);

    navigate(paths.discussionPath(res.discussion.id));

    return true;
  };

  return [saveChanges, submitting];
}

function usePublishDraft({ discussion, title, editor, validate }): [() => Promise<boolean>, boolean] {
  const paths = usePaths();
  const navigate = useNavigate();
  const [edit] = Discussions.useEditDiscussion();
  const [submitting, setSubmitting] = React.useState(false);

  const saveChanges = async () => {
    if (!validate()) return false;

    setSubmitting(true);

    const res = await edit({
      id: discussion!.id,
      title: title,
      body: JSON.stringify(editor.editor.getJSON()),
      state: "published",
    });

    setSubmitting(false);

    navigate(paths.discussionPath(res.discussion.id));

    return true;
  };

  return [saveChanges, submitting];
}
