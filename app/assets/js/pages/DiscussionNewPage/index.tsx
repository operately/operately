import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Spaces from "@/models/spaces";

import { Form, FormState, useForm } from "@/features/DiscussionForm";
import { PageModule } from "@/routes/types";
import { GhostButton, Link, PrimaryButton, SubscribersSelector } from "turboui";

import { usePaths } from "@/routes/paths";
export default { name: "DiscussionNewPage", loader, Page } as PageModule;

interface LoaderResult {
  space: Spaces.Space;
}

async function loader({ params }): Promise<LoaderResult> {
  return {
    space: await Spaces.getSpace({
      id: params.id,
      includePotentialSubscribers: true,
    }),
  };
}

function Page() {
  const { space } = Pages.useLoadedData<LoaderResult>();
  const form = useForm({ space: space, mode: "create", potentialSubscribers: space.potentialSubscribers! });

  return (
    <Pages.Page title="New Discussion" testId="new-discussion">
      <Paper.Root>
        <Navigation space={space} />

        <Paper.Body>
          <Form form={form}>
            <Footer form={form} />
          </Form>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Footer({ form }: { form: FormState }) {
  return (
    <Paper.DimmedSection>
      <div className="flex flex-col gap-8">
        <SubscribersSelector {...form.subscriptionsState} />

        <Submit form={form} />
      </div>
    </Paper.DimmedSection>
  );
}

function Submit({ form }: { form: FormState }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <PostButton form={form} />
        <SaveAsDraftButton form={form} />
      </div>

      <div className="mt-4">
        Or, <DiscardLink form={form} />
      </div>
    </div>
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

function DiscardLink({ form }: { form: FormState }) {
  return (
    <Link to={form.cancelPath} testId="discard" className="font-medium">
      Discard this message
    </Link>
  );
}

function Navigation({ space }) {
  const paths = usePaths();
  return <Paper.Navigation items={[{ to: paths.spaceDiscussionsPath(space.id), label: space.name! }]} />;
}
