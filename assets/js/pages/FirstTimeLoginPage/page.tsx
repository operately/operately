import * as React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Forms from "@/components/Form";

import { Spacer } from "@/components/Spacer";
import { useLoadedData } from "./loader";
import { useForm } from "./useForm";

export function Page() {
  const { invitation } = useLoadedData();

  return (
    <Pages.Page title="Welcome to Operately!">
      <Paper.Root>
        <Paper.Body>
          <div className="text-content-accent text-2xl font-extrabold text-center">
            Welcome to Operately, {invitation.member!.fullName}!
          </div>

          <Spacer size={8} />

          <div className="text-content-accent">
            You were invited by {invitation.admin!.fullName} to join {invitation.admin!.company!.name}.
          </div>
          <div className="text-content-accent">Please choose a password to activate your account.</div>

          <Spacer size={2} />

          <Form />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Form() {
  const { fields, submit, submitting, errors } = useForm();

  return (
    <Forms.Form isValid={true} loading={submitting} onSubmit={submit}>
      <Forms.TextInput
        label="Password"
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
        <div key={idx} className="text-red-500 text-sm">
          {e.message}
        </div>
      ))}

      <div className="flex items-center justify-center">
        <Forms.SubmitButton data-test-id="submit-form">Submit</Forms.SubmitButton>
      </div>
    </Forms.Form>
  );
}
