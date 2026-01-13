import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Discussions from "@/models/discussions";

import { Form, FormState, useForm } from "@/features/DiscussionForm";
import { PageModule } from "@/routes/types";
import { GhostButton, Link, PrimaryButton } from "turboui";

import { usePaths } from "@/routes/paths";
export default { name: "DiscussionEditPage", loader, Page } as PageModule;

interface LoaderResult {
  discussion: Discussions.Discussion;
}

async function loader({ params }): Promise<LoaderResult> {
  return {
    discussion: await Discussions.getDiscussion({
      id: params.id,
      includeSpace: true,
    }).then((d) => d.discussion!),
  };
}

function Page() {
  const { discussion } = Pages.useLoadedData<LoaderResult>();

  const form = useForm({
    discussion: discussion,
    space: discussion.space!,
    mode: "edit",
  });

  return (
    <Pages.Page title="Edit Discussion" testId="discussion-edit-page">
      <Paper.Root>
        <Navigation space={discussion.space!} />

        <Paper.Body>
          <Form form={form}>
            <Submit form={form} />
          </Form>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Submit({ form }: { form: FormState }) {
  return (
    <Paper.DimmedSection>
      <div className="flex flex-col gap-8">
        <div>
          <div className="flex items-center gap-2">
            <SaveChanges form={form} />
            <PublishNow form={form} />
          </div>

          <div className="mt-4">
            Or, <CancelLink form={form} />
          </div>
        </div>
      </div>
    </Paper.DimmedSection>
  );
}

function SaveChanges({ form }: { form: FormState }) {
  return (
    <PrimaryButton loading={form.saveChangesSubmitting} testId="save-changes" onClick={form.saveChanges}>
      Save Changes
    </PrimaryButton>
  );
}

function PublishNow({ form }: { form: FormState }) {
  const { discussion } = Pages.useLoadedData<LoaderResult>();
  if (discussion.state !== "draft") return null;

  return (
    <GhostButton loading={form.publishDraftSubmitting} testId="publish-now" onClick={form.publishDraft}>
      Publish Now
    </GhostButton>
  );
}

function CancelLink({ form }: { form: FormState }) {
  return (
    <Link to={form.cancelPath} testId="cancel-edit" className="font-medium">
      Cancel
    </Link>
  );
}

function Navigation({ space }) {
  const paths = usePaths();
  return (
    <Paper.Navigation
      items={[
        { to: paths.spacePath(space.id), label: space.name },
        { to: paths.spaceDiscussionsPath(space.id), label: "Discussions" },
      ]}
    />
  );
}
