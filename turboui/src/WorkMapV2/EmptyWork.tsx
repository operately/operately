import React from "react";
import { useTranslation } from "react-i18next";
import { PrimaryButton, SecondaryButton } from "../Button";

export function EmptyWork({ onAddProject, onAddGoal }: { onAddProject?: () => void; onAddGoal?: () => void }) {
  const { t } = useTranslation();
  return (
    <section className="px-4 pb-12 pt-16 text-center sm:pt-[104px]">
      <h2 className="text-[22px] font-semibold leading-7">{t("No goals or projects yet")}</h2>
      {onAddProject && onAddGoal && (
        <p className="mt-2.5 text-sm text-content-dimmed dark:text-[#c2c4cd]">
          {t("Add a project your team is working on, or a goal it wants to reach.")}
        </p>
      )}
      {(onAddProject || onAddGoal) && (
        <div className="mt-5 flex flex-wrap justify-center gap-2.5">
          {onAddProject && (
            <PrimaryButton
              size="sm"
              className="min-h-9 px-3.5 dark:border-[#4a64c7] dark:bg-[#4a64c7] dark:hover:bg-[#536fd6]"
              onClick={onAddProject}
            >
              {t("Add a project")}
            </PrimaryButton>
          )}
          {onAddGoal && (
            <SecondaryButton
              size="sm"
              className="min-h-9 px-3.5 dark:border-[#464953] dark:bg-[#292b32] dark:text-[#f6f7fe] dark:hover:bg-[#32343b]"
              onClick={onAddGoal}
            >
              {t("Add a goal")}
            </SecondaryButton>
          )}
        </div>
      )}
    </section>
  );
}
