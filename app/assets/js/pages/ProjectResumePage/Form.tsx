import * as React from "react";

import Forms from "@/components/Forms";
import * as Projects from "@/models/projects";

import { useSubscriptionsAdapter } from "@/models/subscriptions";
import { useNavigateTo } from "@/routes/useNavigateTo";
import { usePaths } from "@/routes/paths";
import { DimmedLink, emptyContent, PrimaryButton, SubscribersSelector } from "turboui";

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

  const [resume] = Projects.useResumeProject();
  const onSuccess = useNavigateTo(paths.projectPath(projectId));

  const form = Forms.useForm({
    fields: {
      message: emptyContent(),
    },
    submit: async () => {
      const message = form.values.message || emptyContent();

      await resume({
        projectId: projectId,
        message: JSON.stringify(message),
        sendNotificationsToEveryone: subscriptionsState.notifyEveryone,
        subscriberIds: subscriptionsState.currentSubscribersList,
      });
      onSuccess();
    },
  });

  const isSubmitting = form.state === "submitting" || form.state === "uploading";

  return (
    <Forms.Form form={form}>
      <Forms.FieldGroup>
        <Forms.RichTextArea
          field="message"
          label="Why are you resuming this project?"
          mentionSearchScope={{ type: "project", id: projectId }}
          placeholder="Write here..."
        />
      </Forms.FieldGroup>

      <div className="my-10">
        <SubscribersSelector {...subscriptionsState} />
      </div>

      <div className="flex items-center gap-6 mt-8">
        <PrimaryButton onClick={form.actions.submit} testId="resume-project-button" loading={isSubmitting}>
          Resume project
        </PrimaryButton>
        <DimmedLink to={paths.projectPath(projectId)}>Keep it paused</DimmedLink>
      </div>
    </Forms.Form>
  );
}
