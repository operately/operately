import * as TipTapEditor from "@/components/Editor";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Projects from "@/models/projects";
import * as React from "react";

import { PageModule } from "@/routes/types";
import { DimmedLink, PrimaryButton } from "turboui";
import { FormTitleInput } from "../../components/FormTitleInput";
import { SubscribersSelector, useSubscriptions } from "../../features/Subscriptions";
import { usePaths } from "../../routes/paths";
import { assertPresent } from "../../utils/assertions";
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
    }).then((data) => data.project!),
  };
}

function Page() {
  const { project } = Pages.useLoadedData<LoaderResult>();

  return (
    <Pages.Page title={["New Discussion", project.name!]}>
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

  return (
    <Paper.Navigation
      items={[
        { to: paths.spacePath(project.space?.id!), label: project.space?.name! },
        { to: paths.projectPath(project.id!, "discussions"), label: project.name! },
      ]}
    />
  );
}

function Form() {
  const { project } = Pages.useLoadedData<LoaderResult>();
  const paths = usePaths();

  assertPresent(project.potentialSubscribers, "potentialSubscribers must be present in project");

  const subscriptionsState = useSubscriptions(project.potentialSubscribers, { ignoreMe: true });

  const form = useForm({ project, subscriptionsState });

  return (
    <>
      <FormTitleInput
        value={form.fields.title}
        onChange={form.fields.setTitle}
        error={false}
        testId="discussion-title"
      />

      <div className="mt-2 border-y border-stroke-base text-content-base font-medium ">
        <TipTapEditor.StandardEditorForm editor={form.fields.editor.editor} />
      </div>

      <div className="my-10">
        <SubscribersSelector state={subscriptionsState} projectName={project.name} />
      </div>

      <div className="flex items-center gap-4 mt-4">
        <PrimaryButton testId="post-discussion" onClick={form.submit} loading={form.submitting}>
          Post Discussion
        </PrimaryButton>

        <DimmedLink to={paths.projectPath(project.id!)}>Cancel</DimmedLink>
      </div>
    </>
  );
}
