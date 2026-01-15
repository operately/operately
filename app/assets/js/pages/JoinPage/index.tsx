import Api from "@/api";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Accounts from "@/models/accounts";
import * as People from "@/models/people";
import { PageModule } from "@/routes/types";
import * as React from "react";

import { OperatelyLogo } from "@/components/OperatelyLogo";
import { SignInWithGoogleButton } from "@/features/auth/Buttons";
import { logIn } from "@/routes/auth";
import { redirect } from "react-router-dom";

import Forms from "@/components/Forms";

export default { name: "JoinPage", loader, Page } as PageModule;

interface LoaderResult {
  member: People.Person;
  inviteLink: People.InviteLink;
  token: string;
}

async function loader({ request }): Promise<any> {
  const token = Pages.getSearchParam(request, "token");
  if (!token) return redirect("/");

  const { inviteLink, member } = await Api.invitations.getInvitation({ token: token }).then((res) => res);

  if (!inviteLink) return redirect("/");

  return { inviteLink, member, token };
}

function Page() {
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
  const { inviteLink, member } = Pages.useLoadedData() as LoaderResult;

  return (
    <div className="flex items-center justify-between mb-10">
      <div className="">
        <div className="text-content-accent text-2xl font-extrabold">Welcome to Operately!</div>
        <div className="text-content-accent mt-1">
          You were invited by {inviteLink.author?.fullName} to join {inviteLink.company?.name}.
        </div>
        <div className="text-content-dimmed text-sm mt-2">
          You are joining as <span className="font-semibold">{member.fullName}</span>
          <span className="mx-1">&middot;</span>
          <span className="break-all">{member.email}</span>
        </div>
      </div>
      <OperatelyLogo width="40" height="40" />
    </div>
  );
}

function WhatHappensNext() {
  const { inviteLink } = Pages.useLoadedData() as LoaderResult;

  return (
    <div className="my-8 text-center px-20">
      <span className="font-bold">What happens next?</span> You will join the {inviteLink.company?.name} company.
    </div>
  );
}

function Form() {
  const [join] = Accounts.useJoinCompany();
  const { inviteLink, token, member } = Pages.useLoadedData() as LoaderResult;

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

      await logInAndGotoCompany(inviteLink, member, form.values.password.trim());
    },
  });

  return (
    <Forms.Form form={form}>
      {window.appConfig.allowLoginWithEmail && (
        <>
          <Forms.FieldGroup>
            <Forms.PasswordInput
              label="Choose a password (minimum 12 characters)"
              field={"password"}
              minLength={12}
              maxLength={72}
            />
            <Forms.PasswordInput
              label="Repeat password"
              field={"passwordConfirmation"}
              minLength={12}
              maxLength={72}
            />
          </Forms.FieldGroup>

          <Forms.Submit saveText="Set password &amp; Log in" buttonSize="base" className="w-full" />
        </>
      )}

      {window.appConfig.allowLoginWithGoogle && <GoogleLogin />}
    </Forms.Form>
  );
}

async function logInAndGotoCompany(inviteLink: People.InviteLink, member: People.Person, password: string) {
  await logIn(member.email, password, { redirectTo: `/${inviteLink.company?.id}` });
}

function GoogleLogin() {
  const { member } = Pages.useLoadedData() as LoaderResult;

  return (
    <div>
      {window.appConfig.allowLoginWithEmail && <OrSeparator />}
      <div className="space-y-2">
        <SignInWithGoogleButton />
        <div className="text-xs text-content-dimmed">
          * If you sign in with Google, you must use{" "}
          <span className="font-semibold break-all">{member.email}</span>.
        </div>
      </div>
    </div>
  );
}

function OrSeparator() {
  return (
    <div className="flex items-center gap-4 my-6 text-content-dimmed uppercase text-xs font-medium tracking-wide">
      <div className="border-t border-stroke-base flex-1" />
      or
      <div className="border-t border-stroke-base flex-1" />
    </div>
  );
}
