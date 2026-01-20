import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Projects from "@/models/projects";
import * as React from "react";

import { PageModule } from "@/routes/types";
import Forms from "@/components/Forms";
import { DimmedLink, SubscribersSelector } from "turboui";
import { useSubscriptionsAdapter } from "@/models/subscriptions";
import { usePaths } from "../../routes/paths";
import { useForm } from "./useForm";

export default { name: "ProjectDiscussionNewPage", loader, Page } as PageModule;

interface LoaderResult {
  project: Projects.Project;
}

async function loader({ params }): Promise<LoaderResult> {
  return {
    project: await Projects.getProject({
      id: params.projectID,
      includeChampion: true,
      includeReviewer: true,
      includeSpace: true,
      includePotentialSubscribers: true,
    }).then((data) => data.project),
  };
}

function Page() {
  const { project } = Pages.useLoadedData<LoaderResult>();

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
  const { project } = Pages.useLoadedData<LoaderResult>();
  const items: Paper.NavigationItem[] = [];

  if (project.space) {
    items.push({ to: paths.spacePath(project.space.id), label: project.space.name });
    items.push({ to: paths.spaceWorkMapPath(project.space.id, "projects"), label: "Projects" });
  } else {
    items.push({ to: paths.workMapPath("projects"), label: "Projects" });
  }

  items.push({ to: paths.projectPath(project.id, { tab: "overview" }), label: project.name });
  items.push({ to: paths.projectPath(project.id, { tab: "discussions" }), label: "Discussions" });

  return <Paper.Navigation items={items} />;
}

function Form() {
  const { project } = Pages.useLoadedData<LoaderResult>();
  const paths = usePaths();

  const subscriptionsState = useSubscriptionsAdapter(project.potentialSubscribers || [], {
    ignoreMe: true,
    projectName: project.name,
  });

  const form = useForm({ project, subscriptionsState });
  const mentionSearchScope = { type: "project", id: project.id } as const;

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
