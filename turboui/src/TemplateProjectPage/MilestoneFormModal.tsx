import { useTranslation } from "react-i18next";
import React, { useEffect } from "react";
import { PrimaryButton, SecondaryButton } from "../Button";
import Modal from "../Modal";
import { RelativeDayField } from "../RelativeDayField";
import { SwitchToggle } from "../SwitchToggle";
import { TextField } from "../TextField";
import type { TemplateProjectPage } from ".";

export function MilestoneFormModal({
  isOpen,
  onClose,
  onCreate,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreate: TemplateProjectPage.Props["onMilestoneCreate"];
}) {
  const { t } = useTranslation();
  const [title, setTitle] = React.useState("");
  const [dueOffsetDays, setDueOffsetDays] = React.useState<number | null>(null);
  const [createMore, setCreateMore] = React.useState(false);

  const resetForm = () => {
    setTitle("");
    setDueOffsetDays(null);
    setCreateMore(false);
  };

  useEffect(() => {
    if (!isOpen) resetForm();
  }, [isOpen]);

  const create = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;

    onCreate?.({ title: title.trim(), description: null, dueOffsetDays });

    if (createMore) {
      setTitle("");
      setDueOffsetDays(null);
    } else {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t("Create Milestone")} size="medium">
      <form onSubmit={create} className="space-y-6" data-test-id="add-template-milestone-form">
        <TextField
          variant="form-field"
          label={t("Milestone name")}
          text={title}
          onChange={setTitle}
          placeholder={t("Enter milestone name")}
          autofocus
          onChangeOnType
          testId="template-milestone-name"
        />

        <div>
          <label className="mb-1 block text-sm font-medium text-content-base">{t("Relative due date")}</label>
          <RelativeDayField
            variant="form-field"
            value={dueOffsetDays}
            onChange={setDueOffsetDays}
            placeholder={t("Set relative date")}
          />
        </div>

        <div className="mt-8 flex items-center">
          <SwitchToggle
            value={createMore}
            setValue={setCreateMore}
            label={t("Create more")}
            testId="add-template-milestone-more-switch"
          />
          <div className="flex-1" />
          <div className="flex space-x-3">
            <SecondaryButton onClick={onClose} type="button">
              {t("Cancel")}
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={!title.trim()}>
              {t("Create milestone")}
            </PrimaryButton>
          </div>
        </div>
      </form>
    </Modal>
  );
}
