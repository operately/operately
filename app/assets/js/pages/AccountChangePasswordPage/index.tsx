import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Accounts from "@/models/accounts";
import * as React from "react";

import Forms from "@/components/Forms";
import { PageModule } from "@/routes/types";
import { useNavigate } from "react-router-dom";

export default { name: "AccountChangePasswordPage", loader: Pages.emptyLoader, Page } as PageModule;

function Page() {
  const navigate = useNavigate();

  const form = Forms.useForm({
    fields: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    validate: (addError) => {
      if (form.values.newPassword !== form.values.confirmPassword) {
        addError("confirmPassword", "Passwords do not match");
      }
    },
    submit: async () => {
      await Accounts.changePassword({
        currentPassword: form.values.currentPassword,
        newPassword: form.values.newPassword,
        newPasswordConfirmation: form.values.confirmPassword,
      });

      navigate(DeprecatedPaths.accountSecurityPath());
    },
    cancel: () => navigate(DeprecatedPaths.accountSecurityPath()),
  });

  return (
    <Pages.Page title={"Change Password"} testId="change-password-page">
      <Paper.Root size="small">
        <Paper.Body>
          <Paper.Header title="Change Password" />

          <Forms.Form form={form}>
            <Forms.FieldGroup>
              <Forms.PasswordInput
                field={"currentPassword"}
                label="Current Password"
                placeholder="Enter your current password"
              />
              <Forms.PasswordInput
                field={"newPassword"}
                label="New Password"
                minLength={12}
                placeholder="At least 12 characters"
              />
              <Forms.PasswordInput
                field={"confirmPassword"}
                label="Confirm New Password"
                minLength={12}
                placeholder="At least 12 characters"
              />
            </Forms.FieldGroup>

            <Forms.Submit saveText="Change Password" cancelText="Cancel" />
          </Forms.Form>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
