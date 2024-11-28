import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Accounts from "@/models/accounts";
import * as Invitations from "@/models/invitations";

import { OperatelyLogo } from "@/components/OperatelyLogo";
import { logIn } from "@/routes/auth";
import { redirect } from "react-router-dom";

import Forms from "@/components/Forms";

interface LoaderResult {
  invitation: Invitations.Invitation;
  token: string;
}

export async function loader({ request }): Promise<any> {
  const token = Pages.getSearchParam(request, "token");
  if (!token) return redirect("/");

  const invitation = await Invitations.getInvitation({ token: token }).then((res) => res.invitation!);
  if (!invitation) return redirect("/");

  return { invitation, token };
}

export function Page() {
  return (
    <Pages.Page title="Welcome to Operately!">
      <Paper.Root size="small">
        <div className="mt-24"></div>

        <Paper.Body>
          <Header />
          <Form />
        </Paper.Body>
        <WhatHappensNext />
      </Paper.Root>
    </Pages.Page>
  );
}

function Header() {
  const { invitation } = Pages.useLoadedData() as LoaderResult;

  return (
    <div className="flex items-center justify-between mb-10">
      <div className="">
        <div className="text-content-accent text-2xl font-extrabold">Welcome to Operately!</div>
        <div className="text-content-accent mt-1">
          You were invited by {invitation.admin!.fullName} to join {invitation.company!.name}.
        </div>
      </div>
      <OperatelyLogo width="40" height="40" />
    </div>
  );
}

function WhatHappensNext() {
  const { invitation } = Pages.useLoadedData() as LoaderResult;

  return (
    <div className="my-8 text-center px-20">
      <span className="font-bold">What happens next?</span> You will join the {invitation.company!.name} company and get
      access to the Operately platform.
    </div>
  );
}

function Form() {
  const [join] = Accounts.useJoinCompany();
  const { invitation, token } = Pages.useLoadedData() as LoaderResult;

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
        password: form.values.password.trim(),
        passwordConfirmation: form.values.passwordConfirmation.trim(),
      });

      await logInAndGotoCompany(invitation, form.values.password.trim());
    },
  });

  return (
    <Forms.Form form={form}>
      <Forms.FieldGroup>
        <Forms.PasswordInput
          label="Choose a password (minimum 12 characters)"
          field={"password"}
          minLength={12}
          maxLength={72}
        />
        <Forms.PasswordInput label="Repeat password" field={"passwordConfirmation"} minLength={12} maxLength={72} />
      </Forms.FieldGroup>

      <Forms.Submit saveText="Sign up &amp; Log in" />
    </Forms.Form>
  );
}

async function logInAndGotoCompany(invitation: Invitations.Invitation, password: string) {
  await logIn(invitation.member!.email!, password, { redirectTo: `/${invitation.company!.id}` });
}
