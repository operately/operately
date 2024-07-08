import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";

import { FilledButton } from "@/components/Button";
import { TextInputNoLabel } from "@/components/Form";

import { useLoadedData } from "./loader";
import { useForm } from "./useForm";
import { Paths } from "@/routes/paths";
import { CopyToClipboard } from "@/components/CopyToClipboard";

export function Page() {
  const { company } = useLoadedData();
  const form = useForm();

  return (
    <Pages.Page title={["Invite new Member", company.name!]}>
      {!form.result && (
        <Paper.Root size="small">
          <Navigation />
          <Paper.Body minHeight="none">
            <div className="text-content-accent text-2xl font-extrabold">Invite a new Member</div>
            <PersonForm {...form} />
          </Paper.Body>

          <div className="my-8 text-center px-20">
            <span className="font-bold">What happens next?</span> You will get a invitation link to share with the new
            member which will allow them to join your company. It will be valid for 24 hours.
          </div>
        </Paper.Root>
      )}

      {form.result && (
        <Paper.Root size="medium">
          <Navigation />
          <Paper.Body minHeight="none">
            <div className="text-content-accent text-2xl font-extrabold">
              {form.fields.fullName} has been invited 🎉
            </div>

            <div className="mt-4">
              Share this link with them to allow them to join your company.
              <div className="mt-4 font-bold text-content-accent mb-1">Invitation Link</div>
              <div className="text-content-primary border border-surface-outline rounded-lg px-3 py-1 font-medium flex items-center justify-between">
                {form.result}

                <CopyToClipboard text={form.result} size={25} padding={1} containerClass="" />
              </div>
            </div>

            <div className="mt-2">This link will expire in 24 hours.</div>
          </Paper.Body>

          <div className="flex items-center gap-3 mt-8 justify-center">
            <FilledButton onClick={form.reset} type="primary" size="base">
              Invite Another Member
            </FilledButton>
          </div>
        </Paper.Root>
      )}
    </Pages.Page>
  );
}

function Navigation() {
  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={Paths.companyAdminPath()}>Company Administration</Paper.NavItem>
      <Paper.NavSeparator />
      <Paper.NavItem linkTo={Paths.companyManagePeoplePath()} testId="manage-people-link">
        Manage People
      </Paper.NavItem>
    </Paper.Navigation>
  );
}

function PersonForm({ fields, errors, submit, submitting }: ReturnType<typeof useForm>) {
  const managePeoplePath = Paths.companyManagePeoplePath();

  return (
    <div className="flex flex-col gap-4 mt-8">
      <div className="flex items-center justify-center">
        <div className="w-28 font-bold">Full Name</div>
        <div className="flex-1">
          <TextInputNoLabel
            id="fullName"
            value={fields.fullName}
            onChange={fields.setFullName}
            placeholder="e.g. John Doe"
            error={!!errors.find((e) => e.field === "fullName")?.message}
            data-test-id="person-full-name"
          />
        </div>
      </div>

      <div className="flex items-center justify-center">
        <div className="w-28 font-bold">Email</div>
        <div className="flex-1">
          <TextInputNoLabel
            id="email"
            value={fields.email}
            onChange={fields.setEmail}
            placeholder="e.g. john@yourcompany.com"
            error={!!errors.find((e) => e.field === "email")?.message}
            data-test-id="person-email"
          />
        </div>
      </div>

      <div className="flex items-center justify-center">
        <div className="w-28 font-bold">Title</div>
        <div className="flex-1">
          <TextInputNoLabel
            id="person-title"
            value={fields.title}
            onChange={fields.setTitle}
            placeholder="e.g. Software Engineer"
            error={!!errors.find((e) => e.field === "title")?.message}
            data-test-id="person-title"
          />
        </div>
      </div>

      {errors.map((e, idx) => (
        <div key={idx} className="text-red-500 text-sm">
          {e.message}
        </div>
      ))}

      <div className="flex items-center gap-3 mt-8">
        <FilledButton onClick={submit} type="primary" testId="submit" loading={submitting}>
          Invite Member
        </FilledButton>

        <FilledButton linkTo={managePeoplePath} type="secondary">
          Cancel
        </FilledButton>
      </div>
    </div>
  );
}
