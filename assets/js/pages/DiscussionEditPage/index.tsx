import React from "react";

import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Discussions from "@/models/discussions";
import * as Companies from "@/models/companies";

import { PrimaryButton, GhostButton } from "@/components/Buttons";
import { Form, useForm } from "@/features/DiscussionForm";
import { Paths } from "@/routes/paths";

interface LoaderResult {
  company: Companies.Company;
  discussion: Discussions.Discussion;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    company: await Companies.getCompany({ id: params.companyId }).then((d) => d.company!),
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
    <Pages.Page title="Edit Discussion" testId="new-discussion">
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

function Submit({ form }) {
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

function SaveChanges({ form }) {
  return (
    <PrimaryButton loading={form.submitting} testId="save-changes" onClick={form.submit}>
      Save Changes
    </PrimaryButton>
  );
}

function PublishNow({ form }) {
  const { company, discussion } = Pages.useLoadedData<LoaderResult>();
  const hasDraftFeature = Companies.hasFeature(company, "draft_discussions");

  if (!hasDraftFeature) return null;
  if (discussion.state !== "draft") return null;

  return (
    <GhostButton loading={form.draftSubmitting} testId="publish-now" onClick={form.submitDraft}>
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
