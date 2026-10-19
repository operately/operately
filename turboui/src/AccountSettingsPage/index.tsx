import React from "react";
import { useTranslation } from "react-i18next";

import type { AccountTheme, Language, TimeFormat } from "../ApiTypes";
import * as Forms from "../Forms";
import { Dropdown } from "../FormElements/Dropdown";
import { Page } from "../Page";
import { translationText } from "../i18n";
import { IconSun, IconMoon, IconDeviceLaptop } from "../icons";

export namespace AccountSettingsPage {
  export type Preferences = {
    theme: AccountTheme;
    language: Language;
    timezone: string;
    timeFormat: TimeFormat;
  };

  export interface Props {
    homePath: string;
    accountPath: string;
    preferences: Preferences;
    timezones: { value: string; label: string }[];
    onSave: (preferences: Preferences) => Promise<void>;
  }
}

const languages: Dropdown.Item[] = [
  { id: "en", name: "English", testId: "language-option-en" },
  { id: "de", name: "Deutsch", testId: "language-option-de" },
  { id: "fr", name: "Français", testId: "language-option-fr" },
  { id: "es", name: "Español", testId: "language-option-es" },
  { id: "ru", name: "Русский", testId: "language-option-ru" },
  { id: "pt-BR", name: "Português (Brasil)", testId: "language-option-pt-BR" },
];

export function AccountSettingsPage(props: AccountSettingsPage.Props) {
  const { t } = useTranslation();
  const form = Forms.useForm({
    fields: props.preferences,
    submit: () => props.onSave(form.values),
    onError: () => form.actions.addErrors({ save: t("Could not save all preferences. Please try again.") }),
  });
  const navigation = [
    { to: props.homePath, label: t("Home") },
    { to: props.accountPath, label: t("My Account") },
  ];

  return (
    <Page title={translationText(t("Settings"))} size="small" testId="account-settings-page" navigation={navigation}>
      <div className="px-4 sm:px-10 py-8">
        <h1 className="text-2xl font-bold">{t("Settings")}</h1>
        <Forms.Form form={form} className="mt-8 space-y-8">
          <fieldset disabled={form.state === "submitting"}>
            <Forms.FieldGroup>
              <Forms.RadioButtons
                field="theme"
                variant="cards"
                label={translationText(t("Color Mode"))}
                options={[
                  { value: "light", label: t("Always Light"), icon: <IconSun size={24} strokeWidth={1.5} /> },
                  { value: "dark", label: t("Always Dark"), icon: <IconMoon size={24} strokeWidth={1.5} /> },
                  {
                    value: "system",
                    label: t("Same as System"),
                    icon: <IconDeviceLaptop size={24} strokeWidth={1.5} />,
                  },
                ]}
              />
              <PreferenceDropdown field="language" label={t("Language")} items={languages} />
              <PreferenceDropdown
                field="timezone"
                label={t("Timezone")}
                items={props.timezones.map(({ value, label }) => ({ id: value, name: label }))}
              />
              <PreferenceDropdown
                field="timeFormat"
                testId="time-format"
                label={t("Time format")}
                items={[
                  { id: "automatic", name: t("Automatic") },
                  { id: "hour_12", name: t("12-hour clock") },
                  { id: "hour_24", name: t("24-hour clock") },
                ]}
              />
            </Forms.FieldGroup>
          </fieldset>
          <Forms.FormError message={t("Could not save all preferences. Please try again.")} />
          <Forms.Submit saveText={translationText(t("Save Changes"))} />
        </Forms.Form>
      </div>
    </Page>
  );
}

function PreferenceDropdown({
  field,
  label,
  items,
  testId = field,
}: {
  field: string;
  label: string;
  items: Dropdown.Item[];
  testId?: string;
}) {
  const [value, setValue] = Forms.useFieldValue<string>(field);

  return (
    <Forms.InputField field={field} label={label}>
      <Dropdown id={field} testId={testId} items={items} value={value ?? ""} onSelect={(item) => setValue(item.id)} />
    </Forms.InputField>
  );
}
