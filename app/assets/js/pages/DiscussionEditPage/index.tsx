import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Discussions from "@/models/discussions";

import { Form, FormState, useForm } from "@/features/DiscussionForm";
import { useBoolState } from "@/hooks/useBoolState";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { PageModule } from "@/routes/types";
import { DiscardDiscussionDraftModal, GhostButton, Link, PrimaryButton, ScheduleFlowControls } from "turboui";
import { useNavigate } from "react-router";

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
  const { discussion } = Pages.useLoadedData<LoaderResult>();
  const isUnpublished = discussion.state === "draft" || discussion.state === "scheduled";
  const formattedTimePreferences = useFormattedTimePreferences();

  return (
    <Paper.DimmedSection>
      <div className="flex flex-col gap-8">
        <div>
          {form.canSchedule ? (
            <ScheduleFlowControls
              scheduleFlow={form.scheduleFlow}
              primaryLabel="Publish Now"
              onPrimaryClick={form.publishDraft}
              loading={form.publishDraftSubmitting || form.scheduleSubmitting}
              testId="publish-now"
              formattedTimePreferences={formattedTimePreferences}
              secondaryAction={
                <GhostButton loading={form.saveChangesSubmitting} testId="save-changes" onClick={form.saveChanges}>
                  Save Changes
                </GhostButton>
              }
            />
          ) : (
            <div className="flex items-center gap-2">
              <PrimaryButton loading={form.saveChangesSubmitting} testId="save-changes" onClick={form.saveChanges}>
                Save Changes
              </PrimaryButton>
            </div>
          )}

          <div className="mt-4">
            Or, <CancelLink form={form} />
            {isUnpublished && (
              <>
                {" "}
                or <DiscardDraftLink discussion={discussion} />
              </>
            )}
          </div>
        </div>
      </div>
    </Paper.DimmedSection>
  );
}

function CancelLink({ form }: { form: FormState }) {
  return (
    <Link to={form.cancelPath} testId="cancel-edit" className="font-medium">
      Cancel
    </Link>
  );
}

function DiscardDraftLink({ discussion }: { discussion: Discussions.Discussion }) {
  const paths = usePaths();
  const navigate = useNavigate();
  const [archive] = Discussions.useArchiveMessage();
  const [showDiscardModal, toggleDiscardModal] = useBoolState(false);

  const handleRedirect = () => {
    if (discussion.space) {
      navigate(paths.spaceDiscussionsPath(discussion.space.id));
    } else {
      navigate(paths.homePath());
    }
  };

  return (
    <>
      <button type="button" onClick={toggleDiscardModal} className="font-medium" data-test-id="discard-draft">
        Discard draft
      </button>
      <DiscardDiscussionDraftModal
        isOpen={showDiscardModal}
        onClose={toggleDiscardModal}
        onDiscard={() => archive({ id: discussion.id! })}
        onSuccess={handleRedirect}
      />
    </>
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
