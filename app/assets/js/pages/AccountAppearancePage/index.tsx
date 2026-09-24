import * as Pages from "@/components/Pages";
import * as People from "@/models/people";
import * as React from "react";
import { useTranslation } from "react-i18next";

import { IconSun, IconMoon, IconDeviceLaptop, Forms, showErrorToast, Page as TurboUIPage } from "turboui";

import classnames from "classnames";

import { translationText } from "@/i18n";
import { useSetTheme, useTheme } from "@/contexts/ThemeContext";
import { PageModule } from "@/routes/types";
import { useNavigate } from "react-router";

import { usePaths } from "@/routes/paths";
export default { name: "AccountAppearancePage", loader: Pages.emptyLoader, Page } as PageModule;

function Page() {
  const { t } = useTranslation();
  const paths = usePaths();

  return (
    <TurboUIPage
      title={[translationText(t("Appearance")), translationText(t("Account"))]}
      size="small"
      navigation={[
        { to: paths.homePath(), label: t("Home") },
        { to: paths.accountSettingsPath(), label: t("Settings") },
      ]}
    >
      <div className="px-10 py-8">
        <Form />
      </div>
    </TurboUIPage>
  );
}

function Form() {
  const { t } = useTranslation();
  const paths = usePaths();
  const currentTheme = useTheme();
  const navigate = useNavigate();
  const updateTheme = People.useUpdateTheme();

  const form = Forms.useForm({
    fields: {
      theme: currentTheme,
    },
    submit: async () => {
      try {
        await updateTheme.mutateAsync({ theme: form.values.theme });
        navigate(paths.accountPath());
      } catch {
        showErrorToast(t("Error"), t("Failed to update theme"));
      }
    },
  });

  return (
    <Forms.Form form={form}>
      <h1 className="text-2xl font-bold">{t("Appearance")}</h1>

      <h2 className="font-bold mt-8">{t("Color Mode")}</h2>
      <p className="text-sm text-content-dimmed">
        {t("Choose if appearance should be light, or dark, or follow your computer's settings.")}
      </p>

      <div className="grid grid-cols-3 gap-4 mt-4 h-32">
        <ColorModeOption icon={IconSun} title={t("Always Light")} theme="light" />
        <ColorModeOption icon={IconMoon} title={t("Always Dark")} theme="dark" />
        <ColorModeOption icon={IconDeviceLaptop} title={t("Same as System")} theme="system" />
      </div>

      <Forms.Submit saveText={translationText(t("Save Changes"))} />
    </Forms.Form>
  );
}

function ColorModeOption({ theme, icon, title }) {
  const currentTheme = useTheme();
  const setTheme = useSetTheme();

  const className = classnames(
    "rounded",
    "border",
    "flex flex-col items-center justify-center gap-2",
    "p-4",
    "cursor-pointer",
    "hover:bg-surface-accent",
    {
      "bg-surface-dimmed": currentTheme !== theme,
      "border-accent-1": currentTheme === theme,
      "border-surface-outline": currentTheme !== theme,
    },
  );

  const [_, setValue] = Forms.useFieldValue("theme");

  const changeTheme = () => {
    setValue(theme);
    setTheme(theme);
  };

  return (
    <div className={className} onClick={changeTheme} data-test-id={`color-mode-${theme}`}>
      {React.createElement(icon, { size: 32, strokeWidth: 1.5 })}
      <span className="font-semibold">{title}</span>
    </div>
  );
}
