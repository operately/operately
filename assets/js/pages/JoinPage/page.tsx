import * as React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Forms from "@/components/Form";

import { useLoadedData } from "./loader";
import { useForm } from "./useForm";
import { Logo } from "@/layouts/DefaultLayout/Logo";
import { FilledButton } from "@/components/Button";

export function Page() {
  const { invitation } = useLoadedData();

  return (
    <Pages.Page title="Welcome to Operately!">
      <Paper.Root size="small">
        <div className="mt-24"></div>

        <Paper.Body>
          <div className="flex items-center justify-between mb-10">
            <div className="">
              <div className="text-content-accent text-2xl font-extrabold">Welcome to Operately!</div>
              <div className="text-content-accent mt-1">
                You were invited by {invitation.admin!.fullName} to join {invitation.company!.name}.
              </div>
            </div>
            <Logo width="40" height="40" />
          </div>

          <Form />
        </Paper.Body>

        <div className="my-8 text-center px-20">
          <span className="font-bold">What happens next?</span> You will join the {invitation.company!.name} company and
          get access to the Operately platform.
        </div>
      </Paper.Root>
    </Pages.Page>
  );
}

function Form() {
  const { fields, submit, submitting, errors } = useForm();

  return (
    <div className="flex flex-col gap-6">
      <Forms.TextInput
        label="Choose a password (minimum 12 characters)"
        onChange={fields.setPassword}
        value={fields.password}
        error={!!errors.find((e) => e.field === "password")?.message}
        type="password"
        testId="password"
      />
      <Forms.TextInput
        label="Repeat password"
        onChange={fields.setPasswordConfirmation}
        value={fields.passwordConfirmation}
        error={!!errors.find((e) => e.field === "passwordConfirmation")?.message}
        type="password"
        testId="password-confirmation"
      />

      {errors.map((e, idx) => (
        <div key={idx} className="text-content-error text-sm">
          {e.message}
        </div>
      ))}

      <div className="flex items-center mt-4">
        <FilledButton type="primary" onClick={submit} loading={submitting} testId="submit-form">
          Sign up &amp; Log in
        </FilledButton>
      </div>
    </div>
  );
}
