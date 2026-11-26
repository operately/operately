import { useTranslation } from "react-i18next";
import { showErrorToast, showSuccessToast, type WorkMapViewState } from "turboui";
import type { WorkMapsGetSettingsInput } from "@/api";
import { useSaveWorkMapSettings } from "./workMapSettingsLifecycle";

export function useSaveWorkMapDefaultView(scopeName: string) {
  const { t } = useTranslation();
  const { mutate, isPending } = useSaveWorkMapSettings();

  const save = (scope: WorkMapsGetSettingsInput, defaultView: WorkMapViewState) =>
    mutate(
      { ...scope, defaultView },
      {
        onSuccess: () => showSuccessToast(t("{{name}} now opens with this view.", { name: scopeName }), ""),
        onError: () => showErrorToast(t("Couldn’t save the default view"), t("Please try again.")),
      },
    );

  return { save, saving: isPending };
}
