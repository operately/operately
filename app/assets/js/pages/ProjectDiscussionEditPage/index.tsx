import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Projects from "@/models/projects";
import * as React from "react";

import { PageModule } from "@/routes/types";
import { assertPresent } from "@/utils/assertions";

import Api from "@/api";
import { DimmedLink, PrimaryButton, Editor, useEditor, SubscribersSelector } from "turboui";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { FormTitleInput } from "../../components/FormTitleInput";
import { useSubscriptionsAdapter, SubscriptionsState } from "@/models/subscriptions";
import { usePaths } from "../../routes/paths";

import { useNavigate } from "react-router-dom";

import { formValidator, useFormState } from "@/components/Form/useFormState";
import { Validators } from "@/utils/validators";

export default { name: "ProjectDiscussionEditPage", loader, Page } as PageModule;

interface LoaderResult {
  discussion: Projects.Discussion;
}

async function loader({ params }): Promise<LoaderResult> {
  return {
    discussion: await Api.project_discussions
      .get({
        id: params.id,
        includeUnreadNotifications: true,
        includePermissions: true,
        includeSubscriptionsList: true,
        includePotentialSubscribers: true,
        includeProject: true,
        includeSpace: true,
      })
      .then((data) => data.discussion),
  };
}

function Page() {
  const { discussion } = Pages.useLoadedData<LoaderResult>();

  return (
    <Pages.Page title={["Edit", discussion.title!, discussion.project!.name!]}>
      <Paper.Root>
        <Nav />
        <Paper.Body>
          <Form />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Nav() {
  const paths = usePaths();
  const { discussion } = Pages.useLoadedData<LoaderResult>();

  return (
    <Paper.Navigation
      items={[
        { to: paths.spacePath(discussion.space!.id!), label: discussion.space!.name! },
        { to: paths.projectPath(discussion.project!.id!), label: discussion.project!.name! },
      ]}
    />
  );
}

function Form() {
  const { discussion } = Pages.useLoadedData<LoaderResult>();
  const paths = usePaths();

  assertPresent(discussion.potentialSubscribers, "potentialSubscribers must be present in discussion");
  assertPresent(discussion.project, "project must be present in discussion");

  const subscriptionsState = useSubscriptionsAdapter(discussion.potentialSubscribers, {
    ignoreMe: true,
    notifyPrioritySubscribers: true,
    spaceName: discussion.project.name,
  });

  const form = useForm({ discussion, subscriptionsState });

  return (
    <>
      <FormTitleInput
        value={form.fields.title}
        onChange={form.fields.setTitle}
        error={false}
        testId="discussion-title"
      />

      <div className="mt-2 border-y border-stroke-base text-content-base font-medium ">
        <Editor editor={form.fields.editor} hideBorder padding="p-0" />
      </div>

      <Subscribers discussion={discussion} subscriptionsState={subscriptionsState} />

      <div className="flex items-center gap-4 mt-4">
        <PrimaryButton testId="post-discussion" onClick={form.submit} loading={form.submitting}>
          Save
        </PrimaryButton>

        <DimmedLink to={paths.projectDiscussionPath(discussion.id!)}>Cancel</DimmedLink>
      </div>
    </>
  );
}

function Subscribers({
  discussion,
  subscriptionsState,
}: {
  discussion: Projects.Discussion;
  subscriptionsState: SubscriptionsState;
}) {
  assertPresent(discussion.space, "space must be present in project");

  return (
    <div className="my-10">
      <SubscribersSelector {...subscriptionsState} />
    </div>
  );
}

type FormFields = {
  title: string;
  setTitle: (title: string) => void;
  editor: any;
};

interface UseFormProps {
  discussion: Projects.Discussion;
  subscriptionsState: SubscriptionsState;
}

function useForm({ discussion, subscriptionsState }: UseFormProps) {
  assertPresent(discussion.project, "project must be present in discussion");

  const paths = usePaths();
  const navigate = useNavigate();

  const [title, setTitle] = React.useState(discussion.title || "");

  const handlers = useRichEditorHandlers({ scope: {type: "project", id: discussion.project.id}})
  const editor = useEditor({
    placeholder: "Write here...",
    className: "min-h-[350px] py-2 text-lg",
    content: discussion.message ? JSON.parse(discussion.message) : undefined,
    handlers,
  });

  const [submitting, setSubmitting] = React.useState(false);

  return useFormState<FormFields>({
    fields: {
      title: title,
      setTitle: setTitle,
      editor: editor,
    },
    validations: [
      formValidator("title", "Title is required", Validators.nonEmptyString),
      formValidator("editor", "Body is required", Validators.nonEmptyRichText),
    ],
    action: [
      async (fields: FormFields) => {
        setSubmitting(true);

        Api.project_discussions
          .edit({
            id: discussion.id!,
            title: fields.title,
            message: JSON.stringify(fields.editor.editor.getJSON()),
            subscriberIds: subscriptionsState.currentSubscribersList,
          })
          .then((data) => navigate(paths.projectDiscussionPath(data.discussion.id!)))
          .finally(() => setSubmitting(false));
      },
      submitting,
    ],
  });
}
