import React from "react";
import { useTranslation } from "react-i18next";
import { AccountSettingsPage, showSuccessToast } from "turboui";

import { useMe } from "@/contexts/CurrentCompanyContext";
import { useSetTheme } from "@/contexts/ThemeContext";
import { applyLanguage } from "@/i18n";
import { isSupportedLanguage } from "@/i18n/languages";
import * as People from "@/models/people";
import { usePaths } from "@/routes/paths";
import { PageModule } from "@/routes/types";
import { getTimezones } from "./timezones";
import { loader, useLoadedData } from "./loader";

export default { name: "AccountSettingsPage", loader, Page } as PageModule;

function Page() {
  const { t } = useTranslation();
  const paths = usePaths();
  const me = useMe();
  const { theme } = useLoadedData();
  const setTheme = useSetTheme();
  const { mutateAsync: updateProfile } = People.useUpdateProfile();
  const { mutateAsync: updateTheme } = People.useUpdateTheme();

  if (!me) return null;

  const preferences: AccountSettingsPage.Preferences = {
    theme,
    language: isSupportedLanguage(me.language) ? me.language : "en",
    timezone: me.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    timeFormat: me.timeFormat ?? "automatic",
  };

  const timezones = getTimezones();
  if (!timezones.some(({ value }) => value === preferences.timezone)) {
    timezones.push({ value: preferences.timezone, label: preferences.timezone });
  }

  const savePreferences = async (values: AccountSettingsPage.Preferences) => {
    if (values.theme !== preferences.theme) {
      await updateTheme({ theme: values.theme });
      setTheme(values.theme);
    }
    await updateProfile({
      id: me.id,
      language: values.language,
      ...(values.timezone !== preferences.timezone ? { timezone: values.timezone } : {}),
      timeFormat: values.timeFormat,
    });
    await applyLanguage(values.language);
    showSuccessToast(t("Preferences saved"), t("Your preferences have been updated."));
  };

  return (
    <AccountSettingsPage
      key={me.id}
      homePath={paths.homePath()}
      accountPath={paths.accountPath()}
      preferences={preferences}
      timezones={timezones}
      onSave={savePreferences}
    />
  );
}
