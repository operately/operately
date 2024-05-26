import * as React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Forms from "@/components/Form";

import { Spacer } from "@/components/Spacer";
import { useForm } from "./useForm";


export function Page() {
  return (
    <Pages.Page title={"FirstTimeSetupPage"}>
      <Paper.Root>
        <Paper.Body>
          <div className="text-content-accent text-2xl font-extrabold">Welcome to Operately!</div>
          <div className="text-content-accent">Let&apos;s set up your company.</div>

          <Spacer size={6} />

          <Form />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Form() {
  const { fields, submit, submitting, errors } = useForm();

  return (
    <Forms.Form
      isValid={true}
      loading={submitting}
      onSubmit={submit}
    >
      <Forms.TextInput 
        label="Name of the company"
        placeholder="e.g. Acme Co."
        onChange={fields.setCompanyName}
        value={fields.companyName}
        error={!!errors.find((e) => e.field === "companyName")?.message}
        testId="company-name"
      />

      <Spacer />
      <AdminAccountTitle />
      <Spacer />

      <Forms.TextInput 
        label="Full name"
        placeholder="e.g. John Johnson"
        onChange={fields.setFullName}
        value={fields.fullName}
        error={!!errors.find((e) => e.field === "fullName")?.message}
        testId="full-name"
      />
      
      <Forms.TextInput 
        label="Role in the company"
        placeholder="e.g. Founder"
        onChange={fields.setRole}
        value={fields.role}
        error={!!errors.find((e) => e.field === "role")?.message}
        testId="role"
      />
      <Forms.TextInput 
        label="Email"
        placeholder="e.g. john@your-company.com"
        onChange={fields.setEmail}
        value={fields.email}
        error={!!errors.find((e) => e.field === "email")?.message}
        testId="email"
      />
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
        <div key={idx} className="text-red-500 text-sm">{e.message}</div>
      ))}

      <div className="flex items-center justify-center">
        <Forms.SubmitButton data-test-id="submit-form">
          Submit
        </Forms.SubmitButton>
      </div>
    </Forms.Form>
  )
}

function AdminAccountTitle() {
  return (
    <div className="flex items-center gap-2">
      <div className="bg-content-accent flex-1 h-[1px] bg-black"></div>
      <span className="text-content-accent text-center">ADMIN ACCOUNT</span>
      <div className="bg-content-accent flex-1 h-[1px] bg-black"></div>
    </div>
  )
}