import React from "react";

import { Forms, emptyContent, SubscribersSelector } from "turboui";
import * as Projects from "@/models/projects";

import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { SubscriptionsState, useSubscriptionsAdapter } from "@/models/subscriptions";
import { useNavigate } from "react-router";
import { usePaths } from "@/routes/paths";

type Mode = "create" | "edit";

interface BaseProps {
  project: Projects.Project;
}

interface CreateProps extends BaseProps {
  mode: "create";
  retrospective?: never;
}

interface EditProps extends BaseProps {
  mode: "edit";
  retrospective: Projects.ProjectRetrospective;
}

type Props = CreateProps | EditProps;

export function Form(props: Props) {
  const { project } = props;
  const retrospective = props.mode === "edit" ? props.retrospective : undefined;

  const paths = usePaths();
  const navigate = useNavigate();
  const closeProject = Projects.useCloseProject();
  const editProjectRetrospective = Projects.useEditProjectRetrospective();

  const subscriptionsState = useSubscriptionsAdapter(project.potentialSubscribers || [], {
    ignoreMe: true,
    notifyPrioritySubscribers: true,
    resourceHubName: project.name,
  });

  const form = Forms.useForm({
    fields: {
      success: project.successStatus === "missed" ? "no" : "yes",
      retrospective: retrospective?.content ? JSON.parse(retrospective.content) : emptyContent(),
    },
    cancel: () => navigate(paths.projectPath(project.id)),
    submit: async () => {
      if (props.mode === "create") {
        await closeProject.mutateAsync({
          projectId: project.id,
          retrospective: JSON.stringify(form.values.retrospective),
          sendNotificationsToEveryone: subscriptionsState.notifyEveryone,
          subscriberIds: subscriptionsState.currentSubscribersList,
          successStatus: form.values.success === "yes" ? "achieved" : "missed",
        });
        navigate(paths.projectPath(project.id));
      } else {
        await editProjectRetrospective.mutateAsync({
          retrospectiveId: props.retrospective.id,
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

      <Subscribers mode={props.mode} subscriptionsState={subscriptionsState} />

      <Forms.Submit saveText={props.mode === "create" ? "Close Project" : "Save"} />
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
  const richTextHandlers = useRichEditorHandlers({ scope: { type: "project", id: project.id } });

  return (
    <div data-test-id="retrospective-notes">
      <Forms.RichTextArea
        field="retrospective"
        label="Retrospective notes"
        richTextHandlers={richTextHandlers}
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
