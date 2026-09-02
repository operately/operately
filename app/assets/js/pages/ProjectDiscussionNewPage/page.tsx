import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as React from "react";

import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { DimmedLink, Forms, SubscribersSelector } from "turboui";
import { useSubscriptionsAdapter } from "@/models/subscriptions";
import { usePaths } from "../../routes/paths";
import { useForm } from "./useForm";
import { useLoadedData } from "./loader";

export function Page() {
  const { project } = useLoadedData();

  return (
    <Pages.Page title={["New Discussion", project.name]}>
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
  const { project } = useLoadedData();
  const items: Paper.NavigationItem[] = [];

  if (project.space) {
    items.push({ to: paths.spacePath(project.space.id), label: project.space.name });
    items.push({ to: paths.spaceWorkMapPath(project.space.id, "projects"), label: "Work Map" });
  } else {
    items.push({ to: paths.workMapPath("projects"), label: "Work Map" });
  }

  items.push({ to: paths.projectPath(project.id, { tab: "overview" }), label: project.name });
  items.push({ to: paths.projectPath(project.id, { tab: "discussions" }), label: "Discussions" });

  return <Paper.Navigation items={items} />;
}

function Form() {
  const { project } = useLoadedData();
  const paths = usePaths();

  const subscriptionsState = useSubscriptionsAdapter(project.potentialSubscribers || [], {
    ignoreMe: true,
    projectName: project.name,
  });

  const form = useForm({ project, subscriptionsState });
  const richTextHandlers = useRichEditorHandlers({ scope: { type: "project", id: project.id } });

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
              richTextHandlers={richTextHandlers}
              placeholder="Start a new discussion..."
              hideBorder
              height="min-h-[350px]"
              fontSize="text-lg"
              horizontalPadding="px-0"
              verticalPadding="py-2"
            />
          </div>
        </div>
      </Forms.FieldGroup>

      <div className="my-10">
        <SubscribersSelector {...subscriptionsState} />
      </div>

      <Forms.FormError message="Fill out all the required fields" className="mt-4" />

      <div className="flex items-center gap-4 mt-4">
        <Forms.Submit saveText="Post Discussion" buttonSize="base" testId="post-discussion" containerClassName="mt-0" />
        <DimmedLink to={paths.projectPath(project.id)}>Cancel</DimmedLink>
      </div>
    </Forms.Form>
  );
}
