import { loader, useLoadedData } from "./loader";
import React from "react";
import { Trans, useTranslation } from "react-i18next";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Discussions from "@/models/discussions";

import { Form, FormState, useForm } from "@/features/DiscussionForm";
import { useBoolState } from "@/hooks/useBoolState";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { PageModule } from "@/routes/types";
import {
  ActionLink,
  DiscardDiscussionDraftModal,
  GhostButton,
  Link,
  PrimaryButton,
  ScheduleFlowControls,
} from "turboui";
import { useNavigate } from "react-router";

import { useMe } from "@/contexts/CurrentCompanyContext";
import { compareIds, usePaths } from "@/routes/paths";
export default { name: "DiscussionEditPage", loader, Page } as PageModule;

function Page() {
  const { t } = useTranslation();
  const { discussion } = useLoadedData();

  const form = useForm({
    discussion: discussion,
    space: discussion.space,
    mode: "edit",
  });

  return (
    <Pages.Page title={t("Edit Discussion")} testId="discussion-edit-page">
      <Paper.Root>
        <Navigation space={discussion.space} />

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
  const { t } = useTranslation();
  const me = useMe();
  const { discussion } = useLoadedData();
  const isUnpublished = discussion.state === "draft" || discussion.state === "scheduled";
  const isScheduled = discussion.state === "scheduled";
  const isAuthor = Boolean(discussion.author && me && compareIds(me.id, discussion.author.id));
  const formattedTimePreferences = useFormattedTimePreferences();

  return (
    <Paper.DimmedSection>
      <div className="flex flex-col gap-8">
        <div>
          {form.canSchedule && isAuthor ? (
            <ScheduleFlowControls
              scheduleFlow={form.scheduleFlow}
              primaryLabel={isScheduled ? t("Save Changes") : t("Publish Now")}
              onPrimaryClick={isScheduled ? form.saveChanges : form.publishDraft}
              loading={
                isScheduled ? form.saveChangesSubmitting : form.publishDraftSubmitting || form.scheduleSubmitting
              }
              testId="publish-now"
              formattedTimePreferences={formattedTimePreferences}
              modalTitle={t("Schedule Discussion")}
              scheduledPrimaryLabel={isScheduled ? t("Save Changes") : undefined}
              showScheduleOption={!isScheduled}
              secondaryAction={
                !isScheduled && (
                  <GhostButton loading={form.saveChangesSubmitting} testId="save-changes" onClick={form.saveChanges}>
                    {t("Save Changes")}
                  </GhostButton>
                )
              }
              options={
                isScheduled
                  ? [
                      { label: t("Publish now"), action: form.publishNow, testId: "publish-now-option" },
                      { label: t("Save as draft"), action: form.saveAsDraft, testId: "save-as-draft-option" },
                    ]
                  : []
              }
            />
          ) : (
            <div className="flex items-center gap-2">
              <PrimaryButton loading={form.saveChangesSubmitting} testId="save-changes" onClick={form.saveChanges}>
                {t("Save Changes")}
              </PrimaryButton>
            </div>
          )}

          <div className="mt-4">
            {isUnpublished ? (
              <Trans
                i18nKey="Or, <cancel>Cancel</cancel> or <discard>Discard draft</discard>"
                components={{
                  cancel: <Link to={form.cancelPath} testId="cancel-edit" className="font-medium" />,
                  discard: <DiscardDraftLink discussion={discussion} />,
                }}
              />
            ) : (
              <Trans
                i18nKey="Or, <cancel>Cancel</cancel>"
                components={{ cancel: <Link to={form.cancelPath} testId="cancel-edit" className="font-medium" /> }}
              />
            )}
          </div>
        </div>
      </div>
    </Paper.DimmedSection>
  );
}

function DiscardDraftLink({
  discussion,
  children,
}: {
  discussion: ReturnType<typeof useLoadedData>["discussion"];
  children?: React.ReactNode;
}) {
  const { t } = useTranslation();
  const paths = usePaths();
  const navigate = useNavigate();
  const { mutateAsync: archive } = Discussions.useArchiveMessage(discussion.space.id);
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
      <ActionLink
        onClick={toggleDiscardModal}
        className="font-medium !text-inherit"
        underline="hover"
        testId="discard-draft"
      >
        {children ?? t("Discard draft")}
      </ActionLink>
      <DiscardDiscussionDraftModal
        isOpen={showDiscardModal}
        onClose={toggleDiscardModal}
        onDiscard={async () => {
          await archive({ id: discussion.id });
        }}
        onSuccess={handleRedirect}
      />
    </>
  );
}

function Navigation({ space }) {
  const { t } = useTranslation();
  const paths = usePaths();
  return (
    <Paper.Navigation
      items={[
        { to: paths.spacePath(space.id), label: space.name },
        { to: paths.spaceDiscussionsPath(space.id), label: t("Discussions") },
      ]}
    />
  );
}
