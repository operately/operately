import * as TipTapEditor from "@/components/Editor";
import * as Projects from "@/models/projects";
import * as React from "react";

import { isContentEmpty } from "@/components/RichContent/isContentEmpty";
import { Options, SubscriptionsState, useSubscriptions } from "@/features/Subscriptions";
import { Subscriber } from "@/models/notifications";
import { useNavigateTo } from "@/routes/useNavigateTo";

import { usePaths } from "@/routes/paths";
import { emptyContent } from "turboui/RichContent";
interface Error {
  field: string;
  message: string;
}

interface FormOptions {
  project: Projects.Project;
  retrospective?: Projects.ProjectRetrospective;
  mode: "create" | "edit";
  potentialSubscribers?: Subscriber[];
}
export interface FormState {
  project?: Projects.Project;
  mode: "create" | "edit";

  errors: Error[];

  retrospectiveNotes: TipTapEditor.EditorState;

  submit: () => void;
  submittable: boolean;
  subscriptionsState: SubscriptionsState;
}

export function useForm(options: FormOptions): FormState {
  const paths = usePaths();
  const subscriptionsState = useSubscriptions(options.potentialSubscribers || [], {
    ignoreMe: true,
    notifyPrioritySubscribers: true,
  });
  const [errors, setErrors] = React.useState<Error[]>([]);

  const retrospectiveNotes = TipTapEditor.useEditor({
    placeholder: "What went well? What didn't? What did you learn?",
    className: "min-h-[250px] py-2 font-medium",
    content: findExistingContent(options),
    mentionSearchScope: { type: "project", id: options.project.id! },
  })

  const redirect = useNavigateTo(
    options.mode === "create"
      ? paths.projectPath(options.project.id!)
      : paths.projectRetrospectivePath(options.project.id!),
  );

  const [post, { loading: posting }] = Projects.useCloseProject();
  const [edit, { loading: editing }] = Projects.useEditProjectRetrospective();
  const loading = posting || editing;

  const submit = async () => {
    if (!submittable) return false;

    const errors = validate(retrospectiveNotes);

    if (errors.length > 0) {
      setErrors(errors);
      return false;
    }

    if (options.mode == "create") {
      await post({
        projectId: options.project.id,
        retrospective: JSON.stringify(retrospectiveNotes.editor.getJSON()),
        sendNotificationsToEveryone: subscriptionsState.subscriptionType == Options.ALL,
        subscriberIds: subscriptionsState.currentSubscribersList,
      });
    } else {
      await edit({
        id: options.retrospective!.id,
        content: JSON.stringify(retrospectiveNotes.editor.getJSON()),
      });
    }

    redirect();

    return true;
  };

  const submittable =
    !loading && retrospectiveNotes.submittable;

  return {
    project: options.project,
    mode: options.mode,
    errors,

    retrospectiveNotes,

    submit,
    submittable,
    subscriptionsState,
  };
}

function validate(richText: TipTapEditor.EditorState): Error[] {
  let errors: Error[] = [];

  if (isContentEmpty(richText.editor.getJSON())) {
    errors.push({ field: "retrospectiveNotes", message: "is required" });
  }

  return errors;
}

function findExistingContent(options: FormOptions) {
  if (options.mode === "edit" && options.retrospective?.content) {
    return JSON.parse(options.retrospective.content);
  }
  return emptyContent();
}
