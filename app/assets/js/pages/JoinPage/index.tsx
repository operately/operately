import { loader, useLoadedData } from "./loader";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Invitations from "@/models/invitations";
import * as People from "@/models/people";
import { PageModule } from "@/routes/types";
import * as React from "react";
import { Trans, useTranslation } from "react-i18next";

import { OperatelyLogo } from "@/components/OperatelyLogo";
import { SignInWithGoogleButton } from "@/features/auth/Buttons";
import { translationText } from "@/i18n";
import { logIn } from "@/routes/auth";

import { Forms } from "turboui";

export default { name: "JoinPage", loader, Page } as PageModule;

type LoadedData = NonNullable<ReturnType<typeof useLoadedData>>;

function Page() {
  const { t } = useTranslation();
  const data = useLoadedData();
  if (!data) return null;

  return (
    <Pages.Page title={translationText(t("Welcome to Operately!"))}>
      <Paper.Root size="small">
        <div className="mt-24"></div>

        <Paper.Body>
          <Header inviteLink={data.inviteLink} member={data.member} />
          <Form {...data} />
        </Paper.Body>
        <WhatHappensNext inviteLink={data.inviteLink} />
      </Paper.Root>
    </Pages.Page>
  );
}

function Header({ inviteLink, member }: Pick<LoadedData, "inviteLink" | "member">) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between mb-10">
      <div className="">
        <div className="text-content-accent text-2xl font-extrabold">{t("Welcome to Operately!")}</div>
        <div className="text-content-accent mt-1">
          <Trans
            i18nKey="You were invited by {{author}} to join {{company}}."
            values={{ author: inviteLink.author?.fullName, company: inviteLink.company?.name }}
          />
        </div>
        <div className="text-content-dimmed text-sm mt-2">
          <Trans
            i18nKey="You are joining as <name>{{name}}</name>"
            values={{ name: member.fullName }}
            components={{ name: <span className="font-semibold" /> }}
          />
          <span className="mx-1">&middot;</span>
          <span className="break-all">{member.email}</span>
        </div>
      </div>
      <OperatelyLogo width="40" height="40" />
    </div>
  );
}

function WhatHappensNext({ inviteLink }: Pick<LoadedData, "inviteLink">) {
  return (
    <div className="my-8 text-center px-20">
      <Trans
        i18nKey="<bold>What happens next?</bold> You will join the {{company}} company."
        values={{ company: inviteLink.company?.name }}
        components={{ bold: <span className="font-bold" /> }}
      />
    </div>
  );
}

function Form({ inviteLink, token, member }: LoadedData) {
  const { t } = useTranslation();
  const { mutateAsync: join } = Invitations.useJoinCompany();

  const form = Forms.useForm({
    fields: {
      password: "",
      passwordConfirmation: "",
    },
    validate: (addError) => {
      if (form.values.password !== form.values.passwordConfirmation) {
        addError("passwordConfirmation", t("Passwords do not match"));
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
              label={t("Choose a password (minimum 12 characters)")}
              field={"password"}
              minLength={12}
              maxLength={72}
            />
            <Forms.PasswordInput
              label={t("Repeat password")}
              field={"passwordConfirmation"}
              minLength={12}
              maxLength={72}
            />
          </Forms.FieldGroup>

          <Forms.Submit saveText={translationText(t("Set password & Log in"))} buttonSize="base" className="w-full" />
        </>
      )}

      {window.appConfig.allowLoginWithGoogle && <GoogleLogin member={member} />}
    </Forms.Form>
  );
}

async function logInAndGotoCompany(inviteLink: People.InviteLink, member: People.Person, password: string) {
  await logIn(member.email, password, { redirectTo: `/${inviteLink.company?.id}` });
}

function GoogleLogin({ member }: Pick<LoadedData, "member">) {
  return (
    <div>
      {window.appConfig.allowLoginWithEmail && <OrSeparator />}
      <div className="space-y-2">
        <SignInWithGoogleButton />
        <div className="text-xs text-content-dimmed">
          <Trans
            i18nKey="* If you sign in with Google, you must use <email>{{email}}</email>."
            values={{ email: member.email }}
            components={{ email: <span className="font-semibold break-all" /> }}
          />
        </div>
      </div>
    </div>
  );
}

function OrSeparator() {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-4 my-6 text-content-dimmed uppercase text-xs font-medium tracking-wide">
      <div className="border-t border-stroke-base flex-1" />
      {t("or")}
      <div className="border-t border-stroke-base flex-1" />
    </div>
  );
}
