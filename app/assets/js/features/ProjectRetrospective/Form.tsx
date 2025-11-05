import React from "react";

import Forms from "@/components/Forms";
import * as Projects from "@/models/projects";

import { SubscriptionsState, useSubscriptionsAdapter } from "@/models/subscriptions";
import { useNavigate } from "react-router-dom";
import { emptyContent, SubscribersSelector } from "turboui";
import { usePaths } from "@/routes/paths";

type Mode = "create" | "edit";

interface Props {
  mode: Mode;
  project: Projects.Project;
  retrospective?: Projects.ProjectRetrospective;
}

export function Form({ mode, project, retrospective }: Props) {
  const paths = usePaths();
  const navigate = useNavigate();
  const [post] = Projects.useCloseProject();
  const [edit] = Projects.useEditProjectRetrospective();

  const subscriptionsState = useSubscriptionsAdapter(project.potentialSubscribers || [], {
    ignoreMe: true,
    notifyPrioritySubscribers: true,
    resourceHubName: project.name,
  });

  const form = Forms.useForm({
    fields: {
      success: project.successStatus === "missed" ? "no" : "yes",
      retrospective: retrospective ? JSON.parse(retrospective.content!) : emptyContent(),
    },
    cancel: () => navigate(paths.projectPath(project.id)),
    submit: async () => {
      if (mode == "create") {
        await post({
          projectId: project.id,
          retrospective: JSON.stringify(form.values.retrospective),
          sendNotificationsToEveryone: subscriptionsState.notifyEveryone,
          subscriberIds: subscriptionsState.currentSubscribersList,
          successStatus: form.values.success === "yes" ? "achieved" : "missed",
        });
        navigate(paths.projectPath(project.id));
      } else {
        await edit({
          id: retrospective!.id,
          content: JSON.stringify(form.values.retrospective),
          successStatus: form.values.success === "yes" ? "achieved" : "missed",
        });
        navigate(paths.projectRetrospectivePath(project.id));
      }
    },
  });

  return (
    <Forms.Form form={form}>
      <Forms.FieldGroup>
        <AccomplishedOrDropped />
        <RetrospectiveNotes project={project} />
      </Forms.FieldGroup>

      <Subscribers mode={mode} subscriptionsState={subscriptionsState} />

      <Forms.Submit saveText={mode === "create" ? "Close Project" : "Save"} />
    </Forms.Form>
  );
}

function AccomplishedOrDropped() {
  return (
    <Forms.RadioButtons
      field="success"
      label="Did this project achieve its intended outcomes?"
      options={[
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
      ]}
    />
  );
}

function RetrospectiveNotes({ project }: { project: Projects.Project }) {
  return (
    <div data-test-id="retrospective-notes">
      <Forms.RichTextArea
        field="retrospective"
        label="Retrospective notes"
        mentionSearchScope={{ type: "project", id: project.id }}
        placeholder="What went well? What didn't? What did you learn?"
        required
      />
    </div>
  );
}

interface SubscribersProps {
  subscriptionsState: SubscriptionsState;
  mode: Mode;
}

function Subscribers({ mode, subscriptionsState }: SubscribersProps) {
  if (mode !== "create") return null;

  return (
    <div className="my-10">
      <SubscribersSelector {...subscriptionsState} />
    </div>
  );
}
