import React from "react";

import * as Accounts from "@/models/accounts";
import * as Invitations from "@/models/invitations";

import Forms from "@/components/Forms";
import { logInWithInvitationToken } from "@/routes/auth";
import { useLoadedData } from "./loader";

export function Form() {
  const [join] = Accounts.useJoinCompany();
  const { invitation, token, resetPassword } = useLoadedData();

  const form = Forms.useForm({
    fields: {
      password: "",
      passwordConfirmation: "",
    },
    validate: (addError) => {
      if (form.values.password !== form.values.passwordConfirmation) {
        addError("passwordConfirmation", "Passwords do not match");
      }
    },
    submit: async () => {
      await join({
        token: token,
        password: resetPassword ? form.values.password.trim() : undefined,
        passwordConfirmation: resetPassword ? form.values.passwordConfirmation.trim() : undefined,
      });

      await logInAndGotoCompany(token, invitation);
    },
  });

  return (
    <Forms.Form form={form}>
      {resetPassword ? (
        <>
          <Forms.FieldGroup>
            <Forms.PasswordInput
              label="Choose a password (minimum 12 characters)"
              field={"password"}
              minLength={12}
              maxLength={72}
            />
            <Forms.PasswordInput label="Repeat password" field="passwordConfirmation" minLength={12} maxLength={72} />
          </Forms.FieldGroup>

          <Forms.Submit saveText="Sign up &amp; Log in" />
        </>
      ) : (
        <Forms.Submit saveText="Accept &amp; Log in" />
      )}
    </Forms.Form>
  );
}

async function logInAndGotoCompany(token: string, invitation: Invitations.Invitation) {
  await logInWithInvitationToken(token, { redirectTo: `/${invitation.company!.id}` });
}
