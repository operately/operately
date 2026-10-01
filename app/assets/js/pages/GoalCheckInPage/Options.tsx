import i18n from "@/i18n";
import { useTranslation } from "react-i18next";
import * as React from "react";
import * as Pages from "@/components/Pages";
import * as PageOptions from "@/components/PaperContainer/PageOptions";

import { useLoadedData } from "./loader";
import { useNavigate } from "react-router";
import { Forms, IconEdit, IconTrash, Modal, showSuccessToast } from "turboui";
import { useBoolState } from "@/hooks/useBoolState";
import { useDeleteGoalProgressUpdate } from "@/models/goalCheckIns";
import { usePaths } from "@/routes/paths";

export function Options() {
  const { t } = useTranslation();
  const { update, goal } = useLoadedData();
  const [showDiscardModal, toggleDiscardModal] = useBoolState(false);

  const mode = Pages.usePageMode();
  const setPageMode = Pages.useSetPageMode();

  const isUnpublished = update.state === "draft" || update.state === "scheduled";
  const isEditVisible = (update.permissions?.canEdit ?? false) && mode === "view";
  const isDiscardVisible = isUnpublished && mode === "view";

  if (!isEditVisible && !isDiscardVisible) return null;

  return (
    <>
      <PageOptions.Root testId="check-in-options">
        {isEditVisible && (
          <PageOptions.Action
            icon={IconEdit}
            title={t("Edit")}
            onClick={() => setPageMode("edit")}
            testId="edit-check-in"
            keepOutsideOnBigScreen
          />
        )}
        {isDiscardVisible && (
          <PageOptions.Action
            icon={IconTrash}
            title={t("Discard draft")}
            onClick={toggleDiscardModal}
            testId="delete-check-in"
          />
        )}
      </PageOptions.Root>
      <DiscardDraftModal
        isOpen={showDiscardModal}
        toggleModal={toggleDiscardModal}
        updateId={update.id}
        goalId={goal.id}
      />
    </>
  );
}

function DiscardDraftModal({
  isOpen,
  toggleModal,
  updateId,
  goalId,
}: {
  isOpen: boolean;
  toggleModal: () => void;
  updateId: string;
  goalId: string;
}) {
  const { t } = useTranslation();
  const remove = useDeleteGoalProgressUpdate(goalId);
  const navigate = useNavigate();
  const paths = usePaths();

  const form = Forms.useForm({
    fields: {},
    cancel: toggleModal,
    submit: async () => {
      await remove.mutateAsync({ id: updateId });
      showSuccessToast(i18n.t("Draft discarded"), i18n.t("The draft has been discarded."));
      navigate(paths.goalPath(goalId, { tab: "check-ins" }));
    },
  });

  return (
    <Modal isOpen={isOpen} onClose={toggleModal}>
      <Forms.Form form={form}>
        <p>{t("Are you sure you want to discard this draft?")}</p>
        <Forms.Submit saveText={t("Discard draft")} cancelText={t("Cancel")} />
      </Forms.Form>
    </Modal>
  );
}
