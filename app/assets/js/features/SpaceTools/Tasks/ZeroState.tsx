import { useTranslation } from "react-i18next";
import * as React from "react";

import { GhostButton, IconSquareCheckFilled, IconCircleDashed } from "turboui";
import classNames from "classnames";

export function ZeroState() {
  return (
    <div>
      <Examples />
      <ExplanationAndButton />
    </div>
  );
}

function ExplanationAndButton() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col justify-center items-center group">
      <div className="text-base font-bold">{t("Tasks")}</div>

      <div className="flex gap-2 mt-1 mb-4 text-center px-6 text-sm">
        {t("Organize tasks on a Kanban board with status columns.")}
      </div>

      <GhostButton size="sm">{t("Add a new task")}</GhostButton>
    </div>
  );
}

function Examples() {
  const { t } = useTranslation();
  return (
    <div className="relative w-full h-[170px] mt-10 opacity-75 px-[65px] flex flex-col gap-3">
      <Example icon={IconCircleDashed} title={t("Draft the plan")} body={t("Write down the next steps...")} />
      <Example icon={IconCircleDashed} title={t("Assign an owner")} body={t("Pick who will do it...")} />
      <Example icon={IconSquareCheckFilled} title={t("Mark it done")} body={t("Celebrate the win...")} />
    </div>
  );
}

function Example({ icon, title, body }: { icon: any; title: string; body: string }) {
  const iconClass = classNames(
    "bg-stone-300",
    "group-hover:bg-green-300",
    "group-hover:text-stone-900",
    "dark:bg-stone-600",
    "dark:group-hover:bg-green-500",
    "rounded-full p-1.5 transition-all",
  );

  return (
    <div className="flex items-center gap-2 group-hover:gap-3 transition-all shadow-sm pb-2">
      <div className={iconClass}>{React.createElement(icon, { size: 22, stroke: 1.5 })}</div>
      <div>
        <div className="font-bold text-[10px] leading-none">{title}</div>
        <div className="text-[10px]">{body}</div>
      </div>
    </div>
  );
}
