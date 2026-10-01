import { useTranslation } from "react-i18next";
import * as Pages from "@/components/Pages";
import { useLoadedData } from "./loader";

export function useGoalCheckInPageTitle(): string[] {
  const { t } = useTranslation();
  const { goal } = useLoadedData();
  const mode = Pages.usePageMode();

  if (mode === "edit") {
    return [t("Editing"), t("Goal Check-In"), goal.name];
  } else {
    return [t("Goal Check-In"), goal.name];
  }
}
