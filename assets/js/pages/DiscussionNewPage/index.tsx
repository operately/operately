import React from "react";

import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Spaces from "@/models/spaces";

import { PrimaryButton, GhostButton } from "@/components/Buttons";
import { Form, useForm, FormState } from "@/features/DiscussionForm";
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
        <SubscribersSelector state={form.subscriptionsState} spaceName={form.space.name!} />

        <div>
          <div className="flex items-center gap-2">
            <PostButton form={form} />
            <SaveAsDraftButton form={form} />
          </div>

          <div className="mt-4">
            Or, <DiscardLink form={form} />
          </div>
        </div>
      </div>
    </Paper.DimmedSection>
  );
}

function PostButton({ form }: { form: FormState }) {
  return (
    <PrimaryButton loading={form.postMessageSubmitting} testId="post-discussion" onClick={form.postMessage}>
      Post discussion
    </PrimaryButton>
  );
}

function SaveAsDraftButton({ form }: { form: FormState }) {
  return (
    <GhostButton loading={form.postAsDraftSubmitting} testId="save-as-draft" onClick={form.postAsDraft}>
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
