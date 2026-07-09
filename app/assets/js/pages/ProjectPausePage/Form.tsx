import * as React from "react";

import { Forms, DimmedLink, emptyContent, PrimaryButton, SubscribersSelector } from "turboui";
import * as Projects from "@/models/projects";

import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { useSubscriptionsAdapter } from "@/models/subscriptions";
import { useNavigateTo } from "@/routes/useNavigateTo";
import { usePaths } from "@/routes/paths";
import { PageCache } from "@/routes/PageCache";
import { projectPageCacheKey } from "../ProjectPage";

export function Form({ project }: { project: Projects.Project }) {
  const paths = usePaths();
  const projectId = project.id;
  const potentialSubscribers = project.potentialSubscribers;

  if (!projectId || !potentialSubscribers) {
    return null;
  }

  const projectName = project.name || "this project";
  const subscriptionsState = useSubscriptionsAdapter(potentialSubscribers, {
    ignoreMe: true,
    notifyPrioritySubscribers: true,
    projectName: projectName,
  });

  const richTextHandlers = useRichEditorHandlers({ scope: { type: "project", id: projectId } });

  const [pause] = Projects.usePauseProject();
  const onSuccess = useNavigateTo(paths.projectPath(projectId));

  const form = Forms.useForm({
    fields: {
      message: emptyContent(),
    },
    submit: async () => {
      const message = form.values.message || emptyContent();

      await pause({
        projectId: projectId,
        message: JSON.stringify(message),
        sendNotificationsToEveryone: subscriptionsState.notifyEveryone,
        subscriberIds: subscriptionsState.currentSubscribersList,
      });
      PageCache.invalidate(projectPageCacheKey(projectId));
      onSuccess();
    },
  });

  const isSubmitting = form.state === "submitting" || form.state === "uploading";

  return (
    <Forms.Form form={form}>
      <Forms.FieldGroup>
        <Forms.RichTextArea
          field="message"
          label="Why are you pausing this project?"
          richTextHandlers={richTextHandlers}
          placeholder="Write here..."
        />
      </Forms.FieldGroup>

      <div className="my-10">
        <SubscribersSelector {...subscriptionsState} />
      </div>

      <div className="flex items-center gap-6 mt-8">
        <PrimaryButton onClick={form.actions.submit} testId="pause-project-button" loading={isSubmitting}>
          Pause project
        </PrimaryButton>
        <DimmedLink to={paths.projectPath(projectId)}>Keep it active</DimmedLink>
      </div>
    </Forms.Form>
  );
}
