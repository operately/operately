import React from "react";

import { useNavigate } from "react-router-dom";
import { usePostProjectCheckIn } from "@/models/projectCheckIns";
import { Project } from "@/models/projects";
import { Person } from "@/models/people";

import Forms from "@/components/Forms";
import { Spacer } from "@/components/Spacer";
import { Options, SubscribersSelector, useSubscriptions } from "@/features/Subscriptions";
import { assertPresent } from "@/utils/assertions";
import { Paths } from "@/routes/paths";

export function Form({ project }: { project: Project }) {
  assertPresent(project.potentialSubscribers, "potentialSubscribers must be present in project");

  const [post] = usePostProjectCheckIn();
  const navigate = useNavigate();
  const subscriptionsState = useSubscriptions(project.potentialSubscribers, {
    ignoreMe: true,
    notifyPrioritySubscribers: true,
  });

  const form = Forms.useForm({
    fields: {
      status: "",
      description: null,
    },
    validate: (addError) => {
      if (!form.values.status) {
        addError("status", "Status is required");
      }
      if (!form.values.description) {
        addError("description", "Description is required");
      }
    },
    cancel: () => {
      navigate(Paths.projectCheckInsPath(project.id!));
    },
    submit: async () => {
      const res = await post({
        projectId: project.id,
        status: form.values.status,
        description: JSON.stringify(form.values.description),
        sendNotificationsToEveryone: subscriptionsState.subscriptionType == Options.ALL,
        subscriberIds: subscriptionsState.currentSubscribersList,
      });

      navigate(Paths.projectCheckInPath(res.checkIn.id));
    },
  });

  return (
    <Forms.Form form={form}>
      <Header />

      <Forms.FieldGroup>
        <StatusSection reviewer={project.reviewer || undefined} />
        <DescriptionSection project={project} />
      </Forms.FieldGroup>

      <Spacer size={4} />

      <SubscribersSelector state={subscriptionsState} projectName={project.name!} />

      <Forms.Submit saveText="Submit" buttonSize="base" />
    </Forms.Form>
  );
}

function Header() {
  return (
    <div>
      <div className="text-2xl font-bold mx-auto">Let's Check In</div>
    </div>
  );
}

function StatusSection({ reviewer }: { reviewer?: Person }) {
  return (
    <div className="mt-8 mb-4">
      <Forms.SelectStatus
        label="1. How's the project going?"
        field="status"
        reviewer={reviewer}
        options={["on_track", "caution", "issue"]}
      />
    </div>
  );
}

function DescriptionSection({ project }: { project: Project }) {
  const mentionSearchScope = { type: "project", id: project.id! } as const;

  return (
    <Forms.RichTextArea
      label="2. What's new since the last check-in?"
      field="description"
      mentionSearchScope={mentionSearchScope}
      placeholder="Write your check-in here..."
    />
  );
}
