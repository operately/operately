import * as Pages from "@/components/Pages";
import * as Accounts from "@/models/accounts";
import * as React from "react";
import { useTranslation } from "react-i18next";

import { PageModule } from "@/routes/types";
import { useNavigate } from "react-router";
import { Forms, showSuccessToast, showErrorToast, Page as TurboUIPage } from "turboui";

import { translationText } from "@/i18n";
import { usePaths } from "@/routes/paths";
export default { name: "AccountChangePasswordPage", loader: Pages.emptyLoader, Page } as PageModule;

function Page() {
  const { t } = useTranslation();
  const paths = usePaths();
  const navigate = useNavigate();

  const form = Forms.useForm({
    fields: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    validate: (addError) => {
      if (form.values.newPassword !== form.values.confirmPassword) {
        addError("confirmPassword", t("Passwords do not match"));
      }
    },
    submit: async () => {
      try {
        await Accounts.changePassword({
          currentPassword: form.values.currentPassword,
          newPassword: form.values.newPassword,
          newPasswordConfirmation: form.values.confirmPassword,
        });

        showSuccessToast(t("Password Changed"), t("Your password has been updated successfully."));
        navigate(paths.accountSecurityPath());
      } catch (error) {
        showErrorToast(t("Password Change Failed"), t("There was an error updating your password. Please try again."));
      }
    },
    cancel: () => navigate(paths.accountSecurityPath()),
  });

  return (
    <TurboUIPage
      title={translationText(t("Change Password"))}
      size="small"
      testId="change-password-page"
      navigation={[
        { to: paths.homePath(), label: t("Home") },
        { to: paths.accountSecurityPath(), label: t("Password & Security") },
      ]}
    >
      <div className="px-10 py-8">
        <div className="mb-6">
          <div className="text-content-accent text-lg md:text-2xl font-extrabold">{t("Change Password")}</div>
        </div>

        <Forms.Form form={form}>
          <Forms.FieldGroup>
            <Forms.PasswordInput
              field={"currentPassword"}
              label={t("Current Password")}
              placeholder={translationText(t("Enter your current password"))}
            />
            <Forms.PasswordInput
              field={"newPassword"}
              label={t("New Password")}
              minLength={12}
              placeholder={translationText(t("At least 12 characters"))}
            />
            <Forms.PasswordInput
              field={"confirmPassword"}
              label={t("Confirm New Password")}
              minLength={12}
              placeholder={translationText(t("At least 12 characters"))}
            />
          </Forms.FieldGroup>

          <Forms.Submit saveText={translationText(t("Change Password"))} cancelText={translationText(t("Cancel"))} />
        </Forms.Form>
      </div>
    </TurboUIPage>
  );
}
