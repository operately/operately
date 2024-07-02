import * as React from "react";
import * as TipTapEditor from "@/components/Editor";
import * as Discussions from "@/models/discussions";
import * as Spaces from "@/models/spaces";

import { useNavigate } from "react-router-dom";
import { Paths } from "@/routes/paths";

interface UseFormOptions {
  mode: "create" | "edit";
  space: Spaces.Space;
  discussion?: Discussions.Discussion;
}

export interface FormState {
  title: string;
  setTitle: (title: string) => void;
  editor: TipTapEditor.EditorState;

  submit: () => void;
  submitting: boolean;
  submitDisabled?: boolean;
  submitButtonLabel?: string;
  errors: Error[];

  cancelPath: string;
}

interface Error {
  field: string;
  message: string;
}

export function useForm(options: UseFormOptions): FormState {
  const navigate = useNavigate();
  const discussion = options.discussion;
  const space = options.space;

  const [errors, setErrors] = React.useState<Error[]>([]);
  const [title, setTitle] = React.useState(() => discussion?.title || "");

  const { editor, uploading, empty } = TipTapEditor.useEditor({
    placeholder: "Write here...",
    className: "min-h-[350px] py-2 px-1",
    content: discussion?.body && JSON.parse(discussion.body),
  });

  const [post, { loading: submittingPost }] = Discussions.usePost({
    onCompleted: (data: any) => navigate(Paths.discussionPath(space.id!, data.postDiscussion.id)),
  });

  const [edit, { loading: submittingEdit }] = Discussions.useEdit({
    onCompleted: (data: any) => navigate(Paths.discussionPath(space.id!, data.editDiscussion.id)),
  });

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
      await edit({
        variables: {
          input: {
            discussionId: discussion!.id,
            title: title,
            body: JSON.stringify(editor.getJSON()),
          },
        },
      });

      return true;
    } else {
      await post({
        variables: {
          input: {
            spaceId: space.id,
            title: title,
            body: JSON.stringify(editor.getJSON()),
          },
        },
      });

      return true;
    }
  };

  const submitting = submittingPost || submittingEdit;

  const discussionListPath = Paths.spaceDiscussionsPath(space.id!);
  const discussionPath = Paths.discussionPath(space.id!, discussion?.id!);
  const cancelPath = options.mode === "edit" ? discussionPath : discussionListPath;

  const submitButtonLabel = options.mode === "edit" ? "Save Changes" : "Post Discussion";

  return {
    title,
    setTitle,
    editor,

    // empty,
    submit,
    submitting,
    cancelPath,
    submitButtonLabel,
    errors,
  };
}
