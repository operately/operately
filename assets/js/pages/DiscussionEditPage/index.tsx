import React from "react";

import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Discussions from "@/models/discussions";

import { PrimaryButton, GhostButton } from "@/components/Buttons";
import { Form, FormState, useForm } from "@/features/DiscussionForm";
import { Paths } from "@/routes/paths";

interface LoaderResult {
  discussion: Discussions.Discussion;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    discussion: await Discussions.getDiscussion({
      id: params.id,
      includeSpace: true,
    }).then((d) => d.discussion!),
  };
}

export function Page() {
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
          <Form form={form} />

          <Submit form={form} />
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

function Navigation({ space }) {
  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={Paths.spacePath(space.id)}>{space.name}</Paper.NavItem>
      <Paper.NavSeparator />
      <Paper.NavItem linkTo={Paths.spaceDiscussionsPath(space.id)}>Discussions</Paper.NavItem>
    </Paper.Navigation>
  );
}
