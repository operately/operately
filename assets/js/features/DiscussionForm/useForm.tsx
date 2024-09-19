import * as React from "react";
import * as TipTapEditor from "@/components/Editor";
import * as Discussions from "@/models/discussions";
import * as Spaces from "@/models/spaces";

import { useNavigate } from "react-router-dom";
import { Paths } from "@/routes/paths";
import { NotifiablePerson, Options, SubscriptionsState, useSubscriptions } from "@/features/Subscriptions";

interface UseFormOptions {
  mode: "create" | "edit";
  space: Spaces.Space;
  discussion?: Discussions.Discussion;
  notifiablePeople?: NotifiablePerson[];
}

export interface FormState {
  title: string;
  setTitle: (title: string) => void;
  editor: TipTapEditor.EditorState;

  mode: "create" | "edit";
  space: Spaces.Space;

  submit: () => void;
  submitting: boolean;
  submitDisabled?: boolean;
  submitButtonLabel?: string;
  errors: Error[];

  cancelPath: string;
  subscriptionsState: SubscriptionsState;
}

interface Error {
  field: string;
  message: string;
}

export function useForm(options: UseFormOptions): FormState {
  const navigate = useNavigate();
  const subscriptionsState = useSubscriptions(options.notifiablePeople || []);

  const discussion = options.discussion;
  const space = options.space;

  const [errors, setErrors] = React.useState<Error[]>([]);
  const [title, setTitle] = React.useState(() => discussion?.title || "");

  const { editor, uploading, empty } = TipTapEditor.useEditor({
    placeholder: "Write here...",
    className: "min-h-[350px] py-2 px-1",
    content: discussion?.body && JSON.parse(discussion.body),
  });

  const [post, { loading: submittingPost }] = Discussions.usePostDiscussion();
  const [edit, { loading: submittingEdit }] = Discussions.useEditDiscussion();

  const submit = async (): Promise<boolean> => {
    if (!editor) return false;
    if (uploading) return false;

    const foundErrors: Error[] = [];
    if (!title.trim()) foundErrors.push({ field: "title", message: "Title is required" });
    if (empty) foundErrors.push({ field: "body", message: "Body is required" });

    if (foundErrors.length) {
      setErrors(foundErrors);
      return false;
    }

    if (options.mode === "edit") {
      const res = await edit({
        discussionId: discussion!.id,
        title: title,
        body: JSON.stringify(editor.getJSON()),
      });

      navigate(Paths.discussionPath(res.discussion.id));

      return true;
    } else {
      const res = await post({
        spaceId: space.id,
        title: title,
        body: JSON.stringify(editor.getJSON()),
        sendNotificationsToEveryone: subscriptionsState.subscriptionType == Options.ALL,
        subscriberIds: subscriptionsState.currentSubscribersList,
      });

      navigate(Paths.discussionPath(res.discussion.id));

      return true;
    }
  };

  const submitting = submittingPost || submittingEdit;
  const cancelPath =
    options.mode === "edit" ? Paths.discussionPath(discussion?.id!) : Paths.spaceDiscussionsPath(space.id!);

  const submitButtonLabel = options.mode === "edit" ? "Save Changes" : "Post Discussion";

  return {
    title,
    setTitle,
    editor,

    space,
    mode: options.mode,
    subscriptionsState,

    // empty,
    submit,
    submitting,
    cancelPath,
    submitButtonLabel,
    errors,
  };
}
