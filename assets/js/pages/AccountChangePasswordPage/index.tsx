import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import Forms from "@/components/Forms";
import { Paths } from "@/routes/paths";
import { useNavigate } from "react-router-dom";

export const loader = Pages.emptyLoader;

export function Page() {
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
    submit: async () => {},
    cancel: () => navigate(Paths.accountSecurityPath()),
  });

  return (
    <Pages.Page title={"Change Password"}>
      <Paper.Root size="small">
        <Paper.Body>
          <Paper.Header title="Change Password" />

          <Forms.Form form={form}>
            <Forms.FieldGroup>
              <Forms.PasswordInput field={"currentPassword"} label="Current Password" />
              <Forms.PasswordInput field={"newPassword"} label="New Password (minimum 12 characters)" minLength={12} />
              <Forms.PasswordInput field={"confirmPassword"} label="Confirm New Password" minLength={12} />
            </Forms.FieldGroup>

            <Forms.Submit saveText="Change Password" cancelText="Cancel" />
          </Forms.Form>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
