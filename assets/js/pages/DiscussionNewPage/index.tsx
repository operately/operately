import React from "react";

import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Spaces from "@/models/spaces";

import { PrimaryButton, GhostButton } from "@/components/Buttons";
import { Form, useForm } from "@/features/DiscussionForm";
import { Paths } from "@/routes/paths";
import { SubscribersSelector } from "@/features/Subscriptions";
import { Link } from "@/components/Link";

interface LoaderResult {
  space: Spaces.Space;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    space: await Spaces.getSpace({
      id: params.id,
      includePotentialSubscribers: true,
    }),
  };
}

export function Page() {
  const { space } = Pages.useLoadedData<LoaderResult>();
  const form = useForm({ space: space, mode: "create", potentialSubscribers: space.potentialSubscribers! });

  return (
    <Pages.Page title="New Discussion" testId="new-discussion">
      <Paper.Root>
        <Navigation space={space} />

        <Paper.Body>
          <Form form={form} />

          {form.mode === "create" && <Submit form={form} />}
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Submit({ form }) {
  return (
    <Paper.DimmedSection>
      <SubscribersSelector state={form.subscriptionsState} spaceName={form.space.name!} />

      <div className="flex items-center gap-2 mt-8">
        <PostButton form={form} />
        <SaveAsDraftButton form={form} />
      </div>

      <div className="mt-4">
        Or, <DiscardLink form={form} />
      </div>
    </Paper.DimmedSection>
  );
}

function PostButton({ form }) {
  return (
    <PrimaryButton loading={form.submitting} testId="post-discussion" onClick={form.submit}>
      {form.submitButtonLabel}
    </PrimaryButton>
  );
}

function SaveAsDraftButton({ form }) {
  return (
    <GhostButton loading={form.submitting} testId="save-as-draft" onClick={form.submitDraft}>
      Save as draft
    </GhostButton>
  );
}

function DiscardLink({ form }) {
  return (
    <Link to={form.cancelPath} testId="discard" className="font-medium">
      Discard this message
    </Link>
  );
}

function Navigation({ space }) {
  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={Paths.spaceDiscussionsPath(space.id)}>{space.name}</Paper.NavItem>
    </Paper.Navigation>
  );
}
