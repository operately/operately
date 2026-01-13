import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Projects from "@/models/projects";
import * as React from "react";

import { PageModule } from "@/routes/types";
import { assertPresent } from "@/utils/assertions";

import Api from "@/api";
import Forms from "@/components/Forms";
import { DimmedLink, SubscribersSelector, emptyContent, isContentEmpty } from "turboui";
import { useSubscriptionsAdapter, SubscriptionsState } from "@/models/subscriptions";
import { usePaths } from "../../routes/paths";

import { useNavigate } from "react-router-dom";


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
  assertPresent(discussion.project.id, "project id must be present in discussion");
  assertPresent(discussion.id, "discussion id must be present in discussion");

  const subscriptionsState = useSubscriptionsAdapter(discussion.potentialSubscribers, {
    ignoreMe: true,
    notifyPrioritySubscribers: true,
    spaceName: discussion.project.name,
  });

  const form = useForm({ discussion, subscriptionsState });
  const mentionSearchScope = { type: "project", id: discussion.project.id } as const;

  return (
    <Forms.Form form={form}>
      <Forms.FieldGroup>
        <div>
          <Forms.TitleInput
            field="title"
            placeholder="Title..."
            autoFocus
            testId="discussion-title"
            errorMessage="Please add a title"
          />
          <div className="mt-2 border-y border-stroke-base text-content-base font-medium">
            <Forms.RichTextArea
              field="message"
              mentionSearchScope={mentionSearchScope}
              placeholder="Write here..."
              hideBorder
              height="min-h-[350px]"
              fontSize="text-lg"
              horizontalPadding="px-0"
              verticalPadding="py-2"
            />
          </div>
        </div>
      </Forms.FieldGroup>

      <Subscribers discussion={discussion} subscriptionsState={subscriptionsState} />

      <Forms.FormError message="Fill out all the required fields" className="mt-4" />

      <div className="flex items-center gap-4 mt-4">
        <Forms.Submit saveText="Save" buttonSize="base" testId="post-discussion" containerClassName="mt-0" />
        <DimmedLink to={paths.projectDiscussionPath(discussion.id)}>Cancel</DimmedLink>
      </div>
    </Forms.Form>
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

type FormValues = {
  title: string;
  message: any;
};

interface UseFormProps {
  discussion: Projects.Discussion;
  subscriptionsState: SubscriptionsState;
}

function useForm({ discussion, subscriptionsState }: UseFormProps) {
  assertPresent(discussion.project, "project must be present in discussion");

  const paths = usePaths();
  const navigate = useNavigate();

  const form = Forms.useForm<FormValues>({
    fields: {
      title: discussion.title || "",
      message: discussion.message ? JSON.parse(discussion.message) : emptyContent(),
    },
    validate: (addError) => {
      if (isContentEmpty(form.values.message)) {
        addError("message", "Body is required");
      }
    },
    submit: async () => {
      const res = await Api.project_discussions.edit({
        id: discussion.id,
        title: form.values.title,
        message: JSON.stringify(form.values.message),
        subscriberIds: subscriptionsState.currentSubscribersList,
      });

      navigate(paths.projectDiscussionPath(res.discussion.id!));
    },
  });

  return form;
}
