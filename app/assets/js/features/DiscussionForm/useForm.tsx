import * as TipTapEditor from "@/components/Editor";
import * as Discussions from "@/models/discussions";
import * as Spaces from "@/models/spaces";
import * as React from "react";

import { Options, SubscriptionsState, useSubscriptions } from "@/features/Subscriptions";
import { Subscriber } from "@/models/notifications";
import { usePaths } from "@/routes/paths";
import { useNavigate } from "react-router-dom";

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
  const subscriptionsState = useSubscriptions(potentialSubscribers, { ignoreMe: true });

  const [errors, setErrors] = React.useState<Error[]>([]);
  const [title, setTitle] = React.useState(() => discussion?.title || "");

  // Generate localStorage key based on mode and context
  const localStorageKey = React.useMemo(() => {
    if (mode === "edit" && discussion?.id) {
      return `discussion-edit-${discussion.id}`;
    }
    return `discussion-new-${space?.id || 'unknown'}`;
  }, [mode, discussion?.id, space?.id]);

  const { editor, uploading, clearSavedContent } = TipTapEditor.useEditor({
    placeholder: "Write here...",
    className: "min-h-[350px] py-2 px-1",
    content: discussion?.body && JSON.parse(discussion.body),
    mentionSearchScope: { type: "space", id: space ? space.id! : discussion!.space!.id! },
    localStorageKey,
  });

  const validate = () => {
    if (!editor) return false;
    if (uploading) return false;

    const foundErrors: Error[] = [];
    if (title.trim() === "") foundErrors.push({ field: "title", message: "Title is required" });

    if (foundErrors.length) {
      setErrors(foundErrors);
      return false;
    }

    return true;
  };

  const [postMessage, postMessageSubmitting] = usePostMessage({ space, title, editor, subscriptionsState, validate, clearSavedContent });
  const [postAsDraft, postAsDraftSubmitting] = usePostAsDraft({ space, title, editor, subscriptionsState, validate, clearSavedContent });
  const [saveChanges, saveChangesSubmitting] = useSaveChanges({ discussion, title, editor, validate, clearSavedContent });
  const [publishDraft, publishDraftSubmitting] = usePublishDraft({ discussion, title, editor, validate, clearSavedContent });

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

function usePostMessage({ space, title, editor, subscriptionsState, validate, clearSavedContent }): [() => Promise<boolean>, boolean] {
  const paths = usePaths();
  const navigate = useNavigate();
  const [post] = Discussions.usePostDiscussion();

  const [submitting, setSubmitting] = React.useState(false);

  const postMessage = async (): Promise<boolean> => {
    if (!validate()) return false;

    setSubmitting(true);

    try {
      const res = await post({
        spaceId: space.id,
        title: title,
        postAsDraft: false,
        body: JSON.stringify(editor.getJSON()),
        sendNotificationsToEveryone: subscriptionsState.subscriptionType == Options.ALL,
        subscriberIds: subscriptionsState.currentSubscribersList,
      });

      clearSavedContent(); // Clear localStorage on successful submit
      setSubmitting(false);
      navigate(paths.discussionPath(res.discussion.id));

      return true;
    } catch (error) {
      setSubmitting(false);
      throw error;
    }
  };

  return [postMessage, submitting];
}

function usePostAsDraft({ space, title, editor, subscriptionsState, validate, clearSavedContent }): [() => Promise<boolean>, boolean] {
  const paths = usePaths();
  const navigate = useNavigate();
  const [post] = Discussions.usePostDiscussion();

  const [submitting, setSubmitting] = React.useState(false);

  const postMessage = async (): Promise<boolean> => {
    if (!validate()) return false;

    setSubmitting(true);

    try {
      const res = await post({
        spaceId: space.id,
        title: title,
        postAsDraft: true,
        body: JSON.stringify(editor.getJSON()),
        sendNotificationsToEveryone: subscriptionsState.subscriptionType == Options.ALL,
        subscriberIds: subscriptionsState.currentSubscribersList,
      });

      clearSavedContent(); // Clear localStorage on successful submit
      setSubmitting(false);
      navigate(paths.discussionPath(res.discussion.id));

      return true;
    } catch (error) {
      setSubmitting(false);
      throw error;
    }
  };

  return [postMessage, submitting];
}

function useSaveChanges({ discussion, title, editor, validate, clearSavedContent }): [() => Promise<boolean>, boolean] {
  const paths = usePaths();
  const navigate = useNavigate();
  const [edit] = Discussions.useEditDiscussion();
  const [submitting, setSubmitting] = React.useState(false);

  const saveChanges = async () => {
    if (!validate()) return false;

    setSubmitting(true);

    try {
      const res = await edit({
        id: discussion!.id,
        title: title,
        body: JSON.stringify(editor.getJSON()),
      });

      clearSavedContent(); // Clear localStorage on successful submit
      setSubmitting(false);
      navigate(paths.discussionPath(res.discussion.id));

      return true;
    } catch (error) {
      setSubmitting(false);
      throw error;
    }
  };

  return [saveChanges, submitting];
}

function usePublishDraft({ discussion, title, editor, validate, clearSavedContent }): [() => Promise<boolean>, boolean] {
  const paths = usePaths();
  const navigate = useNavigate();
  const [edit] = Discussions.useEditDiscussion();
  const [submitting, setSubmitting] = React.useState(false);

  const saveChanges = async () => {
    if (!validate()) return false;

    setSubmitting(true);

    try {
      const res = await edit({
        id: discussion!.id,
        title: title,
        body: JSON.stringify(editor.getJSON()),
        state: "published",
      });

      clearSavedContent(); // Clear localStorage on successful submit
      setSubmitting(false);
      navigate(paths.discussionPath(res.discussion.id));

      return true;
    } catch (error) {
      setSubmitting(false);
      throw error;
    }
  };

  return [saveChanges, submitting];
}
