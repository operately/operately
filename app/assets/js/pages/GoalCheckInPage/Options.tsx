import * as React from "react";
import * as Pages from "@/components/Pages";
import * as PageOptions from "@/components/PaperContainer/PageOptions";

import { useLoadedData } from "./loader";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { compareIds } from "@/routes/paths";
import { useNavigate } from "react-router-dom";
import { IconEdit, IconTrash, showSuccessToast } from "turboui";
import { useBoolState } from "@/hooks/useBoolState";
import { useDeleteGoalProgressUpdate } from "@/models/goalCheckIns";
import { usePaths } from "@/routes/paths";
import Modal from "@/components/Modal";
import Forms from "@/components/Forms";

export function Options() {
  const { update, goal } = useLoadedData();
  const [showDiscardModal, toggleDiscardModal] = useBoolState(false);

  const mode = Pages.usePageMode();
  const setPageMode = Pages.useSetPageMode();
  const me = useMe()!;

  const canManageDraft = update.state === "draft";
  const isEditVisible = (canManageDraft || compareIds(me.id, update.author?.id)) && mode === "view";
  const isDiscardVisible = canManageDraft && mode === "view";

  return (
    <PageOptions.Root testId="check-in-options">
      {isEditVisible && (
        <PageOptions.Action
          icon={IconEdit}
          title="Edit"
          onClick={() => setPageMode("edit")}
          testId="edit-check-in"
          keepOutsideOnBigScreen
        />
      )}
      {isDiscardVisible && (
        <PageOptions.Action
          icon={IconTrash}
          title="Discard draft"
          onClick={toggleDiscardModal}
          testId="delete-check-in"
          keepOutsideOnBigScreen
        />
      )}
      <DiscardDraftModal
        isOpen={showDiscardModal}
        toggleModal={toggleDiscardModal}
        updateId={update.id!}
        goalId={goal.id!}
      />
    </PageOptions.Root>
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
  const [remove] = useDeleteGoalProgressUpdate();
  const navigate = useNavigate();
  const paths = usePaths();

  const form = Forms.useForm({
    fields: {},
    cancel: toggleModal,
    submit: async () => {
      await remove({ id: updateId });
      showSuccessToast("Draft discarded", "The draft has been discarded.");
      navigate(paths.goalPath(goalId, { tab: "check-ins" }));
    },
  });

  return (
    <Modal isOpen={isOpen} hideModal={toggleModal}>
      <Forms.Form form={form}>
        <p>Are you sure you want to discard this draft?</p>
        <Forms.Submit saveText="Discard draft" cancelText="Cancel" />
      </Forms.Form>
    </Modal>
  );
}
