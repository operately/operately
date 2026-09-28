import { useTranslation } from "react-i18next";
import React from "react";

export function TaskSectionEmptyState({ inlineCreator, showCreationPrompt }: Props) {
  const { t } = useTranslation();
  return (
    <div className="px-4 py-6">
      {inlineCreator ? (
        <>
          {inlineCreator}
          <div className="hidden px-0 pt-2 text-center text-xs text-content-subtle sm:block">
            {t("Press Enter to add. You can also drag tasks here.")}
          </div>
        </>
      ) : showCreationPrompt ? (
        <div className="text-left text-sm text-content-subtle sm:text-center">
          <span className="sm:hidden">{t("Tap + to add a task.")}</span>
          <span className="hidden sm:inline">{t("Click + or press c to add a task, or drag a task here.")}</span>
        </div>
      ) : (
        <div className="text-left text-sm text-content-subtle sm:text-center">{t("No tasks yet.")}</div>
      )}
    </div>
  );
}

type Props = {
  inlineCreator: React.ReactNode;
  showCreationPrompt: boolean;
};
