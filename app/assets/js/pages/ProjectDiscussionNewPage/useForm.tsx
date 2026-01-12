import * as Projects from "@/models/projects";

import Api from "@/api";
import { useNavigate } from "react-router-dom";

import Forms from "@/components/Forms";
import { SubscriptionsState } from "@/models/subscriptions";
import { emptyContent, isContentEmpty } from "turboui";

import { usePaths } from "@/routes/paths";

interface UseFormProps {
  project: Projects.Project;
  subscriptionsState: SubscriptionsState;
}

export function useForm({ project, subscriptionsState }: UseFormProps) {
  const paths = usePaths();
  const navigate = useNavigate();

  const form = Forms.useForm({
    fields: {
      title: "",
      message: emptyContent(),
    },
    validate: (addError) => {
      if (isContentEmpty(form.values.message)) {
        addError("message", "Body is required");
      }
    },
    submit: async () => {
      const res = await Api.project_discussions.create({
        projectId: project.id,
        title: form.values.title,
        message: JSON.stringify(form.values.message),
        sendNotificationsToEveryone: subscriptionsState.notifyEveryone,
        subscriberIds: subscriptionsState.currentSubscribersList,
      });

      navigate(paths.projectDiscussionPath(res.discussion.id!));
    },
  });

  return form;
}
