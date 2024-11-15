import * as React from "react";
import * as TipTapEditor from "@/components/Editor";
import * as Discussions from "@/models/discussions";
import * as Spaces from "@/models/spaces";

import { useNavigate } from "react-router-dom";
import { Paths } from "@/routes/paths";
import { Subscriber } from "@/models/notifications";
import { Options, SubscriptionsState, useSubscriptions } from "@/features/Subscriptions";

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
  const subscriptionsState = useSubscriptions(potentialSubscribers, { ignoreMe: true });

  const [errors, setErrors] = React.useState<Error[]>([]);
  const [title, setTitle] = React.useState(() => discussion?.title || "");

  const { editor, uploading, empty } = TipTapEditor.useEditor({
    placeholder: "Write here...",
    className: "min-h-[350px] py-2 px-1",
    content: discussion?.body && JSON.parse(discussion.body),
    mentionSearchScope: { type: "space", id: space ? space.id! : discussion!.space!.id! },
  });

  const validate = () => {
    if (!editor) return false;
    if (uploading) return false;

    const foundErrors: Error[] = [];
    if (!title.trim()) foundErrors.push({ field: "title", message: "Title is required" });
    if (empty) foundErrors.push({ field: "body", message: "Body is required" });

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

  const cancelPath = mode === "edit" ? Paths.discussionPath(discussion?.id!) : Paths.spaceDiscussionsPath(space.id!);

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

function usePostMessage({ space, title, editor, subscriptionsState, validate }): [() => Promise<boolean>, boolean] {
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
      body: JSON.stringify(editor.getJSON()),
      sendNotificationsToEveryone: subscriptionsState.subscriptionType == Options.ALL,
      subscriberIds: subscriptionsState.currentSubscribersList,
    });

    setSubmitting(false);

    navigate(Paths.discussionPath(res.discussion.id));

    return true;
  };

  return [postMessage, submitting];
}

function usePostAsDraft({ space, title, editor, subscriptionsState, validate }): [() => Promise<boolean>, boolean] {
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
      body: JSON.stringify(editor.getJSON()),
      sendNotificationsToEveryone: subscriptionsState.subscriptionType == Options.ALL,
      subscriberIds: subscriptionsState.currentSubscribersList,
    });

    setSubmitting(false);

    navigate(Paths.discussionPath(res.discussion.id));

    return true;
  };

  return [postMessage, submitting];
}

function useSaveChanges({ discussion, title, editor, validate }): [() => Promise<boolean>, boolean] {
  const navigate = useNavigate();
  const [edit] = Discussions.useEditDiscussion();
  const [submitting, setSubmitting] = React.useState(false);

  const saveChanges = async () => {
    if (!validate()) return false;

    setSubmitting(true);

    const res = await edit({
      id: discussion!.id,
      title: title,
      body: JSON.stringify(editor.getJSON()),
    });

    setSubmitting(false);

    navigate(Paths.discussionPath(res.discussion.id));

    return true;
  };

  return [saveChanges, submitting];
}

function usePublishDraft({ discussion, title, editor, validate }): [() => Promise<boolean>, boolean] {
  const navigate = useNavigate();
  const [edit] = Discussions.useEditDiscussion();
  const [submitting, setSubmitting] = React.useState(false);

  const saveChanges = async () => {
    if (!validate()) return false;

    setSubmitting(true);

    const res = await edit({
      id: discussion!.id,
      title: title,
      body: JSON.stringify(editor.getJSON()),
      state: "published",
    });

    setSubmitting(false);

    navigate(Paths.discussionPath(res.discussion.id));

    return true;
  };

  return [saveChanges, submitting];
}
