import { loader, useLoadedData } from "./loader";
import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { Form, FormState, useForm } from "@/features/DiscussionForm";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { PageModule } from "@/routes/types";
import { GhostButton, Link, ScheduleFlowControls, SubscribersSelector } from "turboui";

import { usePaths } from "@/routes/paths";
export default { name: "DiscussionNewPage", loader, Page } as PageModule;

function Page() {
  const { space } = useLoadedData();
  const form = useForm({ space: space, mode: "create", potentialSubscribers: space.potentialSubscribers ?? [] });

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
  const formattedTimePreferences = useFormattedTimePreferences();

  return (
    <div>
      <ScheduleFlowControls
        scheduleFlow={form.scheduleFlow}
        primaryLabel="Post"
        onPrimaryClick={form.postMessage}
        loading={form.postMessageSubmitting || form.scheduleSubmitting}
        testId="post-discussion"
        formattedTimePreferences={formattedTimePreferences}
        modalTitle="Schedule Discussion"
        secondaryAction={
          <GhostButton loading={form.postAsDraftSubmitting} testId="save-as-draft" onClick={form.postAsDraft}>
            Save as draft
          </GhostButton>
        }
      />

      <div className="mt-4">
        Or, <DiscardLink form={form} />
      </div>
    </div>
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
  return <Paper.Navigation items={[{ to: paths.spaceDiscussionsPath(space.id), label: space.name }]} />;
}
